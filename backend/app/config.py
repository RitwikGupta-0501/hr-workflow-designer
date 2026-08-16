"""Application configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API
    api_title: str = "HR Workflow Backend"
    api_version: str = "0.1.0"
    api_prefix: str = "/api"
    debug: bool = False

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/hr_workflow"
    database_echo: bool = False

    # Auth
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
