# Docker Build Scaling Strategies

This document outlines practical strategies for scaling Docker Compose and Docker builds as the application stack grows. The goal is to keep local development fast, production builds lean, and project configuration maintainable.

## 1. The Override Pattern (Zero-Flag Dev vs. Prod)

Docker Compose supports merging multiple compose files. By default, `docker compose up` loads `docker-compose.yml` and automatically merges in `docker-compose.override.yml` when it exists.

This is the best approach when the project is still small and the primary goal is to separate development and production behavior without requiring lots of command-line flags or profile juggling.

### How it works

- `docker-compose.yml` contains the base stack configuration.
- `docker-compose.override.yml` contains local development overrides.
- `docker-compose.prod.yml` contains production overrides.

This gives a clean mental model:

- base = stable shared configuration
- override = local dev experience
- prod = production runtime settings

### Recommended file layout

```text
backend/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.override.yml
├── docker-compose.prod.yml
├── app/
├── alembic/
└── .env
```

### Base compose example

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: hr_workflow_db
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-hr_workflow}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-hr_workflow}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-hr_workflow}
      APP_ENV: ${APP_ENV:-development}
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile

volumes:
  postgres_data:
```

### Development override example

```yaml
services:
  postgres:
    ports:
      - "5432:5432"

  backend:
    build:
      target: development
    container_name: hr_backend_dev
    ports:
      - "8000:8000"
    environment:
      DEBUG: "True"
      SECRET_KEY: dev-insecure-key
    volumes:
      - ./backend:/app

  frontend:
    build:
      target: development
    container_name: hr_frontend_dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
```

### Production override example

```yaml
services:
  postgres:
    restart: always

  backend:
    build:
      target: production
    container_name: hr_backend_prod
    environment:
      DEBUG: "False"
      SECRET_KEY: ${SECRET_KEY}
    restart: always

  frontend:
    build:
      target: production
    container_name: hr_frontend_prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

### Execution commands

Local development:

```bash
docker compose up --build
```

This automatically merges the base file and the override file.

Production deployment:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### When to use this pattern

Use the override pattern when:

- the project has a small number of services
- the aim is to keep local development simple
- you want a low-friction dev/prod split without larger file sprawl

---

## 2. Modern Modular Compose (`include` directive)

As the stack grows, a single monolithic compose file becomes harder to maintain. The `include` directive lets you split configuration by area of responsibility, such as infrastructure, backend, frontend, or worker services.

This is especially useful when the project adds Redis, Celery workers, object storage, or multiple internal services.

### Example project structure

```text
my-project/
├── docker-compose.yml
├── .env
├── infra/
│   └── compose.yaml
├── backend/
│   ├── compose.yaml
│   ├── Dockerfile
│   └── app/
└── frontend/
    ├── compose.yaml
    ├── Dockerfile
    └── src/
```

### Root compose file

```yaml
include:
  - infra/compose.yaml
  - backend/compose.yaml
  - frontend/compose.yaml
```

### Infrastructure compose example

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: hr_db
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-hr_workflow}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-hr_workflow}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: hr_redis
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Backend compose example

```yaml
x-backend-base: &backend-base
  build:
    context: .
    dockerfile: Dockerfile
    target: development
  environment:
    DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-hr_workflow}
    REDIS_URL: redis://redis:6379/0
  volumes:
    - .:/app
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy

services:
  backend-api:
    <<: *backend-base
    container_name: hr_api
    ports:
      - "8000:8000"

  backend-worker:
    <<: *backend-base
    container_name: hr_worker
    command: ["celery", "-A", "app.worker", "worker", "--loglevel=info"]
```

### Why this scales better

- configuration is separated by domain
- smaller compose files are easier to read and maintain
- teams can work on different service groups without editing the same file
- multi-service projects remain organized as they grow

---

## 3. Dockerfile Layering for Build Performance

The compose strategy is only half the story. Build performance also depends on Dockerfile layering.

### Correct dependency-first pattern

```dockerfile
FROM python:3.11-slim AS base
WORKDIR /app

COPY pyproject.toml ./
RUN pip install -e .

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini
```

### Why this matters

If you copy the whole app before installing dependencies, then any app file change invalidates the dependency layer cache. That leads to slower builds.

The correct order keeps package installation cached and only rebuilds the later layers when the source code changes.

### Dev vs production behavior

- Development: bind-mount source files and enable hot reload.
- Production: copy the final app and run a lean runtime image.

---

## 4. Which Strategy Should You Choose?

### Choose the override pattern if:

- you have a small stack
- you want a straightforward dev/prod split
- you want quick local iteration without extra complexity

### Choose modular compose includes if:

- your stack has multiple domains and services
- you expect workers, caches, queue processors, or background jobs
- you want clean separation and fewer merge conflicts

### Use both together when needed:

- base compose file for shared services
- override files for local development
- modular includes for larger infrastructure domains

---

## 5. Recommended Long-Term Setup

For this project, a practical default is:

- use a base compose file for shared dependencies
- use an override file for local development
- use a production compose override for deployment
- keep Dockerfile builds dependency-aware and multi-stage

This gives a healthy middle ground:

- simple to use locally
- scalable as the system grows
- efficient both in build time and runtime footprint

---

## 6. Summary

Docker build and compose scaling is mostly about separating concerns:

- local dev configuration from production configuration
- dependency installation from source code copying
- shared infra from app-specific service definitions

This keeps the stack easier to reason about, easier to maintain, and faster to build as the project grows.
