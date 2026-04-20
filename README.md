# Menza

A BI (business intelligence) chat application that lets users query and
visualize their business data through natural language conversations.

## Architecture

This is a **pnpm workspaces monorepo** with 8 packages:

```
packages/
├── app/        Next.js 15 — chat UI, tRPC, auth
├── server/     Hono — chat endpoints, SSE streaming
├── worker/     BullMQ — LLM agent execution, title generation
├── db/         Drizzle ORM — Postgres schema, migrations, seed
├── llm/        LLM agent framework — Anthropic SDK, tools, streaming
├── queue/      BullMQ — typed job definitions, Redis connection
├── ui/         Component library — Base UI + Tailwind
└── icons/      SVG icon components
```

### How it fits together

```
Browser (Next.js app on :3000)
  │
  ├── tRPC ──── Next.js API routes ──── Postgres (conversations, messages, widgets)
  │                                         ↑
  ├── POST /chat ──── Hono server (:3001) ──┤
  │                       │                  │
  │                       ▼                  │
  │                   BullMQ job ───► Worker  │
  │                                   │      │
  │                                   ▼      │
  │                               DataAgent ─┘
  │                                   │
  │                                   ├── exec_sql ──► DuckDB (analytical data)
  │                                   ├── show_widget ──► WidgetAgent (nested)
  │                                   │
  │                                   ▼
  └── SSE ◄──── Redis Streams ◄── StreamEmitter
```

1. **User sends a message** — the Next.js app calls `POST /chat` on the Hono
   server.
2. **Server enqueues a job** — the message is saved to Postgres and a
   `run-agent` job is added to BullMQ.
3. **Worker picks up the job** — creates a `DataAgent` with tools (`exec_sql`,
   `show_widget`) and runs the agentic loop.
4. **Agent streams events** — text deltas, tool calls, thinking blocks, and
   completion events are published to a Redis Stream via `StreamEmitter`.
5. **SSE delivers events** — the Hono server's `/stream` endpoint reads from
   Redis Streams (`XREAD BLOCK`) and forwards events as SSE to the browser.
6. **Frontend updates in real-time** — the `useChatSSE` hook processes events
   and updates the React Query cache (messages, status, title).

### Agent system

The LLM layer uses a two-agent architecture:

- **DataAgent** — the main conversational agent. Has `exec_sql` (query DuckDB)
  and `show_widget` (delegate to WidgetAgent) tools. Runs an agentic loop:
  stream response → execute tools → loop if `shouldRunAgain`.
- **WidgetAgent** — a nested agent spawned by `show_widget`. Creates a child
  conversation, explores data with `exec_sql`, then outputs a chart/table/metric
  config via `create_visual`. Returns the widget config to the parent.

Both agents use Anthropic's Claude with extended thinking and prompt caching.

### Data

- **Application data** (Postgres) — users, conversations, messages, widgets.
  Managed by Drizzle ORM with migrations.
- **Analytical data** (DuckDB) — a committed `warehouse.duckdb` file containing
  sample business data (e-commerce, marketing). The `exec_sql` tool queries this
  read-only.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/) v10 (`corepack enable && corepack prepare pnpm@10.18.3 --activate`)
- [Docker](https://www.docker.com/) (for Postgres + Redis)

### 1. Install dependencies

```sh
pnpm install
```

### 2. Start infrastructure

```sh
docker compose up -d
```

This starts:

- **Postgres 16** on port 5432 (user: `demo`, password: `demo`, database: `menza_demo`)
- **Redis 7** on port 6379

### 3. Configure environment

```sh
cp .env.example .env
```

Edit `.env` and add your API keys:

```sh
ANTHROPIC_API_KEY=sk-ant-...    # Required — powers the chat agent
GOOGLE_AI_API_KEY=...            # Required — powers conversation title generation
OPENAI_API_KEY=...               # Required — powers memory embeddings/retrieval
```

The database and Redis URLs default to the docker-compose values. `AUTH_SECRET`
can be any random string.

Environment variables are loaded via [`dotenvx`](https://dotenvx.com/) from the
root `.env` file. All package scripts that need env vars are prefixed with
`dotenvx run -f ../../.env --`.

### 4. Set up the database

Build the db package (required for migration generation), apply migrations, and
seed demo data:

```sh
pnpm --filter=@demo/db build
pnpm db:migrate
pnpm db:seed
```

This creates a demo user you can log in with:

- **Email:** `demo@menza.ai`
- **Password:** `password123`

### 5. Build library packages

The server and worker depend on compiled output from `db`, `queue`, and `llm`:

```sh
pnpm --filter=@demo/db build
pnpm --filter=@demo/queue build
pnpm --filter=@demo/llm build
pnpm --filter=@demo/icons build
```

Or build everything at once:

```sh
pn --filter=\!@demo/app run build

```

The app package is filtered out as it is expected to fail. Dev will work fine though.

### 6. Start development

```sh
pnpm dev
```

You can also run dev on each service separately if you'd like, either by running from root:
```sh
pnpm --filter=@demo/app run dev
pnpm --filter=@demo/server run dev
```
Or from the package directory:
```sh
cd packages/server
pnpm dev
```

This starts all three dev servers in parallel:

| Service | Port | Command |
| --- | --- | --- |
| Next.js app | 3000 | `next dev --webpack` |
| Hono server | 3001 | `tsx watch src/index.ts` |
| BullMQ worker | — | `tsx watch src/index.ts` |

Open [http://localhost:3000](http://localhost:3000) and log in with the demo
credentials.

---

## Commands

All commands are run from the monorepo root.

### Development

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all dev servers in parallel |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages (Biome) |
| `pnpm format` | Format all files (Prettier) |
| `pnpm format:check` | Check formatting without writing |

### Database

| Command | Description |
| --- | --- |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:generate` | Generate migrations from schema changes (build `@demo/db` first) |
| `pnpm db:seed` | Seed the database with the demo user and org |
| `pnpm db:studio` | Open Drizzle Studio on port 3002 |

### Per-package

You can target a specific package with `--filter`:

```sh
pnpm --filter=@demo/app typecheck    # Typecheck just the app
pnpm --filter=@demo/llm build        # Build just the llm package
pnpm --filter=@demo/server dev       # Start just the Hono server
```

### Cleanup

| Command | Description |
| --- | --- |
| `pnpm clean` | Remove all `node_modules` and `dist` directories |
| `docker compose down -v` | Stop and remove Postgres + Redis containers and volumes |

---

## Package overview

### `@demo/app` — Next.js application

The frontend. A chat interface with a sidebar listing past conversations.

- **Auth:** Simple email/password login with JWT cookies (no external auth
  provider). Middleware redirects unauthenticated requests to `/login`.
- **tRPC:** `createTRPCReact` client with `httpBatchStreamLink`. Server-side RSC
  caller with hydration helpers. Routers: `chat` (conversations, messages) and
  `widget` (fetch by ID).
- **Chat:** Messages rendered with `react-markdown` + `remark-gfm`. Suggestion
  tags parsed from assistant responses. Widget placeholders for charts, tables,
  and metrics.
- **SSE:** `useChatSSE` hook connects to the Hono server's `/stream` endpoint
  via `eventsource-client`. Updates React Query cache in real-time.

### `@demo/server` — Hono API server

Separate HTTP server on port 3001 handling chat creation and SSE streaming.

- `POST /chat` — Create a new conversation with an optional initial message.
  Enqueues a `run-agent` BullMQ job.
- `POST /chat/:conversationId` — Send a message to an existing conversation.
- `GET /stream?channel=conversation.{id}` — SSE endpoint. Reads from a Redis
  Stream using `XREAD BLOCK` and forwards events to the client. Supports
  reconnection via `Last-Event-ID`.
- JWT auth middleware validates tokens from the `Authorization` header or
  `auth-token` cookie.

### `@demo/worker` — BullMQ worker

Processes background jobs from the `main` queue.

- **`run-agent`** — Creates a `DataAgent`, injects data source context, runs the
  agentic loop, streams events to Redis. Enqueues title generation after the
  first successful run.
- **`generate-conversation-title`** — Uses Gemini Flash Lite to generate a short
  title from the conversation history. Updates the DB and emits a
  `chat.title.created` stream event.

### `@demo/db` — Database

Drizzle ORM with PostgreSQL. See [`packages/db/README.md`](packages/db/README.md)
for the migration workflow and full export map.

**Tables:** `user`, `organization`, `org_member`, `conversation`, `message`,
`widget`.

**Widget types** (Zod schemas): `ag-integrated` (AG Charts), `table` (AG Grid),
`metric` (template-based KPI cards).

### `@demo/llm` — LLM agent framework

The core AI layer. Depends on Anthropic SDK directly (no abstraction layer).

- **`AnthropicService`** — Streaming completions with prompt caching, retry,
  context limit detection, and abort support.
- **`BaseChatAgent`** — The agentic loop: fetch messages → stream LLM → process
  text/thinking/tool calls → execute tools → loop on `shouldRunAgain`.
- **`DataAgent`** / **`WidgetAgent`** — Domain-specific agents built on
  `BaseChatAgent`.
- **Tools:** `exec_sql` (DuckDB queries), `show_widget` (delegates to
  WidgetAgent), `create_visual` (outputs widget config).
- **Stream infrastructure:** `StreamEmitter` (Redis `XADD`), `StreamListener`
  (Redis `XREAD`), 17 typed event definitions.

### `@demo/queue` — Job queue

BullMQ queue definitions and Redis connection. See
[`packages/queue/README.md`](packages/queue/README.md).

Three job types: `run-agent`, `generate-conversation-title`,
`update-widget-in-chat`.

### `@demo/ui` — Component library

~11 components built on `@base-ui/react` and `tailwind-variants`. Exports
TypeScript source directly — Next.js transpiles via `transpilePackages`. Light
mode only with OKLCH color tokens.

### `@demo/icons` — Icons

SVG icon components from the Pika icon set. ~12 icons across 6 categories.
Compiled package (TypeScript → JavaScript).

---

## Code conventions

- **TypeScript** — Strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.
  Never use `any` — use `unknown` and narrow with type guards.
- **Formatting** — Prettier. Double quotes, semicolons, trailing commas, 80 char
  width, 2 space indent.
- **Linting** — Biome. Formatting disabled (Prettier handles it). Strict rules
  including `noExplicitAny`, `useAwait`, `useConsistentArrayType` (generic
  syntax: `Array<T>` not `T[]`).
- **Imports** — Inline type imports (`import { type Foo, bar } from "module"`).
  Sorted by Prettier plugin (React → third-party → `@/` alias → relative).
- **IDs** — Prefixed ULIDs via `createID("entity")` → `"entity_01HQ3..."`.
