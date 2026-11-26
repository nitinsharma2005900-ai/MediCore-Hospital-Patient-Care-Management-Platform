# Multi-stage Dockerfile for MediCore Next.js Frontend
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN npm install --workspace=packages/shared --workspace=apps/frontend --no-audit --no-fund
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/frontend

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "apps/frontend/node_modules/next/dist/bin/next", "start", "apps/frontend", "-p", "3000"]
