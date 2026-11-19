@AGENTS.md

# Sparkle N' Celebrate

Online jewellery store for Sparkle N' Celebrate (India, INR). Three parts:
- **Store**: catalogue, cart, Razorpay checkout, sign-in, My Orders (status + chat).
- **Admin** (role ADMIN): products/photos (Cloudinary), inventory, dashboard, orders, approval queue.
- **Order agent**: Claude tool-use loop. Proactive (AfterShip webhook → Inngest → email/SMS) and reactive (My Orders chat).

## Stack
Next.js 16 App Router (Cache Components on; `src/proxy.ts`, not middleware) · React 19 · TS strict · Tailwind 4 + shadcn/ui (Base UI: no `asChild`, use `buttonVariants()` on links) · Prisma 7 + `@prisma/adapter-pg` on Neon (client generated to `src/generated/prisma`) · Auth.js v5 (JWT sessions) · Zod 4 · Vitest · Inngest v4 · Anthropic SDK · Recharts · TanStack Table v9.

## Commands
Use Node 20 (`nvm use`).
- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` · `npm run typecheck` · `npm test`
- `npm run db:migrate` (dev) · `npm run db:deploy` (CI) · `npm run db:seed`

## Folder map
- `src/app/(store)`: home, products, product/[slug], cart, checkout (+ `actions.ts`)
- `src/app/(auth)/sign-in`: sign-in page and action
- `src/app/account/orders`: My Orders list, order detail, `order-chat.tsx`
- `src/app/admin`: dashboard, products (+ actions), orders, approvals (+ actions)
- `src/app/api`: `auth`, `chat`, `inngest`, `cloudinary/sign`, `webhooks/razorpay`, `webhooks/aftership`
- `src/lib`: service clients (`db`, `auth`, `cloudinary`, `razorpay`, `email`, `sms`, `inngest`, `aftership`), `money.ts`, `validators/`, `queries/`
- `src/lib/agent`: `agent.ts` (loop), `tools.ts` (tools, ownership checks, AgentAction logging), `prompts.ts`
- `src/inngest/functions`: background jobs (`shipment.updated`)
- `src/config/site.ts`: brand name, tagline, contact details
- `src/components`: `ui/` (shadcn), `layout/`, `store/`, `admin/`
- `src/tests`: Vitest unit tests · `prisma/`: schema, migrations, seed

## Conventions
- Server Components by default; `"use client"` only for interactivity.
- Server Actions for data changes; route handlers only for webhooks, the chat, Inngest and Auth.
- Validate every input with Zod (forms, actions, route bodies, webhooks, agent tool inputs).
- Money is integer paise (`Int`) everywhere; convert to rupees only for display (`formatPaise`).
- No secrets in client code; only `NEXT_PUBLIC_*` may reach the browser. Server modules import `server-only`.
- The brand name always comes from `siteConfig` in `src/config/site.ts`; never hard-code it.
- With Cache Components, anything that reads the DB, cookies or session goes inside `<Suspense>`. Use `getCurrentUser()`, which calls `connection()`.

## Agent rules
- Tools only read the requesting user's own orders (CHAT scope), or only the order the verified webhook refers to (WEBHOOK scope). The scope is built by the server, never by the model.
- Refunds, cancellations and address changes always go through `ApprovalRequest` (`escalate_to_admin`); the agent never performs them.
- Every tool call, including failures and unknown tools, is logged to `AgentAction`.
- Model name comes from `ANTHROPIC_MODEL`.

## Security
- Role checks happen on the server (`requireRole`, `requireAdminPage`); the proxy is only a first gate. Never trust the client.
- Always verify webhook signatures (Razorpay `x-razorpay-signature`, AfterShip `aftership-hmac-sha256`) against the raw body before parsing.
- Checkout re-reads prices from the DB; never trust client prices.

## Deployment
- cPanel via Passenger: `output: "standalone"`, built in GitHub Actions, uploaded over SFTP, restarted via `tmp/restart.txt`. See DEPLOY.md.
- Production migrations are applied manually (`npm run db:deploy`), not by CI.
- Never build on the server. No Edge runtime, no WebSockets, no long-running processes or in-process timers, no native modules (CI fails if a `.node` file appears in the bundle). Background work only via Inngest.

## Don't
- Don't edit migrations that have already been applied; create a new one.
- Don't add new dependencies without saying why (and check they need no native build).
