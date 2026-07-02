# MindineersOS — Deployment Guide

> Built by Kartikay Srivastava at Mindineers Labs

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| [Bun](https://bun.sh) | Latest | Runtime + package manager |
| [Node.js](https://nodejs.org) | v24+ | Runtime compatibility |
| [Gemini API Key](https://aistudio.google.com/apikey) | — | AI provider (free tier) |

## Option 1: Local Development (Fastest)

```bash
# 1. Clone and install
git clone <your-repo-url> mindineeros
cd mindineeros
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env → add GOOGLE_GENERATIVE_AI_API_KEY

# 3. Launch
bun run dev
# Dashboard: http://localhost:3000
```

PGLite is used by default for local development — no external database required.

## Option 2: Docker

```bash
# 1. Configure
cp .env.example .env
# Edit .env → add your API keys

# 2. Build and run
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# Dashboard: http://localhost:3000
```

## Option 3: Railway (Free Tier)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repo
4. Add environment variables in Railway dashboard:
   - `GOOGLE_GENERATIVE_AI_API_KEY` = your Gemini key
   - `POSTGRES_URL` = your Supabase connection string
   - `NODE_ENV` = production
   - `SERVER_PORT` = 3000
   - `ELIZA_UI_ENABLE` = true
5. Railway auto-detects the Dockerfile and deploys
6. Access via the generated Railway URL

## Option 4: Render (Free Tier)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Environment**: Docker
   - **Plan**: Free
5. Add environment variables (same as Railway above)
6. Deploy

> **Note**: Free tier spins down after 15 min inactivity. First request after sleep takes ~30s.

## Option 5: VPS (DigitalOcean / Hetzner)

```bash
# SSH into your VPS
ssh user@your-server

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone <your-repo-url> mindineeros
cd mindineeros
bun install
cp .env.example .env
# Edit .env with your keys

# Build for production
bun run build

# Start with systemd (see deploy/systemd/)
# Or run directly:
NODE_ENV=production bun run start
```

## Supabase Database Setup

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project** (free tier)
3. Set a database password (save it!)
4. Wait for project to provision (~2 min)
5. Go to **Settings** → **Database** → **Connection string** → **URI**
6. Copy the connection string and set it as `POSTGRES_URL` in your `.env`:

```
POSTGRES_URL=postgresql://postgres.[your-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Enable pgvector (for agent memory)

In Supabase Dashboard → **SQL Editor**, run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Gemini API Key Setup

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key and set as `GOOGLE_GENERATIVE_AI_API_KEY` in `.env`

Free tier limits:
- Gemini 2.0 Flash: 1,500 requests/day
- Gemini 2.5 Flash: 500 requests/day

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | Gemini AI provider key |
| `POSTGRES_URL` | Optional | Supabase PostgreSQL URL (prod) |
| `PGLITE_DATA_DIR` | Optional | Local PGLite path (dev) |
| `SERVER_PORT` | Optional | Server port (default: 3000) |
| `NODE_ENV` | Optional | development / production |
| `ELIZA_UI_ENABLE` | Optional | Enable web dashboard |
| `ELIZA_SERVER_AUTH_TOKEN` | Optional | API authentication token |

## Troubleshooting

### Build fails with memory error
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
bun run build
```

### Port 3000 already in use
```bash
SERVER_PORT=3001 bun run dev
```

### Database connection refused
- Check `POSTGRES_URL` format
- Ensure Supabase project is active
- Try PGLite for local dev: `PGLITE_DATA_DIR=./.eliza/pglite`

---

**MindineersOS** — Copyright © 2026 Kartikay Srivastava / Mindineers Labs
