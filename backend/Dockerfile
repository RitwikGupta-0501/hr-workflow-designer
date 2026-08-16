# syntax=docker/dockerfile:1.7

# ------------------------------------------------------------------------------
# Stage 1: Base Configuration
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Development (Hot-reload, full toolchain, local volume mounted)
# ------------------------------------------------------------------------------
FROM base AS development

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv

COPY pyproject.toml ./
# Dummy package structure to allow dependency install caching
RUN mkdir -p app && touch app/__init__.py

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel && \
    pip install -e .

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]

# ------------------------------------------------------------------------------
# Stage 3: Builder (Compiles wheels into isolated virtualenv)
# ------------------------------------------------------------------------------
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv

COPY pyproject.toml ./
RUN mkdir -p app && touch app/__init__.py

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir .

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

# Install the actual app code into the venv
RUN pip install --no-deps .

# ------------------------------------------------------------------------------
# Stage 4: Production (Minimal runtime, non-root user)
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install only runtime C libraries (e.g. libpq for PostgreSQL drivers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -u 10001 -m -s /bin/sh appuser

# Copy virtual environment and application from builder
COPY --from=builder --chown=appuser:appuser /opt/venv /opt/venv
COPY --from=builder --chown=appuser:appuser /app /app

USER appuser

# Built-in python healthcheck: no curl needed in production image
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"]