FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/db ./packages/db
COPY packages/types ./packages/types

RUN pnpm install --frozen-lockfile --filter @streamflare/db...

COPY ["legacy/Table Backup", "/seed-data/"]
ENV SEED_DATA_DIR=/seed-data

WORKDIR /app/packages/db
RUN pnpm exec prisma generate

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed"]
