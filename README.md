# Sparkle N' Celebrate

Online jewellery store for **Sparkle N' Celebrate**: a customer storefront, an admin area, and an AI order-update agent.

- **Store**: catalogue, product pages, cart, Razorpay checkout, sign-in, order history with status, and a "where's my order?" chat on My Orders.
- **Admin**: product and photo uploads (Cloudinary), inventory, dashboard (sales and product numbers), orders, and an approval queue.
- **Order agent** (Claude with tool use):
  - Proactive: AfterShip webhook → Inngest job → agent → personalised email (Resend) / SMS (Twilio).
  - Reactive: answers chat questions from real order and tracking data.
  - Refunds, cancellations and address changes are never automatic. They go to the admin approval queue.

> This is a scaffold. Routing, layouts, schema and integrations are wired up; anything still to build is marked `TODO`.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 + shadcn/ui · Prisma 7 + Neon Postgres · Auth.js v5 · Cloudinary · Razorpay · Resend · Twilio · Inngest · AfterShip · Anthropic SDK · Recharts · TanStack Table · Zod · Vitest

## Requirements

- Node.js **20.9+** (`.nvmrc` pins 20; run `nvm use`)
- A [Neon](https://neon.tech) Postgres database
- Accounts/keys for the services listed in `.env.example`

## Setup

```bash
nvm use                      # Node 20
npm install                  # also generates the Prisma client
cp .env.example .env         # then fill in the values
npx auth secret              # writes AUTH_SECRET to .env.local (or set it in .env yourself)
npm run db:migrate           # creates tables (first run: name the migration "init")
npm run db:seed              # categories, 6 sample products, admin + customer users
npm run dev                  # http://localhost:3000
```

To run background jobs locally, start the Inngest dev server in a second terminal and set `INNGEST_DEV=1` in `.env`:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

To try the AfterShip webhook locally, expose your dev server (e.g. with a tunnel) and point a test webhook at `/api/webhooks/aftership`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (`.next/standalone`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (CI/production) |
| `npm run db:seed` | Seed sample data |

## Project layout

See [CLAUDE.md](./CLAUDE.md) for the folder map and conventions, and [DEPLOY.md](./DEPLOY.md) for deploying to cPanel.
