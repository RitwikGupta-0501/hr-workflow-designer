"""SQLAlchemy ORM models for the application."""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum
import uuid


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspaces = relationship("Workspace", back_populates="owner")
    workflows = relationship("Workflow", back_populates="created_by_user")


class Workspace(Base):
    """Workspace model - tenant isolation boundary."""

    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="workspaces")
    workflows = relationship("Workflow", back_populates="workspace")
    runs = relationship("WorkflowRun", back_populates="workspace")


class WorkflowStatus(str, enum.Enum):
    """Workflow status enumeration."""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Workflow(Base):
    """Workflow definition model."""

    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default=WorkflowStatus.DRAFT)
    current_version_id = Column(String(36), ForeignKey("workflow_versions.id"), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="workflows")
    created_by_user = relationship("User", back_populates="workflows")
    versions = relationship("WorkflowVersion", back_populates="workflow")
    runs = relationship("WorkflowRun", back_populates="workflow")


class WorkflowVersion(Base):
    """Immutable workflow version model."""

    __tablename__ = "workflow_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    nodes = Column(JSON, nullable=False)  # Array of node objects
    edges = Column(JSON, nullable=False)  # Array of edge objects
    metadata = Column(JSON, nullable=True)  # Optional metadata
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow = relationship("Workflow", back_populates="versions")
    runs = relationship("WorkflowRun", back_populates="workflow_version")

    __table_args__ = (
        {"indexes": [("workflow_id", "version_number")]},
    )


class WorkflowRunStatus(str, enum.Enum):
    """Workflow run status enumeration."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class WorkflowRun(Base):
    """Workflow run (execution instance) model."""

    __tablename__ = "workflow_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    workflow_version_id = Column(String(36), ForeignKey("workflow_versions.id"), nullable=False)
    status = Column(String(50), default=WorkflowRunStatus.PENDING)
    input_data = Column(JSON, nullable=True)  # Trigger input
    output_data = Column(JSON, nullable=True)  # Final output
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="runs")
    workflow = relationship("Workflow", back_populates="runs")
    workflow_version = relationship("WorkflowVersion", back_populates="runs")
    step_runs = relationship("StepRun", back_populates="workflow_run")


class StepRun(Base):
    """Individual step execution within a workflow run."""

    __tablename__ = "step_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_run_id = Column(String(36), ForeignKey("workflow_runs.id"), nullable=False)
    step_id = Column(String(255), nullable=False)  # Node ID from workflow definition
    step_type = Column(String(50), nullable=False)  # e.g., 'task', 'approval', 'ai_agent'
    status = Column(String(50), nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow_run = relationship("WorkflowRun", back_populates="step_runs")


class AuditLog(Base):
    """Audit log for tracking important events."""

    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)  # e.g., 'workflow_created', 'workflow_published'
    resource_type = Column(String(50), nullable=False)  # e.g., 'workflow', 'run'
    resource_id = Column(String(36), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        {"indexes": [("workspace_id", "created_at"), ("resource_type", "resource_id")]},
    )
