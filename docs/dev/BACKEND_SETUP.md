# Backend Setup Guide - Phase A Foundation

This guide walks you through setting up and running the FastAPI backend for the HR Workflow Designer.

## 📋 Prerequisites

- Python 3.11 or later
- PostgreSQL 13 or later (or use Docker Compose)
- pip or uv package manager
- Git

## 🚀 Quick Start (5 minutes)

### Option 1: Using Docker Compose (Recommended)

Easiest option - everything runs in containers:

```bash
cd backend

# Start PostgreSQL and run migrations
docker-compose up

# In another terminal, test the API
curl http://localhost:8000/health

# Access API documentation
open http://localhost:8000/docs
```

The API will be available at `http://localhost:8000`

### Option 2: Local Setup

If you prefer running on your machine:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -e ".[dev]"

# 4. Setup environment file
cp .env.example .env
# Edit .env if needed (default localhost settings should work)

# 5. Start PostgreSQL (must be running)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# 6. Run migrations
alembic upgrade head

# 7. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🧪 Test the API

### 1. View Interactive API Documentation

Open http://localhost:8000/docs in your browser

### 2. Register a User

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "testpass123"
  }'
```

Response:
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "username": "testuser",
  "is_active": true,
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

### 3. Login and Get Token

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "testpass123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 4. Create a Workflow

```bash
curl -X POST "http://localhost:8000/api/workflows" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "description": "A test workflow"
  }'
```

### 5. List Workflows

```bash
curl -X GET "http://localhost:8000/api/workflows" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              ← FastAPI app entry point
│   ├── config.py            ← Environment configuration
│   ├── database.py          ← SQLAlchemy setup
│   ├── models.py            ← Database models
│   ├── schemas.py           ← Request/response schemas
│   ├── auth.py              ← Password & JWT utilities
│   ├── dependencies.py      ← FastAPI dependencies
│   └── api/
│       ├── auth.py          ← Authentication endpoints
│       └── workflows.py     ← Workflow CRUD endpoints
├── alembic/
│   ├── env.py               ← Migration runner
│   └── versions/            ← Generated migrations
├── tests/
│   ├── conftest.py          ← pytest configuration
│   ├── test_auth.py         ← Authentication tests
│   └── test_workflows.py    ← Workflow tests
├── pyproject.toml           ← Dependencies
├── .env.example             ← Environment template
├── docker-compose.yml       ← Docker setup
└── README.md                ← Detailed documentation
```

## 🔑 Key Concepts

### Authentication Flow

1. **Register**: Create user account with email/password
   - User automatically gets a workspace
   - Password is hashed with bcrypt

2. **Login**: Get JWT access token
   - Token contains: user_id, workspace_id, expiry
   - Valid for 24 hours by default

3. **API Requests**: Include token in Authorization header
   - Format: `Authorization: Bearer TOKEN`
   - Token is validated for each request

### Workflow State

- **Draft**: Editable workflow definition
- **Published**: Immutable version (ready to execute in Phase B)
- **Archived**: No longer active

### Multi-Tenant Model

- Every user belongs to exactly one workspace
- All resources are scoped to workspace
- APIs automatically filter by user's workspace

## 📝 Common Tasks

### Run Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_auth.py

# With coverage
pytest --cov=app tests/

# Verbose output
pytest -v
```

### Create New Migration

After modifying models in `app/models.py`:

```bash
# Auto-generate migration
alembic revision --autogenerate -m "Add new field to workflow"

# Review the generated file in alembic/versions/
# Then apply it
alembic upgrade head
```

### Format Code

```bash
black app/
ruff check app/ --fix
mypy app/
```

### View Database

```bash
# Connect to local PostgreSQL
psql -U postgres -d hr_workflow

# List tables
\dt

# Example query
SELECT id, name, status FROM workflows;
```

## 🐛 Troubleshooting

### "connection refused" or "database connection error"

PostgreSQL is not running. Start it:

```bash
# Using Docker Compose
docker-compose up postgres

# Or locally
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### "ModuleNotFoundError: No module named 'app'"

You need to install the package:

```bash
cd backend
pip install -e .
```

### "Alembic can't find tables"

Reset migrations and start fresh:

```bash
# Drop all tables (WARNING: DESTROYS DATA)
alembic downgrade base

# Regenerate from current models
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

### Port 8000 already in use

Use a different port:

```bash
uvicorn app.main:app --reload --port 8001
```

## 🔒 Security Notes

### Development vs Production

**Development** (.env):
```
SECRET_KEY=dev-key-not-secure
DEBUG=True
CORS_ORIGINS=*
```

**Production** (set these):
```
SECRET_KEY=<LONG_RANDOM_STRING>
DEBUG=False
CORS_ORIGINS=https://yourdomain.com
DATABASE_URL=<PRODUCTION_DATABASE>
```

### Important

- ⚠️ Never commit `.env` file
- ⚠️ Change `SECRET_KEY` before production deployment
- ⚠️ Use HTTPS in production
- ⚠️ Set `DEBUG=False` in production
- ⚠️ Use environment variables for sensitive data

## 📚 API Reference

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new user |
| POST | `/auth/login` | Get access token |
| GET | `/auth/me` | Get current user |

### Workflow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workflows` | Create new workflow |
| GET | `/workflows` | List workflows |
| GET | `/workflows/{id}` | Get workflow |
| PUT | `/workflows/{id}` | Update workflow |
| POST | `/workflows/{id}/publish` | Publish version |
| GET | `/workflows/{id}/versions` | Get versions |
| DELETE | `/workflows/{id}` | Delete workflow |

## 🎯 Next Steps

1. **Explore the API**
   - Use http://localhost:8000/docs
   - Test each endpoint
   - Check the database with `psql`

2. **Connect Frontend**
   - Update frontend API base URL to `http://localhost:8000`
   - Replace MSW mocks with real API calls
   - Test end-to-end

3. **Phase B Preparation**
   - Review execution model in architecture.md
   - Plan StepRun execution state
   - Design execution events

## 📖 Documentation

- [Full Backend README](./README.md) - Detailed documentation
- [Architecture Document](../docs/dev/architecture.md) - System design
- [FastAPI Docs](https://fastapi.tiangolo.com/) - Framework reference
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/) - ORM reference

## ❓ Questions?

Refer to:
1. README.md in backend/ folder
2. Inline code comments
3. Test files for usage examples
4. Architecture document for system design
