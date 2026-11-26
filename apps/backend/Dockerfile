FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm run build --workspace=packages/shared && npm run build --workspace=apps/backend
RUN npm prune --omit=dev --no-audit --no-fund
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY --from=builder --chown=node:node /app/node_modules node_modules
COPY --from=builder --chown=node:node /app/packages/shared packages/shared
COPY --from=builder --chown=node:node /app/apps/backend/dist apps/backend/dist
COPY --from=builder --chown=node:node /app/apps/backend/package.json apps/backend/package.json
COPY --chown=node:node database/migrations database/migrations
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","apps/backend/dist/server.js"]
