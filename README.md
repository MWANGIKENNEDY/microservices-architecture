# Microservices: Docker to Kubernetes Setup

This project demonstrates a microservices architecture with two services (`user-service` and `order-service`) that can be deployed using either Docker Compose or Kubernetes.

## Architecture Overview

- **user-service**: Manages user data (Port 4001)
- **order-service**: Manages orders and communicates with user-service (Port 4000)

## Why One docker-compose.yaml but Two Dockerfiles?

**docker-compose.yaml**: Orchestrates multiple services together. It defines how all your microservices run, connect, and communicate as a system.

**Dockerfiles** (one per service): Each microservice has its own Dockerfile because:
- Each service has different dependencies and build steps
- Services can use different base images or configurations
- Allows independent building and versioning of each service
- Enables separate deployment and scaling

Think of it as: Dockerfiles = "how to build each service", docker-compose = "how to run them together"

## Docker Setup

### Build Images

```bash
# Build all services defined in docker-compose
docker-compose build

# Or build individually
docker build -t kkiiru/user-service:1.0 ./user-service
docker build -t kkiiru/order-service:1.0 ./order-service
```

### Create and Start Containers

```bash
# Start all services (builds if needed)
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# Start specific service
docker-compose up user-service
```

### Check Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Logs for specific service
docker-compose logs -f user-service
docker-compose logs -f order-service

# Or using docker directly
docker logs user-service
docker logs order-service -f
```

### Test Communication Between Services

```bash
# Test user-service directly
curl http://localhost:4001/users

# Test order-service (which calls user-service internally)
curl http://localhost:4000/orders

# Exec into order-service container to test internal networking
docker exec -it order-service sh
wget -qO- http://user-service:4001/users
```

### Stop and Remove Containers

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop user-service
```

### Delete Images

```bash
# Remove specific images
docker rmi kkiiru/user-service:1.0
docker rmi kkiiru/order-service:1.0

# Remove all unused images
docker image prune -a
```

## Kubernetes Setup

### Prerequisites

```bash
# Ensure Kubernetes is running (Docker Desktop, Minikube, etc.)
kubectl cluster-info

# Verify nodes are ready
kubectl get nodes
```

### Build Images for Kubernetes

```bash
# Build images (same as Docker)
docker build -t kkiiru/user-service:1.0 ./user-service
docker build -t kkiiru/order-service:1.0 ./order-service

# Note: imagePullPolicy is set to "Never" in deployments
# This tells K8s to use local images instead of pulling from registry
```

### Deploy to Kubernetes

```bash
# Deploy user-service
kubectl apply -f k8s/user-deployment.yaml
kubectl apply -f k8s/user-service.yaml

# Deploy order-service
kubectl apply -f k8s/order-deployment.yaml
kubectl apply -f k8s/order-service.yaml

# Or deploy all at once
kubectl apply -f k8s/
```

### Check Deployment Status

```bash
# View all deployments
kubectl get deployments

# View all pods
kubectl get pods

# View all services
kubectl get services

# Detailed info about specific deployment
kubectl describe deployment user-service
kubectl describe deployment order-service

# Check pod logs
kubectl logs -l app=user-service
kubectl logs -l app=order-service

# Follow logs in real-time
kubectl logs -f -l app=order-service
```

### Test Networking in Kubernetes

```bash
# Get service details
kubectl get svc

# Port-forward to access services locally
kubectl port-forward service/user-service 4001:4001
kubectl port-forward service/order-service 4000:4000

# In another terminal, test the services
curl http://localhost:4001/users
curl http://localhost:4000/orders

# Test internal service-to-service communication
# Exec into order-service pod
kubectl exec -it $(kubectl get pod -l app=order-service -o jsonpath="{.items[0].metadata.name}") -- sh

# Inside the pod, test calling user-service
wget -qO- http://user-service:4001/users
```

### Scale Deployments

```bash
# Scale user-service to 3 replicas
kubectl scale deployment user-service --replicas=3

# Scale order-service to 5 replicas
kubectl scale deployment order-service --replicas=5

# Verify scaling
kubectl get pods
```

### Update Deployments

```bash
# After rebuilding images with new changes
kubectl rollout restart deployment/user-service
kubectl rollout restart deployment/order-service

# Check rollout status
kubectl rollout status deployment/user-service
```

### Stop/Delete Kubernetes Deployment

```bash
# Delete specific resources
kubectl delete -f k8s/user-deployment.yaml
kubectl delete -f k8s/user-service.yaml
kubectl delete -f k8s/order-deployment.yaml
kubectl delete -f k8s/order-service.yaml

# Or delete all at once
kubectl delete -f k8s/

# Verify deletion
kubectl get all
```

## Service Communication

### Docker Compose
Services communicate using service names as hostnames:
- `order-service` calls `http://user-service:4001`
- Docker's internal DNS resolves service names to container IPs

### Kubernetes
Services communicate using Kubernetes Service DNS:
- `order-service` calls `http://user-service:4001`
- Kubernetes DNS resolves to the Service, which load balances across pod replicas
- Full DNS name: `user-service.default.svc.cluster.local` (short form `user-service` works within same namespace)

## Key Differences: Docker Compose vs Kubernetes

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| **Orchestration** | Single host | Multi-node cluster |
| **Scaling** | Manual (`docker-compose up --scale`) | Declarative (`replicas: 2`) |
| **Load Balancing** | Basic round-robin | Advanced with health checks |
| **Self-healing** | Restart on failure | Automatic pod replacement |
| **Rolling Updates** | Manual | Built-in with zero downtime |
| **Production Ready** | Development/testing | Production-grade |

## Troubleshooting

### Docker Issues

```bash
# Container won't start
docker-compose logs service-name

# Network issues
docker network ls
docker network inspect microservices_default

# Clean slate
docker-compose down -v
docker system prune -a
```

### Kubernetes Issues

```bash
# Pod stuck in pending
kubectl describe pod <pod-name>

# Image pull errors (check imagePullPolicy)
kubectl get events --sort-by=.metadata.creationTimestamp

# Service not accessible
kubectl get endpoints user-service
kubectl get endpoints order-service

# Reset everything
kubectl delete -f k8s/
kubectl get all  # verify clean state
```

## Project Structure

```
.
├── docker-compose.yaml          # Orchestrates both services
├── k8s/
│   ├── user-deployment.yaml     # User service pods
│   ├── user-service.yaml        # User service networking
│   ├── order-deployment.yaml    # Order service pods
│   └── order-service.yaml       # Order service networking
├── user-service/
│   ├── Dockerfile               # Build instructions for user-service
│   ├── .env                     # Environment variables
│   └── src/                     # Source code
└── order-service/
    ├── Dockerfile               # Build instructions for order-service
    ├── .env                     # Environment variables
    └── src/                     # Source code
```

## Quick Start Commands

```bash
# Docker Compose (Development)
docker-compose up -d
docker-compose logs -f
curl http://localhost:4000/orders
docker-compose down

# Kubernetes (Production-like)
kubectl apply -f k8s/
kubectl get pods
kubectl port-forward service/order-service 4000:4000
curl http://localhost:4000/orders
kubectl delete -f k8s/
```
