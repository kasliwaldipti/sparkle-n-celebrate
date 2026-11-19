import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";
import { siteConfig } from "@/config/site";
import { CHAT_SYSTEM_PROMPT, WEBHOOK_SYSTEM_PROMPT } from "@/lib/agent/prompts";
import { executeTool, toolDefinitions, type AgentScope } from "@/lib/agent/tools";

// Hard cap on model round-trips per run, so a confused loop can't run up cost.
const MAX_ITERATIONS = 8;

let client: Anthropic | undefined;

export interface RunAgentInput {
  scope: AgentScope;
  /** Prior turns plus the new user message. The first message must be from the user. */
  messages: Anthropic.MessageParam[];
}

export interface RunAgentResult {
  text: string;
  iterations: number;
  stopReason: string | null;
}

const FALLBACK_TEXT = `Sorry, I couldn't look that up right now. Please try again, or email us at ${siteConfig.contact.email}.`;

/** Tool-use loop: call Claude, run any requested tools (ownership-checked and logged), repeat. */
export async function runAgent({ scope, messages }: RunAgentInput): Promise<RunAgentResult> {
  client ??= new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  const model = requireEnv("ANTHROPIC_MODEL");
  const system = scope.trigger === "CHAT" ? CHAT_SYSTEM_PROMPT : WEBHOOK_SYSTEM_PROMPT;
  const history = [...messages];

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      system,
      tools: toolDefinitions,
      messages: history,
    });

    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      // All results go back in a single user message.
      const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (t) => {
          const r = await executeTool(scope, t.name, t.input);
          return { type: "tool_result", tool_use_id: t.id, content: r.content, is_error: !r.ok };
        }),
      );
      history.push({ role: "user", content: results });
      continue;
    }

    if (response.stop_reason === "pause_turn") continue;

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      return { text: FALLBACK_TEXT, iterations: i, stopReason: response.stop_reason };
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { text: text || FALLBACK_TEXT, iterations: i, stopReason: response.stop_reason };
  }

  return { text: FALLBACK_TEXT, iterations: MAX_ITERATIONS, stopReason: "max_iterations" };
}
