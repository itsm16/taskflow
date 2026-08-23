# Taskflow — Architecture

## Common Layer (`src/common`)

- **`utils/api-error.ts`** — `ApiError extends Error { statusCode }`, factories `badRequest(400)`, `unauthorized(401)`, `forbidden(403)`, `notFound(404)`, `conflict(409)`, `internal(500)`. All service/middleware throws flow here.
- **`utils/api-response.ts`** — `ApiResponse.ok/created/notFound` → `{message, data}` JSON.
- **`utils/assert-tenant.ts`** — `assertTenant({resourceOrganizationId, orgId})` — pure comparison, throws `ApiError.forbidden("Cross-tenant access denied")`. Shared by project/task services (and resolvers if added).
- **`utils/api-email.ts`** — Mailtrap + BullMQ **co-located**: `Queue("email-queue")` + `Worker("email-queue")` initialized in-file, `defaultJobOptions: {attempts:3, backoff:{exponential,1s}}`. `sendMail({to,subject,text})` → `queue.add`. Worker logs `failed` events. `getJobs()` exposes `getJobCounts` + detailed states for `GET /api/jobs`.
- **`db/schema.ts`** — barrel re-exports `orgTable, orgMembersTable, usersTable` (auth), `projectTable` (project), `tasksTable, taskAssignments, taskComments` (task).
- **`dto/base.dto.ts`**, **`middleware/validate.middleware.ts`** — zod validation scaffolding (auth DTOs: Register/Login).

## Modules

### Auth (`src/modules/auth`)

**Schema (`auth.schema.ts`)**
- `organizations(id, name)`
- `organization_members(id, assigned_organization→orgs.id, user_id→users.id)`
- `users(id, name, email unique, password hash, refresh_token, refresh_token_expiry, role enum: member|org_admin)`
- `roleEnum`

**Middleware (`auth.middleware.ts`)**
- `verifyToken(token)` — `JWT.verify` with `JWT_SECRET`
- `checkToken(): AuthHandler` — `req.cookies.tokens.access_token` (path `/`, httpOnly), `JWT.verify` → `users` row → `req.user = {id,name,email,org_id,role}`. Returns `401` on missing/invalid/user-not-found. Type: `AuthHandler = (req,res,next)=>Promise<unknown>|unknown` with `AuthedRequest = Request & {user:User}` cast.
- `checkRole(roles)` — `req.user.role ∈ roles` else `403`.
- `checkOrg()` — `orgId = body.orgId ?? params.orgId ?? query.orgId`; `user = req.user`; `AND` query `organization_members(user_id, assigned_organization)`; `403` if none. **User↔org** check, tenant-context gate.

**Service (`auth.service.ts`)**
- `register`, `login` (hash/compare, 1st orgMember for `org_id` claim into both tokens, persist `refresh_token`), `refresh` (verify, compare stored, rotate both tokens), `logout` (clear tokens), members CRUD: `addMember` (check exists + conflict, insert, **enqueue email** via `sendMail({to: user.email})` in try/catch), `getMembers` (join users), `updateMember`/`removeMember` (org-scoped `WHERE user_id AND assigned_organization`).

**Controller / Route**
- Controllers thin: `req.params`/`body`/`query` → service → `ApiResponse`.
- Route `src/modules/auth/auth.route.ts` mounted at `/api/auth`, guarded:
  ```
  POST   /register            (public)
  POST   /login               (public → sets tokens cookie)
  POST   /refresh             (reads tokens.refresh_token cookie)
  POST   /logout              (clears cookie)
  POST   /members/:userId     body{orgId}  → checkToken, checkRole(org_admin), checkOrg → addMember (email)
  GET    /members/:orgId                    → checkToken, checkRole(org_admin), checkOrg → getMembers
  PUT    /members/:userId     body{orgId}  → ... → updateMember
  DELETE /members/:userId?orgId=            → ... → removeMember
  ```

### Project (`src/modules/project`)

**Schema** `projectTable(id, name, organization_id→orgs.id, deleted_at)` — soft-delete.

**Middleware** `project.middleware.ts` — `export { checkOrg } from '../auth/auth.middleware.js'` (re-export, no duplicate logic).

**Service**
- `createProject({name, orgId})` — insert.
- `getProject({projectId, orgId})` — fetch by id+not-deleted → `404`; `assertTenant(row.organization_id, orgId)` → `403`.
- `getOrgProjects({orgId})` — `WHERE organization_id AND deleted_at IS NULL`.
- `updateProject` — pre-fetch org check via `assertTenant` (no cross-org move of `organization_id`), then `UPDATE ... WHERE id AND not-deleted`.
- `deleteProject({projectId, orgId})` — same tenant check → `UPDATE deleted_at=now()`.

**Controller / Route** (`/api/project`): all guarded `checkToken(), checkRole(org_admin), checkOrg()` (explicit `?orgId=` on single-resource reads/deletes):
```
POST   /                 body{name,orgId}
GET    /org/:orgId
GET    /:projId?orgId=
PUT    /:projId          body{name,orgId}
DELETE /:projId?orgId=
```

### Task (`src/modules/task`)

**Schema** denormalized `organization_id` on row (like projects) for uniform guard, no join:
- `tasksTable(id, name, description, project_id→projects.id, organization_id→orgs.id, status enum(todo,in_progress,review,done), priority enum(low,medium,high,urgent), deleted_at)`
- `taskAssignments(id, user_id→users.id, task_id→tasks.id)`
- `taskComments(id, task_id→tasks.id, user_id→users.id, content, created_at)`

**Service** (all `assertTenant`-based, tenant = `tasks.organization_id`):
- `createTask({name, description, projectId, orgId})` — fetch project org → `404` if missing else `403` if `project.organization_id !== orgId` then insert.
- `getTask({taskId, orgId})`, `updateTask`, `deleteTask` — fetch by id+not-deleted → 404/403 via `assertTenant`, soft-delete via `deleted_at`.
- `getProjectTasks({projectId, orgId})` — pre-check project tenant → 403 else list `WHERE project_id AND not-deleted`.

**Controller / Route** (`/api/task`): `checkToken(), checkOrg()` on all:
```
POST   /                 body{name, description?, projectId, orgId}
GET    /project/:projectId?orgId=
GET    /:taskId?orgId=
PUT    /:taskId          body{name?,description?,status?,priority?,orgId}
DELETE /:taskId?orgId=
```

---

## Auth & Middleware Chain

```
checkToken  →  JWT valid? users row exists? → req.user (401 on fail)
   ↓
checkRole   →  role ∈ allowlist?                              (403)
   ↓
checkOrg    →  SELECT members WHERE user_id AND assigned_organization = claimed orgId? (403)
   ↓
[assertTenant in service]  →  row.organization_id === claimed orgId? (403) / 404 if missing
   ↓
handler
   ↓
global errorHandler (src/index.ts after all routes)  →  if ApiError → JSON {message} with statusCode else 500
```

**Cookie note:** `tokens = {access_token, refresh_token}`, `path:"/"`, `httpOnly`, `sameSite:lax`, `maxAge 7d`. Path was fixed from `/api/auth` → `/` so project/task routes receive it. `REFRESH_COOKIE_MAX_AGE` reused for both cookies (access logically 15m but kept simple). Bearer header support is commented out — cookie-only.

**assertTenant vs checkOrg:** checkOrg proves *user belongs to claimed org*; assertTenant proves *resource belongs to same claimed org*. Together they are transitive tenant guarantee; neither alone suffices (Alice passing her own Acme `orgId` while fetching a Globex row would pass checkOrg). Raw `?orgId=` / body `orgId` is the *claimed tenant context* — client declares which org they're operating in, server verifies membership then binds the resource to that same value.

---

## Multi-Tenancy Model

- Tenant = organization (1 user can be member of N orgs; `organization_members` rows are the sole link).
- Token `org_id` claim is **first-found** member org (login/refresh) — considered stale hint only; live check is always `checkOrg` against DB.
- Every tenant-scoped row stores `organization_id` directly (no RLS, no join-through-project for tasks) → uniform `WHERE organization_id = ?` + `assertTenant` pattern.
- `POST /task` guarantees denormalized column correctness by pre-checking `project.organization_id === body.orgId`.

---

## Email & Jobs

- **BullMQ** queue `email-queue`, Redis via `REDIS_HOST/PORT` (compose service `redis`), `requires ioredis` (peer dep).
- `GET /api/jobs` → `getJobs()` → `{counts:{active,waiting,delayed,completed,failed}, total, jobs:[{id,name,queue,data,status,attemptsMade,maxAttempts,failedReason,timestamp,processedOn,finishedOn}]}` sorted newest first, `503` if Redis down.
- Mailtrap demo domains only deliver to account owner address — use own email in `to` for testing.

---

## Docker

**Dockerfile** (3-stage):
1. `build` (node:26-slim, `npm i -g pnpm@11`, `pnpm install`, `pnpm exec tsc`)
2. `prod-deps` (`pnpm install --prod`, `pnpm-workspace.yaml allowBuilds` copied for bcrypt/esbuild)
3. `runtime` (node:26-slim, copy prod `node_modules` + `dist`, `CMD ["node","dist/index.js"]`)

`.dockerignore`: `node_modules, dist, .env, ...`

**docker-compose.yml**:
- Explicit network `taskflow-net` (bridge) on all 3 services — fixes prior DNS `EAI_AGAIN redis`.
- `app` (`build:.`, `3000:3000`, `env_file:.env`, `environment: NODE_ENV, PORT=3000, REDIS_HOST=redis, REDIS_PORT`), `depends_on: db, redis (healthy)`
- `db` (`postgres:17-alpine`, `pgdata` volume, `healthcheck pg_isready`)
- `redis` (`redis:8-alpine`, healthcheck `redis-cli ping`)
- Prod DB override commented: `DATABASE_URL: postgres://taskflow:taskflow@db:5432/taskflow` (default uses hosted `.env` DB).

Run: `docker compose up -d --build` → `docker compose logs -f app`

**Fixes applied during setup:**
- `pnpm-workspace.yaml` `allowBuilds` now copied into image (otherwise `ERR_PNPM_IGNORED_BUILDS` for bcrypt)
- `typescript@7.0.2` added to devDeps (was transitive via tsc-watch only)
- Port env `PORT=3000` restored (app had shifted to `8000` fallback).

---

## Seeding & Testing Cross-Tenant

- `scripts/seed-1.js` (current primary): wipes in FK order `task_comments → taskAssignments → tasks → projects → orgMembers → users → orgs`, inserts 2 orgs + 5 users (Alice/Dave `org_admin`), **only 2 memberships** (Alice→Acme, Dave→Globex), 3 unassigned left for `POST /members/:userId` testing. Use: `pnpm exec tsx scripts/seed-1.js`.
- `scripts/seed.js` (full): same wipe + 5 projects, 13 tasks, 8 assignments, 8 comments, all tenants respected.

Manual cross-tenant test (cookie auth):
```bash
# login both admins (captures cookies)
curl -c jar-dave -X POST /api/auth/login -d '{"email":"dave@...","password":"password123"}'
# Dave creates Globex project+task
curl -b jar-dave -X POST /api/project -d '{"name":"Secret","orgId":"<globex>"}'
# Alice (Acme) attacking Globex resource → 403
curl -b jar-alice /api/project/<globex-pid>?orgId=<acme>   # → 403 Cross-tenant access denied
# Own tenant → 200
curl -b jar-dave /api/project/<globex-pid>?orgId=<globex>  # → 200
```

- Old dev containers `redis-container` / `postgresdb` set to `restart=no` and stopped (won't return on boot); compose stack owns ports now.
