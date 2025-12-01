# @rayltics

**@rayltics** is a high-performance, distributed e-commerce backend designed to handle + users/month. It utilizes a hybrid micro-services architecture combining gRPC for low-latency internal communication and Kafka for asynchronous event-driven consistency.

## Architecture Overview

The system is split into three distinct scaling clusters:

- **Transactors (Stateless):** CPU-bound services (Orders, Inventory) that scale horizontally.
- **Streamers (Stateful):** RAM-bound services (Chat, Notifications) handling long-lived WebSocket connections. They bridge users via Redis Pub/Sub.
- **Workers (Background):** Consumers that process Kafka events for eventual consistency (e.g., archiving chat logs, sending emails).

## Communication Patterns

- **External:** REST/GraphQL (via API Gateway) & WebSockets.
- **Internal Sync:** gRPC (Protobuf) for critical dependency calls (e.g., Gateway -> Inventory).
- **Internal Async:** Kafka events for side effects (e.g., Order Created -> Send Email).

## Project Structure (Nx Monorepo)

```bash
├── apps/
│   ├── api-gateway/          # Entry point (HTTP + WS Adapter)
│   ├── services/             # Stateless Cluster (gRPC)
│   │   ├── auth/             # JWT & Identity
│   │   ├── order/            # Order Processing & Sagas
│   │   ├── inventory/        # Stock management (Redis Locking)
│   │   └── catalog/          # Product Search (Mongo/Elastic)
│   ├── streamers/            # Stateful Cluster (WebSockets)
│   │   └── chat/             # Real-time Messaging
│   └── workers/              # Background Cluster
│       └── chat-persister/   # Saves Kafka stream to Mongo
│
├── packages/
│   ├── proto/                # Shared .proto files (Contracts)
│   ├── contracts/            # Shared DTOs & Event Definitions
│   └── common/               # Shared Utilities (Guards, Interceptors)
│
├── infra/
│   ├── docker/               # Local dev environment
│   ├── k8s/                  # Kubernetes manifests (Helm)
│   └── terraform/            # Cloud infrastructure (IaC)
```

## Getting Started

### Prerequisites

- Node.js v18+
- Docker & Docker Compose
- pnpm (recommended) or npm

## 1. Installation

### Cloning the repo and installing dependencies:

```bash
git clone https://github.com/itsferdiardiansa/rayltics.git
cd rayltics

pnpm install
```

## 2. Infrastructure Setup

### Spin up the Databases (Postgres, Mongo, Redis) and Brokers (Kafka, Zookeeper).

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

Note: The postgres container will automatically execute infra/docker/postgres-init.sql on the first run to create the 5 required databases (order_db, inventory_db, etc.).

### 3. Running the Apps

You can run all services in parallel using Nx:

```bash
npx nx run-many --target=serve --all --parallel=5
```

```bash
npx nx serve api-gateway
```

```bash
npx nx serve order-service
```

## Development Workflow

### Working with gRPC Protobufs

This project uses `.proto` files as the source of truth.

- Edit libs/proto/src/order.proto.
- The build system automatically copies these assets to the dist/ folder.
- Do not manually write TypeScript interfaces for these; let the NestJS gRPC compiler handle the mapping.

### Creating a New Microservice

Use the Nx generator to scaffold a new service:

```bash
npx nx g @nx/nest:app services/payment
```

Add it to docker-compose manually in infra/docker/docker-compose.yml

### Shared Libraries

- DTOs: Put request/response shapes in libs/contracts.
- Events: Put Kafka event classes in libs/contracts/src/events.
- Utils: Put Auth Guards or Logging logic in libs/common.

### Testing

We use Jest for Unit and E2E testing.

```bash
npx nx run-many --target=test --all
```

```bash
npx nx e2e order-service-e2e
```

### Deployment (Production)

### Docker Build

Since this is a monorepo, we build specific apps using the context of the root.

```bash
docker build -f apps/services/order/Dockerfile . -t rayltics/order-service:latest
```

### Kubernetes

Helm charts are located in infra/k8s/charts.

```bash
helm install order-service ./infra/k8s/charts/nestjs-service --set image.repository=rayltics/order-service
```

### Key Design Decisions

- **Why Hybrid?**
  - REST is too slow for internal chatter. We use gRPC. But gRPC is synchronous. We use Kafka for things that can wait.
- **Why Separate Chat?**
  - Chat requires maintaining state (socket connections). Mixing this with stateless Order processing creates scaling bottlenecks.
- **Why Distributed Locks?**
  - To prevent race conditions on inventory during high-concurrency events (Flash Sales), we use Redis Mutexes in the Inventory Service.
