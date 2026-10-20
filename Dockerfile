# syntax=docker/dockerfile:1

# Multi-stage build: dependencies and the Next.js build run in throwaway stages,
# and the final image only carries the standalone server (no pnpm, no source, no devDependencies).
# No secrets are needed to build: env vars are read when the container starts.

ARG NODE_VERSION=24-alpine

# --- base: Node with pnpm (version pinned by "packageManager" in package.json) ---
FROM node:${NODE_VERSION} AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# --- deps: install from the lockfile only, so this layer is cached until dependencies change ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

# --- builder: compile the app into .next/standalone ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# --- runner: the image that ships ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The standalone output does not include static assets or public/, so they are copied next to it.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Uploaded images are written here (UPLOAD_DIR). Mount a Dokploy volume on /app/uploads so they
# survive redeploys; the folder is created owned by node so the app can write to it.
RUN mkdir -p /app/uploads && chown node:node /app/uploads
ENV UPLOAD_DIR=/app/uploads

# Run as the unprivileged user that ships with the Node image.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
