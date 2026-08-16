# HR Workflow Backend

FastAPI-based backend for the HR Workflow Designer. Implements Phase A: Backend Foundation.

## Architecture

- **Framework**: FastAPI (async Python web framework)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Auth**: JWT tokens with bcrypt password hashing

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app factory
│   ├── config.py            # Configuration from environment
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # ORM models (User, Workflow, etc.)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # Password and JWT utilities
│   ├── dependencies.py      # FastAPI dependencies
│   └── api/
│       ├── __init__.py
│       ├── auth.py          # /api/auth endpoints
│       └── workflows.py     # /api/workflows endpoints
├── alembic/
│   ├── env.py               # Migration runner
│   ├── script.py.mako       # Migration template
│   └── versions/            # Generated migration files
├── tests/                   # Unit and integration tests
├── .env.example             # Environment variables template
├── pyproject.toml           # Dependencies and project config
└── README.md                # This file
```

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 13+
- pip or uv

### 2. Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Create .env file
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Database Setup

```bash
# Run migrations to create tables
alembic upgrade head
```

### 4. Run Server

```bash
# Development server with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

## API Endpoints (Phase A)

### Authentication

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Get JWT access token
- `GET /api/auth/me` - Get current user info

### Workflows

- `POST /api/workflows` - Create workflow draft
- `GET /api/workflows` - List workflows
- `GET /api/workflows/{id}` - Get workflow details
- `PUT /api/workflows/{id}` - Update workflow draft
- `POST /api/workflows/{id}/publish` - Publish immutable version
- `GET /api/workflows/{id}/versions` - Get version history
- `DELETE /api/workflows/{id}` - Delete workflow (draft only)

### Health

- `GET /health` - Health check

## Database Models

### Phase A Entities

- **User**: Authentication and authorization
- **Workspace**: Tenant isolation boundary
- **Workflow**: Versioned workflow definition
- **WorkflowVersion**: Immutable published version
- **WorkflowRun**: Execution instance (empty, Phase B)
- **StepRun**: Individual step execution (empty, Phase B)
- **AuditLog**: Action audit trail

## Environment Variables

See `.env.example` for all options:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/hr_workflow

# Auth
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Run specific test
pytest tests/test_workflows.py::test_create_workflow
```

## Development

### Code Quality

```bash
# Format code
black app/

# Lint
ruff check app/

# Type checking
mypy app/
```

### Create Migration

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "description of changes"

# Review generated migration in alembic/versions/
# Then upgrade
alembic upgrade head
```

## Next Steps (Phase B)

When ready to implement Phase B (Execution Service):

1. Add WorkflowRun execution logic
2. Implement StepRun tracking
3. Add durability layer (Temporal)
4. Create execution events system
5. Build retry and timeout policies

## Production Checklist

- [ ] Change `SECRET_KEY` to strong random value
- [ ] Set `DEBUG=False`
- [ ] Configure CORS_ORIGINS properly
- [ ] Use production PostgreSQL instance
- [ ] Add database backups
- [ ] Set up observability (logging, metrics)
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Add request logging middleware
- [ ] Review security headers

## Troubleshooting

### "Database connection refused"

Ensure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### "ModuleNotFoundError: No module named 'app'"

Make sure you're in the backend directory and have installed the package:
```bash
cd backend
pip install -e .
```

### Alembic migration issues

Reset everything and start fresh:
```bash
# Drop all tables (WARNING: DELETES DATA)
alembic downgrade base

# Regenerate from current models
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Architecture Document](../docs/dev/architecture.md)
