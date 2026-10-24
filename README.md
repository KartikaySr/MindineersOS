## MindineersOS web workspace

The standalone frontend lives in [`apps/mindineers-web`](apps/mindineers-web). For Vercel, import this repository, leave Root Directory at `.` and deploy. The root `vercel.json` installs and builds only this frontend, without running the Bun monorepo or starting backend/database services. No backend credentials are needed for the frontend build.

```sh
npm ci --prefix apps/mindineers-web --workspaces=false
npm run dev --prefix apps/mindineers-web
```

The latest frontend expansion adds finance/procurement, scoped delivery, operational checklists, scenario comparisons, evaluation reports, improvement reviews, evidence mapping, reviewed document edits, and security incident/access-review records. Deployment hardening includes restrictive CSP headers and validated backup imports. See [frontend security](apps/mindineers-web/SECURITY_FRONTEND.md).

Phase 1 adds a strict TypeScript foundation, typed local storage and service boundaries, centralized routes, shared controls, and persistent unsaved-work recovery. See the [Phase 1 report](apps/mindineers-web/PHASE_1_FOUNDATION.md). Later phases require explicit approval.

Phase 2 adds typed identity journeys and organization/access/session interfaces, integration lifecycle review requests, and subscription-management drafts. Services remain disconnected. See the [Phase 2 report](apps/mindineers-web/PHASE_2_ADMINISTRATION.md).

The frontend supports local editing and optional example content. AI execution, authentication, integrations and cloud storage are not connected. This is not yet the complete full-scope product: see the [frontend status](apps/mindineers-web/FRONTEND_STATUS.md) and [deployment guide](apps/mindineers-web/README.md). The existing framework documentation below describes the inherited repository, not features verified in the new frontend.

---

<div align="center">
  <h1>🧠 MindineersOS</h1>
  <p><strong>The Sovereign AI Agent Operating System</strong></p>
  <p>Built by Kartikay Srivastava · Mindineers Labs</p>
  <br/>
  <p>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" />
    <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </p>
</div>

---

## What is MindineersOS?

MindineersOS is a sovereign, enterprise-grade AI agent operating system. It provides a
complete runtime for building, deploying, and orchestrating autonomous AI agents — from
conversational chatbots and business process automation to multi-agent collaboration systems.

Built on a modular plugin architecture with **150+ integrations**, MindineersOS gives you
full control over every stage of your agents' lifecycle: development, deployment,
monitoring, and scaling — all from a single platform.

## ✨ Key Features

- 🧠 **Multi-Agent Orchestration** — Create and coordinate groups of specialized agents
- 🔌 **150+ Plugins** — Discord, Telegram, Slack, X, WhatsApp, and more out of the box
- 🤖 **Model Agnostic** — Gemini, OpenAI, Anthropic, Llama, Ollama, Groq, and 10+ providers
- 🖥️ **Real-Time Dashboard** — Professional web UI for agent management and live conversations
- 📄 **Document Intelligence** — RAG pipeline for ingesting and querying your documents
- 🔐 **Enterprise Security** — Auth, vault, SOC2 verification, key management
- 📱 **Cross-Platform** — Web, iOS, Android, Desktop (Electrobun)
- ⚡ **Blazing Fast** — Bun runtime, optimized builds, sub-second response times

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) (latest)
- [Node.js](https://nodejs.org/) v24+
- [Gemini API Key](https://aistudio.google.com/apikey) (free)

### Installation

```bash
git clone <your-repo-url> mindineeros
cd mindineeros
bun install
```

### Configuration

```bash
cp .env.example .env
# Edit .env — add your keys:
#   GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
#   POSTGRES_URL=your-supabase-postgres-url  (or use PGLite locally)
```

### Launch

```bash
bun run dev
# Dashboard opens at http://localhost:3000
```

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        MindineersOS                          │
│                      by Mindineers Labs                      │
├──────────────────────────────────────────────────────────────┤
│  AI Layer       │ Gemini · OpenAI · Anthropic · Ollama       │
│  Runtime        │ Agent Loop · Memory · State · Actions      │
│  Plugins        │ 150+ Connectors & Capabilities             │
│  Dashboard      │ React 19 · Vite 8 · Real-time WebSocket   │
│  Database       │ PostgreSQL · Supabase · PGLite · pgvector  │
│  Security       │ Auth · Vault · SOC2 · Key Management       │
└──────────────────────────────────────────────────────────────┘
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun + Node 24, ESM only |
| Language | TypeScript 6.x |
| Frontend | React 19, Vite 8, TailwindCSS 4 |
| API Server | Hono Framework |
| Database | PostgreSQL (Supabase), Drizzle ORM, pgvector |
| AI | Google Gemini (primary), multi-provider support |
| Testing | Vitest, Playwright |
| Deploy | Docker, Railway, Render, VPS |

## 📦 Monorepo Structure

```
packages/          ← core framework and product surfaces
  core/            # Runtime, types, agent loop, memory, model layer
  agent/           # AgentRuntime, plugin loader
  app-core/        # API server + dashboard host
  app/             # Web + desktop dashboard (Vite + React)
  ui/              # Shared React component library
  prompts/         # Shared prompt scaffolding
  shared/          # Cross-package utilities + brand assets
  examples/        # 30+ standalone runnable examples
  benchmarks/      # 30+ evaluation suites

plugins/           ← runtime plugins
  plugin-google-genai/   # Gemini AI provider
  plugin-sql/            # PostgreSQL / Supabase adapter
  plugin-discord/        # Discord connector
  plugin-telegram/       # Telegram connector
  ... 150+ more
```

## 🚢 Deployment

See [deploy/README.md](deploy/README.md) for full instructions.

### Docker (recommended)
```bash
docker-compose up -d
```

### Manual
```bash
bun install
bun run build
NODE_ENV=production bun run start
```

### Cloud Platforms
- **Railway.app** — one-click deploy (free tier)
- **Render.com** — auto-deploy from Git (free tier)
- **Any VPS** — bare-metal with systemd

## 📋 Working in the Monorepo

```bash
bun install            # workspace install
bun run dev            # API + Vite UI
bun run build          # turbo build across workspace
bun run lint           # biome lint
bun run typecheck      # TypeScript check
bun run test           # full test suite
bun run verify         # typecheck + lint combined
```

## 📄 License

MIT — see [LICENSE](LICENSE).

## 👨‍💻 Author

Built by **Kartikay Srivastava** at **Mindineers Labs**.

Copyright © 2026 Mindineers Labs. All rights reserved.
