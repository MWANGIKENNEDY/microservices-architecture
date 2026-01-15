FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY apps/order-service ./apps/order-service

# Install dependencies
RUN npm install

# Build shared package first, then order-service
RUN npm run build -- --filter=@monorepo/order-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/order-service/dist ./apps/order-service/dist
COPY --from=builder /app/apps/order-service/package.json ./apps/order-service/

# Install production dependencies
COPY package*.json ./
RUN npm install --only=production --workspaces

WORKDIR /app/apps/order-service

EXPOSE 4000

CMD ["node", "dist/server.js"]
