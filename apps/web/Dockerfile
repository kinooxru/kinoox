# ─────────────────────────────────────────────────────────────
#  KINOOX Web — образ сайта (Next.js 14+)
#  Multi-stage: зависимости → сборка → рантайм-standalone.
# ─────────────────────────────────────────────────────────────

# ── Этап 1: зависимости ──────────────────────────────────────
FROM node:20-bookworm-slim AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/design-system/package.json packages/design-system/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile=false --filter @kinoox/web...

# ── Этап 2: сборка ───────────────────────────────────────────
FROM deps AS build

COPY tsconfig.base.json ./
COPY packages/api-client packages/api-client
COPY packages/design-system packages/design-system
COPY apps/web apps/web

WORKDIR /repo/apps/web

# Переменные, вшиваемые на этапе сборки Next.js
ARG NEXT_PUBLIC_API_URL=https://kinoox.ru/api/v1
ARG NEXT_PUBLIC_SOCKET_URL=https://kinoox.ru
ARG NEXT_PUBLIC_SITE_URL=https://kinoox.ru
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096
# Standalone-сборка нужна только для Docker-образа
ENV BUILD_STANDALONE=true

RUN pnpm build

# ── Этап 3: рантайм ──────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV TZ=Europe/Moscow
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Next.js standalone-сборка содержит только необходимые файлы
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

RUN groupadd --system --gid 1001 kinoox \
    && useradd --system --uid 1001 --gid kinoox --create-home kinoox \
    && chown -R kinoox:kinoox /app

USER kinoox

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=10s --start-period=40s --retries=5 \
    CMD curl -sf http://localhost:3000/ || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "--max-old-space-size=4096", "apps/web/server.js"]
