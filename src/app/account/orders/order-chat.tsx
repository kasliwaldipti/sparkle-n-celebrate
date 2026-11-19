"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Plain POST to /api/chat (no streaming or WebSockets, which suits cPanel/Passenger).
export function OrderChat({ orderId }: { orderId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, orderId }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Couldn't reach the assistant. Please try again." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      {/* TODO: load previous ChatMessage history on mount. */}
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Try: &ldquo;Where&apos;s my order?&rdquo;</p>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={
              m.role === "user"
                ? "ml-auto w-fit max-w-[80%] rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                : "w-fit max-w-[80%] whitespace-pre-line rounded-lg bg-muted px-3 py-2"
            }
          >
            {m.content}
          </p>
        ))}
        {pending && <p className="text-sm text-muted-foreground">Checking your order…</p>}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask about your order…"
          rows={2}
          maxLength={2000}
        />
        <Button onClick={() => void send()} disabled={pending}>
          Send
        </Button>
      </div>
    </div>
  );
}
