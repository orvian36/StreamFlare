FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@^2 prune --scope=@streamflare/ml --docker

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
RUN pnpm --filter @streamflare/ml build
RUN pip3 install --break-system-packages -r apps/ml/python/requirements.txt

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PYTHON_BIN=python3
COPY --from=builder /app/ .
COPY --from=builder /usr/lib/python3 /usr/lib/python3
COPY --from=builder /usr/local/lib /usr/local/lib
EXPOSE 5001
CMD ["node", "apps/ml/dist/app.js"]
