FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
ARG BACKEND_BASE_URL=http://backend:4000
ARG ANALYTICS_SERVICE_URL=http://analytics:8000
ENV BACKEND_BASE_URL=$BACKEND_BASE_URL ANALYTICS_SERVICE_URL=$ANALYTICS_SERVICE_URL
RUN npm run build --workspace=packages/shared && npm run build --workspace=apps/frontend
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static apps/frontend/.next/static
COPY --from=builder --chown=node:node /app/apps/frontend/public apps/frontend/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:'+process.env.PORT).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","apps/frontend/server.js"]
