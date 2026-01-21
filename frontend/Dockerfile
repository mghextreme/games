FROM node:20-alpine AS builder

WORKDIR /build

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files from frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/

# Install dependencies
WORKDIR /build/frontend
RUN pnpm install --frozen-lockfile

# Copy convex generated files (needed for imports - at same level as frontend)
WORKDIR /build
COPY convex ./convex

# Copy frontend source files
COPY frontend ./frontend

# Build the application
WORKDIR /build/frontend
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /build/frontend/.output /app/.output

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
