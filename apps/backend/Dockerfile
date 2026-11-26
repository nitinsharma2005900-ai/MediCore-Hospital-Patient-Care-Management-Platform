# Multi-stage Dockerfile for MediCore Express Backend Service
# Non-root secure container execution
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Install dependencies and build shared + backend
RUN npm install --workspace=packages/shared --workspace=apps/backend --no-audit --no-fund
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/backend

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Security: non-root node user
RUN addgroup -S medicore && adduser -S medicore -G medicore

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/src/swagger ./apps/backend/dist/swagger
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

USER medicore

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "apps/backend/dist/server.js"]
