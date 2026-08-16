"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


# ============================================================================
# User Schemas
# ============================================================================


class UserCreate(BaseModel):
    """Schema for user creation."""

    email: EmailStr
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response."""

    id: str
    email: str
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Workspace Schemas
# ============================================================================


class WorkspaceCreate(BaseModel):
    """Schema for workspace creation."""

    name: str
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    """Schema for workspace response."""

    id: str
    name: str
    description: Optional[str]
    owner_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Workflow Node/Edge Schemas
# ============================================================================


class WorkflowNodeData(BaseModel):
    """Base workflow node data - matches frontend types."""

    title: str
    [key: str]: Any  # Allow additional fields


class WorkflowNode(BaseModel):
    """Workflow node definition."""

    id: str
    type: str
    position: Dict[str, float]
    data: WorkflowNodeData


class WorkflowEdge(BaseModel):
    """Workflow edge definition."""

    id: str
    source: str
    target: str
    label: Optional[str] = None
    labelStyle: Optional[Dict] = None
    labelBgStyle: Optional[Dict] = None
    labelBgPadding: Optional[List[int]] = None
    labelBgBorderRadius: Optional[int] = None


# ============================================================================
# Workflow Schemas
# ============================================================================


class WorkflowCreate(BaseModel):
    """Schema for workflow creation."""

    name: str
    description: Optional[str] = None
    nodes: List[WorkflowNode] = []
    edges: List[WorkflowEdge] = []


class WorkflowUpdate(BaseModel):
    """Schema for workflow update (draft only)."""

    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[WorkflowNode]] = None
    edges: Optional[List[WorkflowEdge]] = None


class WorkflowResponse(BaseModel):
    """Schema for workflow response."""

    id: str
    workspace_id: str
    name: str
    description: Optional[str]
    status: str
    current_version_id: Optional[str]
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Workflow Version Schemas
# ============================================================================


class WorkflowVersionResponse(BaseModel):
    """Schema for workflow version response."""

    id: str
    workflow_id: str
    version_number: int
    nodes: List[Dict]
    edges: List[Dict]
    metadata: Optional[Dict] = None
    published_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowPublishRequest(BaseModel):
    """Request to publish a workflow version."""

    pass  # Publish uses current state of workflow


# ============================================================================
# Workflow Run Schemas
# ============================================================================


class WorkflowRunCreate(BaseModel):
    """Schema for creating a workflow run."""

    workflow_id: str
    input_data: Optional[Dict[str, Any]] = None


class WorkflowRunResponse(BaseModel):
    """Schema for workflow run response."""

    id: str
    workflow_id: str
    workflow_version_id: str
    status: str
    input_data: Optional[Dict]
    output_data: Optional[Dict]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Step Run Schemas
# ============================================================================


class StepRunResponse(BaseModel):
    """Schema for step run response."""

    id: str
    workflow_run_id: str
    step_id: str
    step_type: str
    status: str
    input_data: Optional[Dict]
    output_data: Optional[Dict]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Auth Schemas
# ============================================================================


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data stored in JWT token."""

    user_id: str
    workspace_id: str
