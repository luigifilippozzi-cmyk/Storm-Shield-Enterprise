FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod=false

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @sse/shared-types build && \
    pnpm --filter @sse/shared-utils build && \
    pnpm --filter @sse/api build

# Production
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-utils/package.json ./packages/shared-utils/package.json

USER nestjs

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]