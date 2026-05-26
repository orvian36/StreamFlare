FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@^2 prune --scope=@streamflare/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @streamflare/db exec prisma generate
RUN pnpm --filter @streamflare/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/ .
EXPOSE 5000
CMD ["node", "apps/api/dist/app.js"]
