# Taskflow

Multi-tenant Project & Task API (Express 5 + Drizzle + BullMQ).

## Prerequisites
- Docker 29+ & Docker Compose 5.4+
- Node 26 / pnpm 11 (only for local dev without Docker)
- `.env` at project root (see below)

## Env
Create `.env`:
```
DATABASE_URL=postgres://...          # or use bundled db (see compose comment)
JWT_SECRET=your-secret
SALT=13
MAILTRAP_API_KEY=...
MAIL_TO=you@example.com
PORT=3000
```

`common/db/index.ts` loads `dotenv/config`; compose passes `REDIS_HOST=redis`.

To use bundled Postgres, uncomment `DATABASE_URL` override in `docker-compose.yml`.

## Run (Docker - recommended)
```bash
docker compose up -d --build
docker compose logs -f app      # wait for "Server started on port: 3000"
```

Services:
- `taskflow-app` → `http://localhost:3000` (health: `/health`, jobs: `/api/jobs`)
- `taskflow-db` → `localhost:5432` (pgdata volume)
- `taskflow-redis` → `localhost:6379`
- Network: `taskflow-net` (explicit, fixes Redis DNS)

Verify:
```bash
curl localhost:3000/health
curl localhost:3000/v1/api-doc.json | jq .paths
# Swagger UI
open http://localhost:3000/docs
```

DB push (if schema changed):
```bash
# against bundled db (compose running)
DATABASE_URL=postgres://taskflow:taskflow@localhost:5432/taskflow pnpm db:push
# or hosted DB via .env
pnpm db:push
```

Seed:
```bash
pnpm seed                  # ✅ FULL / correct seed — 2 orgs + 5 users + 4 projects + 13 tasks + assignments + comments
pnpm seed:minimal           # minimal test seed — only 2 orgs + 5 users (2 admins pre-joined), no projects/tasks
# aliases: pnpm seed:minimal === pnpm seed-1 (tsx scripts/seed-1.js)
#          pnpm seed        === tsx scripts/seed.js (bigger, canonical dataset)
```

Auth is cookie-based (`tokens={access_token, refresh_token}`, path `/`):
```bash
curl -c jar -X POST localhost:3000/api/auth/login -d '{"email":"alice@taskflow.dev","password":"password123"}' -H 'Content-Type: application/json'
curl -b jar -X POST localhost:3000/api/project -d '{"name":"My Project","orgId":"<uuid>"}' -H 'Content-Type: application/json'
```

## Run (Local dev)
```bash
pnpm install
pnpm dev                   # tsc-watch → dist/index.js
```

## Stop
```bash
docker compose down              # keep pgdata
docker compose down -v           # also wipe DB volume
```

See `architecture.md` for modules/middleware/multi-tenancy details.
