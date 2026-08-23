# ---------- build stage ----------
FROM node:26-slim AS build

RUN npm install -g pnpm@11

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec tsc

# ---------- runtime deps (prod only) ----------
FROM node:26-slim AS prod-deps

RUN npm install -g pnpm@11
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---------- runtime ----------
FROM node:26-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
