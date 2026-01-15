# Production Monorepo with Turborepo

A production-grade monorepo setup using Turborepo, npm workspaces, and shared packages for microservices architecture.

## Table of Contents
- [What is a Monorepo?](#what-is-a-monorepo)
- [How Monorepos Work](#how-monorepos-work)
- [Advantages Over Traditional Methods](#advantages-over-traditional-methods)
- [Architecture](#architecture)
- [Creating a Monorepo from Scratch](#creating-a-monorepo-from-scratch)
- [Setup](#setup)
- [Docker Setup](#docker-setup)
- [Kubernetes Setup](#kubernetes-setup)
- [Complete Workflow](#complete-workflow)

## What is a Monorepo?

A **monorepo** (monolithic repository) is a software development strategy where code for multiple projects, services, or packages is stored in a single Git repository.

### Simple Example

**Traditional Approach (Polyrepo):**
```
github.com/company/user-service     ← Separate repo
github.com/company/order-service    ← Separate repo
github.com/company/payment-service  ← Separate repo
```

**Monorepo Approach:**
```
github.com/company/microservices    ← One repo
├── apps/
│   ├── user-service/
│   ├── order-service/
│   └── payment-service/
└── packages/
    └── shared/                     ← Shared code
```

### Key Concepts

1. **Single Repository**: All code lives in one Git repo
2. **Multiple Projects**: Each service/app is independent but connected
3. **Shared Code**: Common utilities, types, and configs in shared packages
4. **Unified Versioning**: One commit can update multiple services atomically
5. **Workspace Management**: Tools like npm workspaces link packages together

## How Monorepos Work

### 1. Workspace Structure

```
monorepo/
├── package.json              ← Root: defines workspaces
├── node_modules/             ← Shared dependencies
│   └── @monorepo/shared/     ← Symlink to packages/shared
├── apps/                     ← Applications (services)
│   ├── user-service/
│   │   ├── package.json      ← Depends on @monorepo/shared
│   │   └── src/
│   └── order-service/
│       ├── package.json      ← Depends on @monorepo/shared
│       └── src/
└── packages/                 ← Shared libraries
    └── shared/
        ├── package.json      ← Published as @monorepo/shared
        └── src/
```

### 2. Dependency Linking

When you run `npm install` in the root:

```bash
# npm workspaces automatically:
# 1. Installs dependencies for all packages
# 2. Creates symlinks between internal packages
# 3. Hoists common dependencies to root node_modules

npm install
# Creates: node_modules/@monorepo/shared → ../../packages/shared
```

### 3. Build Pipeline

Turborepo orchestrates builds based on dependency graph:

```
packages/shared (build first)
    ↓
apps/user-service (depends on shared)
    ↓
apps/order-service (depends on shared)
```

```bash
npm run build
# Turborepo:
# 1. Analyzes dependencies
# 2. Builds packages in correct order
# 3. Caches results (only rebuilds what changed)
# 4. Runs tasks in parallel when possible
```

### 4. Code Sharing

**Before (Duplicate Code):**
```typescript
// user-service/src/types.ts
export interface User { id: string; name: string; }

// order-service/src/types.ts
export interface User { id: string; name: string; }  // Duplicate!
```

**After (Shared Package):**
```typescript
// packages/shared/src/types.ts
export interface User { id: string; name: string; }

// user-service/src/controller.ts
import { User } from '@monorepo/shared';  // ✅ Single source of truth

// order-service/src/controller.ts
import { User } from '@monorepo/shared';  // ✅ Same types
```

## Advantages Over Traditional Methods

### Monorepo vs Polyrepo (Multiple Repositories)

| Feature | Monorepo | Polyrepo |
|---------|----------|----------|
| **Code Sharing** | Easy - import from shared packages | Hard - publish to npm or copy/paste |
| **Atomic Changes** | One commit updates all services | Multiple PRs across repos |
| **Refactoring** | Change interface + all usages together | Update each repo separately |
| **Dependency Management** | Centralized, consistent versions | Each repo manages independently |
| **CI/CD** | Single pipeline, test everything | Separate pipelines per repo |
| **Onboarding** | Clone once, see everything | Clone multiple repos |
| **Code Discovery** | Search across all code | Search each repo separately |
| **Version Drift** | Prevented by shared packages | Common problem |

### Real-World Example: Updating a Shared Type

**Polyrepo Approach:**
```bash
# 1. Update shared library repo
cd shared-library
# Edit User interface
git commit -m "Add phone field to User"
npm version patch
npm publish

# 2. Update user-service repo
cd ../user-service
npm install shared-library@latest
# Update code to use new field
git commit -m "Use new User.phone field"

# 3. Update order-service repo
cd ../order-service
npm install shared-library@latest
# Update code to use new field
git commit -m "Use new User.phone field"

# Result: 3 separate PRs, 3 deployments, potential version mismatches
```

**Monorepo Approach:**
```bash
cd monorepo

# 1. Update shared package
vim packages/shared/src/types.ts
# Add phone field to User interface

# 2. Update all services in same commit
vim apps/user-service/src/controller.ts
vim apps/order-service/src/controller.ts

# 3. Commit everything atomically
git commit -m "Add phone field to User across all services"

# Result: 1 PR, atomic change, no version drift
```

### Key Advantages

#### 1. **Atomic Changes**
```bash
# One commit can update:
# - Shared types
# - User service using those types
# - Order service using those types
# - Tests for both services
# All guaranteed to be in sync!
```

#### 2. **Code Reuse**
```typescript
// Shared utilities used by all services
import { 
  createHttpClient,    // HTTP client config
  User, Order,         // Common types
  generateId,          // Utility functions
  formatError          // Error handling
} from '@monorepo/shared';
```

#### 3. **Consistent Tooling**
```json
// Root package.json - applies to all services
{
  "devDependencies": {
    "typescript": "^5.3.0",    // Same version everywhere
    "prettier": "^3.0.0",      // Same formatting
    "eslint": "^8.0.0"         // Same linting rules
  }
}
```

#### 4. **Simplified CI/CD**
```yaml
# Single GitHub Actions workflow
- name: Build and Test
  run: |
    npm install
    npm run build    # Builds all services
    npm run test     # Tests all services
    npm run lint     # Lints all services
```

#### 5. **Better Refactoring**
```bash
# Rename a function across all services
# IDE can find and update all usages in one go
# TypeScript catches any missed updates
```

#### 6. **Faster Development**
```bash
# Turborepo caching
npm run build
# ✓ packages/shared: cached (not changed)
# ✓ apps/user-service: cached (not changed)
# ⚡ apps/order-service: built (changed)

# Only rebuilds what changed!
```

### When to Use Monorepo

**Good Fit:**
- Microservices that share code/types
- Multiple apps with common components
- Teams working on related projects
- Need for atomic cross-service changes
- Want consistent tooling/dependencies

**Not Ideal:**
- Completely unrelated projects
- Different tech stacks (Python + Node + Go)
- Very large codebases (millions of lines)
- Teams with strict separation requirements

### Companies Using Monorepos

- **Google**: Single monorepo with billions of lines of code
- **Facebook/Meta**: React, React Native, Jest all in one repo
- **Microsoft**: Windows, Office components
- **Uber**: Microservices platform
- **Twitter**: Backend services
- **Airbnb**: Frontend and backend services

### Monorepo Tools Comparison

| Tool | Best For | Key Features |
|------|----------|--------------|
| **Turborepo** | JavaScript/TypeScript | Fast caching, simple config |
| **Nx** | Enterprise apps | Advanced features, plugins |
| **Lerna** | npm packages | Publishing, versioning |
| **Bazel** | Large scale (Google) | Language-agnostic, powerful |
| **Rush** | Microsoft projects | Strict dependency management |

This project uses **Turborepo** because it's:
- Fast and simple
- Great for TypeScript microservices
- Excellent caching
- Easy to learn

## Architecture

```
monorepo/
├── apps/                      # Applications
│   ├── user-service/         # User microservice
│   └── order-service/        # Order microservice
├── packages/                  # Shared packages
│   └── shared/               # Common utilities, types, HTTP client
├── k8s/                      # Kubernetes manifests
├── turbo.json                # Turborepo pipeline config
└── package.json              # Root workspace config
```

## Key Features

### Turborepo Benefits
- **Smart caching**: Builds are cached and only rebuilt when dependencies change
- **Parallel execution**: Tasks run in parallel across workspaces
- **Dependency graph**: Automatically builds packages in correct order
- **Remote caching**: Share build cache across team (optional)

### Shared Package
The `@monorepo/shared` package contains:
- Common TypeScript types (User, Order, ApiResponse)
- HTTP client utilities
- Shared helper functions
- Centralized configuration

Both services import from `@monorepo/shared` instead of duplicating code.

## Creating a Monorepo from Scratch

### Step 1: Initialize Root Package

```bash
# Create project directory
mkdir my-monorepo
cd my-monorepo

# Initialize root package.json
npm init -y
```

### Step 2: Configure Workspaces

Edit `package.json`:
```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### Step 3: Install Turborepo

```bash
npm install turbo --save-dev
```

### Step 4: Create Turbo Config

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Note:** Turbo 2.0+ uses `tasks` instead of `pipeline`. If you see an error about `pipeline`, rename it to `tasks`.

### Step 5: Create Shared Package

```bash
# Create shared package structure
mkdir -p packages/shared/src
cd packages/shared

# Initialize package
npm init -y
```

Edit `packages/shared/package.json`:
```json
{
  "name": "@monorepo/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

Create `packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

Create `packages/shared/src/index.ts`:
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}
```

### Step 6: Create First Service

```bash
# From monorepo root
mkdir -p apps/user-service/src
cd apps/user-service

# Initialize service
npm init -y
```

Edit `apps/user-service/package.json`:
```json
{
  "name": "@monorepo/user-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/server.ts",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@monorepo/shared": "*",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0"
  }
}
```

### Step 7: Install All Dependencies

```bash
# From monorepo root
cd ../..
npm install
```

This installs dependencies for all workspaces and links them together.

### Step 8: Build Everything

```bash
npm run build
```

Turborepo builds packages in dependency order (shared first, then services).

### Step 9: Add Docker Support

Create `apps/user-service/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/user-service ./apps/user-service
RUN npm install
RUN npm run build -- --filter=@monorepo/user-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/user-service/dist ./apps/user-service/dist
COPY package*.json ./
RUN npm install --only=production --workspaces
WORKDIR /app/apps/user-service
EXPOSE 4001
CMD ["node", "dist/server.js"]
```

### Step 10: Add Docker Compose

Create `docker-compose.yaml`:
```yaml
version: "3.9"
services:
  user-service:
    build:
      context: .
      dockerfile: apps/user-service/Dockerfile
    ports:
      - "4001:4001"
```

### Step 11: Add Kubernetes Manifests

Create `k8s/user-deployment.yaml` and `k8s/user-service.yaml` (see examples in this repo).

## Setup

### Install Dependencies

```bash
cd monorepo
npm install
```

This installs dependencies for all workspaces (root, apps, packages).

### Build All Packages

```bash
# Build everything (shared package + both services)
npm run build

# Turborepo builds in correct order:
# 1. packages/shared
# 2. apps/user-service
# 3. apps/order-service
```

**Important:** Always build after installing dependencies. The shared package must be compiled before services can import from it.

**Common Build Issues:**

If you see `Cannot find module '@monorepo/shared'`:
```bash
# Solution: Build the shared package first
npm run build

# Or build just the shared package
npx turbo build --filter=@monorepo/shared

# Then reload your IDE (VS Code: Cmd+Shift+P → "Developer: Reload Window")
```

**Note:** Don't use `npm run build --filter` - npm doesn't support the `--filter` flag. Use `npx turbo build --filter` instead.

### Development Mode

```bash
# Run all services in dev mode
npm run dev

# Or run specific service
npm run dev --filter=@monorepo/user-service
npm run dev --filter=@monorepo/order-service
```

## Docker Setup

### Build Images

```bash
# Build all services
docker-compose build

# Or build individually
docker build -t monorepo/user-service:1.0 -f apps/user-service/Dockerfile .
docker build -t monorepo/order-service:1.0 -f apps/order-service/Dockerfile .
```

Note: Dockerfiles build from monorepo root to access shared packages.

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Test Services

```bash
# Test user-service
curl http://localhost:4001/users

# Test order-service
curl http://localhost:4000/orders

# Create order (calls user-service internally)
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","product":"Laptop","quantity":1,"total":999}'
```

## Kubernetes Setup

### Build Images

```bash
# Build from monorepo root
docker build -t monorepo/user-service:1.0 -f apps/user-service/Dockerfile .
docker build -t monorepo/order-service:1.0 -f apps/order-service/Dockerfile .
```

### Deploy to Kubernetes

```bash
# Deploy all services
kubectl apply -f k8s/

# Check status
kubectl get deployments
kubectl get pods
kubectl get services
```

### Test in Kubernetes

```bash
# Port-forward to access services
kubectl port-forward service/user-service 4001:4001
kubectl port-forward service/order-service 4000:4000

# Test endpoints
curl http://localhost:4001/users
curl http://localhost:4000/orders
```

### Scale Services

```bash
kubectl scale deployment user-service --replicas=3
kubectl scale deployment order-service --replicas=5
```

### Clean Up

```bash
kubectl delete -f k8s/
```

## Complete Workflow

### From Zero to Running Services

#### 1. Clone and Setup
```bash
# Clone the repository
git clone <repo-url>
cd monorepo

# Install all dependencies
npm install

# Build all packages
npm run build
```

#### 2. Local Development
```bash
# Run all services in dev mode
npm run dev

# Or run specific service
npm run dev --filter=@monorepo/user-service

# Test locally
curl http://localhost:4001/users
curl http://localhost:4000/orders
```

#### 3. Docker Development
```bash
# Build Docker images
docker-compose build

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Test services
curl http://localhost:4001/users
curl http://localhost:4000/orders

# Stop containers
docker-compose down
```

#### 4. Kubernetes Deployment
```bash
# Build images for Kubernetes
docker build -t monorepo/user-service:1.0 -f apps/user-service/Dockerfile .
docker build -t monorepo/order-service:1.0 -f apps/order-service/Dockerfile .

# Verify images
docker images | grep monorepo

# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get all

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=user-service --timeout=60s
kubectl wait --for=condition=ready pod -l app=order-service --timeout=60s

# Port-forward to access services
kubectl port-forward service/user-service 4001:4001 &
kubectl port-forward service/order-service 4000:4000 &

# Test services
curl http://localhost:4001/users
curl http://localhost:4000/orders

# View logs
kubectl logs -l app=user-service --tail=50
kubectl logs -l app=order-service --tail=50

# Scale services
kubectl scale deployment user-service --replicas=3
kubectl scale deployment order-service --replicas=5

# Check scaling
kubectl get pods -w

# Clean up
kubectl delete -f k8s/
```

### Making Changes to Shared Package

```bash
# 1. Edit shared package
vim packages/shared/src/types.ts

# 2. Rebuild shared package
npm run build --filter=@monorepo/shared

# 3. Rebuild dependent services (automatic with Turborepo)
npm run build

# 4. Rebuild Docker images
docker-compose build

# 5. Restart containers
docker-compose up -d

# Or for Kubernetes
docker build -t monorepo/user-service:1.0 -f apps/user-service/Dockerfile .
docker build -t monorepo/order-service:1.0 -f apps/order-service/Dockerfile .
kubectl rollout restart deployment/user-service
kubectl rollout restart deployment/order-service
```

### Adding a New Service

```bash
# 1. Create service directory
mkdir -p apps/payment-service/src

# 2. Initialize package
cd apps/payment-service
npm init -y

# 3. Update package.json
# Set name to "@monorepo/payment-service"
# Add "@monorepo/shared": "*" to dependencies

# 4. Create source files
# src/server.ts, src/routes/, src/controllers/, etc.

# 5. Create tsconfig.json
# Extend from shared package config

# 6. Install dependencies (from root)
cd ../..
npm install

# 7. Build new service
npm run build --filter=@monorepo/payment-service

# 8. Create Dockerfile
# apps/payment-service/Dockerfile

# 9. Add to docker-compose.yaml
# Add payment-service configuration

# 10. Create Kubernetes manifests
# k8s/payment-deployment.yaml
# k8s/payment-service.yaml
```

### Image Management

```bash
# List all images
docker images

# Remove specific image
docker rmi monorepo/user-service:1.0

# Remove all monorepo images
docker images | grep monorepo | awk '{print $3}' | xargs docker rmi

# Build with different tag
docker build -t monorepo/user-service:2.0 -f apps/user-service/Dockerfile .

# Tag for registry
docker tag monorepo/user-service:1.0 myregistry.com/user-service:1.0

# Push to registry
docker push myregistry.com/user-service:1.0

# Pull from registry
docker pull myregistry.com/user-service:1.0
```

### Container Management

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop specific container
docker stop user-service

# Start stopped container
docker start user-service

# Restart container
docker restart user-service

# Remove container
docker rm user-service

# Remove all stopped containers
docker container prune

# View container logs
docker logs user-service
docker logs -f user-service --tail=100

# Execute command in container
docker exec -it user-service sh
docker exec user-service ls -la

# Inspect container
docker inspect user-service

# View container stats
docker stats user-service
```

### Kubernetes Deployment Management

```bash
# View deployment details
kubectl describe deployment user-service

# View deployment history
kubectl rollout history deployment/user-service

# Update deployment (after rebuilding image)
kubectl rollout restart deployment/user-service

# Check rollout status
kubectl rollout status deployment/user-service

# Rollback to previous version
kubectl rollout undo deployment/user-service

# Rollback to specific revision
kubectl rollout undo deployment/user-service --to-revision=2

# Pause rollout
kubectl rollout pause deployment/user-service

# Resume rollout
kubectl rollout resume deployment/user-service
```

### Kubernetes Pod Management

```bash
# List pods
kubectl get pods

# List pods with more details
kubectl get pods -o wide

# Describe specific pod
kubectl describe pod <pod-name>

# View pod logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>
kubectl logs <pod-name> --previous  # Previous container logs

# Execute command in pod
kubectl exec -it <pod-name> -- sh
kubectl exec <pod-name> -- ls -la

# Delete pod (will be recreated by deployment)
kubectl delete pod <pod-name>

# Get pods by label
kubectl get pods -l app=user-service
```

### Kubernetes Service Management

```bash
# List services
kubectl get services
kubectl get svc

# Describe service
kubectl describe service user-service

# View service endpoints
kubectl get endpoints user-service

# Port-forward to service
kubectl port-forward service/user-service 4001:4001

# Port-forward to specific pod
kubectl port-forward <pod-name> 4001:4001

# Test service from within cluster
kubectl run test-pod --rm -it --image=alpine -- sh
# Inside pod: wget -qO- http://user-service:4001/users
```

### Testing Service Communication

```bash
# Test from outside cluster (port-forward first)
kubectl port-forward service/order-service 4000:4000 &
curl http://localhost:4000/orders

# Test internal communication
kubectl exec -it <order-service-pod> -- sh
# Inside pod:
wget -qO- http://user-service:4001/users
curl http://user-service:4001/users

# Create test order (tests order-service -> user-service communication)
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","product":"Laptop","quantity":1,"total":999}'
```

### Debugging

```bash
# Check if images exist
docker images | grep monorepo

# Check if pods are running
kubectl get pods

# Check pod events
kubectl get events --sort-by=.metadata.creationTimestamp

# Check pod logs for errors
kubectl logs -l app=user-service --tail=100

# Check service endpoints
kubectl get endpoints

# Describe failing pod
kubectl describe pod <pod-name>

# Check resource usage
kubectl top nodes
kubectl top pods

# Verify environment variables
kubectl exec <pod-name> -- env

# Test DNS resolution
kubectl exec <pod-name> -- nslookup user-service
```

### Clean Up Everything

```bash
# Stop and remove Docker containers
docker-compose down -v

# Remove Docker images
docker rmi monorepo/user-service:1.0
docker rmi monorepo/order-service:1.0

# Delete Kubernetes resources
kubectl delete -f k8s/

# Verify cleanup
docker ps -a
docker images
kubectl get all

# Clean build artifacts
npm run clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf .turbo apps/*/.turbo packages/*/.turbo
```

## Turborepo Commands

### Build Specific Service

```bash
# Build only order-service and its dependencies
npm run build -- --filter=@monorepo/order-service

# This automatically builds @monorepo/shared first
```

### Run Tasks in Parallel

```bash
# Lint all packages
npm run lint

# Test all packages
npm run test
```

### Clear Cache

```bash
# Clear Turborepo cache
rm -rf .turbo

# Clean all build outputs
npm run clean
```

## Workspace Management

### Add New Package

```bash
# Create new shared package
mkdir -p packages/new-package
cd packages/new-package
npm init -y

# Update name to @monorepo/new-package
# Add to workspaces in root package.json (already configured with packages/*)
```

### Add New Service

```bash
# Create new service
mkdir -p apps/new-service
cd apps/new-service
npm init -y

# Update name to @monorepo/new-service
# Add to workspaces in root package.json (already configured with apps/*)
```

### Install Dependencies

```bash
# Install in specific workspace
npm install express --workspace=@monorepo/user-service

# Install in all workspaces
npm install typescript --workspaces

# Install in root
npm install turbo --save-dev
```

## Production vs Simple Monorepo

### Simple Monorepo (your original setup)
- Multiple services in one repo
- No build orchestration
- Duplicate code between services
- Manual dependency management

### Production Monorepo (this setup)
- **Turborepo**: Smart caching and parallel builds
- **Shared packages**: Reusable code across services
- **Workspace management**: Centralized dependency management
- **Type safety**: Shared TypeScript types
- **Optimized builds**: Only rebuild what changed
- **Scalable**: Easy to add new services/packages

## Key Differences

### Code Sharing
```typescript
// Before: Duplicate httpClient in each service
// order-service/src/utils/httpClient.ts
// user-service/src/utils/httpClient.ts

// After: Import from shared package
import { createHttpClient, User } from '@monorepo/shared';
```

### Build Optimization
```bash
# Before: Rebuild everything every time
docker build ./user-service
docker build ./order-service

# After: Turborepo caches unchanged packages
npm run build  # Only rebuilds what changed
```

### Type Safety
```typescript
// Shared types ensure consistency
import { User, Order, ApiResponse } from '@monorepo/shared';

// Both services use same types - no drift
```

## Troubleshooting

### Cannot find module '@monorepo/shared'

**Cause:** The shared package hasn't been built yet, so TypeScript can't find the type declarations.

**Solution:**
```bash
cd monorepo
npm install
npm run build

# Reload your IDE
# VS Code: Cmd+Shift+P → "Developer: Reload Window"
```

**Verify the fix:**
```bash
# Check if shared package is built
ls -la packages/shared/dist/
# Should see: index.js, index.d.ts, types.d.ts, etc.

# Check if workspace is linked
ls -la node_modules/@monorepo/shared
# Should be a symlink to ../../packages/shared
```

### Turbo Error: "Found `pipeline` field instead of `tasks`"

**Cause:** Turbo 2.0+ renamed `pipeline` to `tasks` in turbo.json.

**Solution:**
```bash
# Edit turbo.json and change "pipeline" to "tasks"
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {  // Changed from "pipeline"
    "build": { ... }
  }
}
```

### npm warn Unknown cli config "--filter"

**Cause:** The `--filter` flag is a Turbo feature, not an npm feature.

**Wrong:**
```bash
npm run build --filter=@monorepo/shared  # ❌ Doesn't work
```

**Correct:**
```bash
npm run build                             # ✅ Builds everything
npx turbo build --filter=@monorepo/shared  # ✅ Builds specific package
```

### Workspace Not Found
```bash
# Reinstall dependencies
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

### Docker Build Issues
```bash
# Ensure building from monorepo root
docker build -f apps/user-service/Dockerfile .
# NOT: docker build apps/user-service/
```

## Next Steps

- Add testing framework (Jest, Vitest)
- Set up CI/CD pipeline with Turborepo caching
- Add remote caching for team collaboration
- Implement shared ESLint/Prettier configs
- Add more shared packages (database, auth, logging)
