FROM node:22-alpine

WORKDIR /app

# Install build dependencies for Prisma (openssl, libc)
RUN apk add --no-cache openssl libc6-compat

RUN npm install -g pnpm@9

# Copy workspace config and lockfile first (layer cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY tsconfig.base.json tsconfig.json ./
COPY prisma/ ./prisma/

# Copy all workspace packages
COPY modules/ ./modules/
COPY app/ ./app/

# Install all dependencies (workspace packages resolved via symlinks)
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client (needed by shared + lead modules)
RUN pnpm prisma:generate

# Build arg: which app to run (e.g. lead-api, mock-api, enrichment)
ARG APP
ENV APP=${APP}

# Runtime: ts-node with tsconfig-paths so @modules/* aliases resolve
CMD ["sh", "-c", "node -r tsconfig-paths/register -r ts-node/register/transpile-only app/${APP}/src/main.ts"]
