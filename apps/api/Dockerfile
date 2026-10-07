# ─────────────────────────────────────────────────────────────
#  KINOOX API — образ приложения (Fastify + Prisma)
#  Multi-stage сборка: зависимости → сборка → рантайм.
# ─────────────────────────────────────────────────────────────

# ── Этап 1: зависимости ──────────────────────────────────────
FROM node:20-bookworm-slim AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /repo

# Копируем манифесты монорепо для кэширования слоёв pnpm
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/design-system/package.json packages/design-system/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile=false --filter @kinoox/api... --prod=false

# ── Этап 2: сборка ───────────────────────────────────────────
FROM deps AS build

COPY tsconfig.base.json ./
COPY packages/api-client packages/api-client
COPY apps/api apps/api

WORKDIR /repo/apps/api

# Prisma-клиент генерируется на этапе сборки
RUN pnpm exec prisma generate

# Сборка TypeScript в dist
RUN pnpm exec tsc -p tsconfig.build.json

# Оставляем только продуктовые зависимости
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile=false --filter @kinoox/api... --prod

# ── Этап 3: рантайм ──────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV TZ=Europe/Moscow

# curl нужен для docker healthcheck, tini — для корректного PID 1
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем установленные зависимости и собранный код
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json

# Предзагрузка Prisma query engine (обходит DNS проблемы при запуске)
RUN cd /app/apps/api && npx prisma generate 2>/dev/null || true

# Пользователь без root-прав
RUN groupadd --system --gid 1001 kinoox \
    && useradd --system --uid 1001 --gid kinoox --create-home kinoox \
    && chown -R kinoox:kinoox /app

# Пользователь без root-прав
RUN groupadd --system --gid 1001 kinoox \
    && useradd --system --uid 1001 --gid kinoox --create-home kinoox \
    && chown -R kinoox:kinoox /app

USER kinoox

WORKDIR /app/apps/api

# Предзагрузка Prisma query engine бинарников
RUN npx prisma generate 2>/dev/null || true

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=10s --start-period=40s --retries=5 \
    CMD curl -sf http://localhost:3001/api/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]

# Лимит кучи Node.js — 4 ГБ, как задано в docker-compose
CMD ["node", "--max-old-space-size=4096", "--enable-source-maps", "dist/server.js"]
