FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY apps/user-service ./apps/user-service

# Install dependencies
RUN npm install

# Build shared package first, then user-service
RUN npm run build -- --filter=@monorepo/user-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/user-service/dist ./apps/user-service/dist
COPY --from=builder /app/apps/user-service/package.json ./apps/user-service/

# Install production dependencies
COPY package*.json ./
RUN npm install --only=production --workspaces

WORKDIR /app/apps/user-service

EXPOSE 4001

CMD ["node", "dist/server.js"]
