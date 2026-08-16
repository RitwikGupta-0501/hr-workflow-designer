"""Workflow API endpoints."""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models import User, Workflow, WorkflowVersion, WorkflowStatus
from app.schemas import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowVersionResponse,
    WorkflowPublishRequest,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new workflow draft."""
    # For now, assume first workspace (Phase A simplification)
    workspace = current_user.workspaces[0] if current_user.workspaces else None
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no workspace"
        )

    workflow = Workflow(
        workspace_id=workspace.id,
        name=workflow_data.name,
        description=workflow_data.description,
        created_by=current_user.id,
        status=WorkflowStatus.DRAFT,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("", response_model=List[WorkflowResponse])
def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all workflows in user's workspace."""
    workspace = current_user.workspaces[0] if current_user.workspaces else None
    if not workspace:
        return []

    workflows = db.query(Workflow).filter(
        Workflow.workspace_id == workspace.id
    ).all()
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific workflow."""
    workspace = current_user.workspaces[0] if current_user.workspaces else None
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No workspace"
        )

    workflow = db.query(Workflow).filter(
        and_(
            Workflow.id == workflow_id,
            Workflow.workspace_id == workspace.id,
        )
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: str,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a workflow draft."""
    workspace = current_user.workspaces[0] if current_user.workspaces else None
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No workspace"
        )

    workflow = db.query(Workflow).filter(
        and_(
            Workflow.id == workflow_id,
            Workflow.workspace_id == workspace.id,
        )
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    if workflow.status != WorkflowStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only edit draft workflows"
        )

    # Update fields
    if workflow_data.name is not None:
        workflow.name = workflow_data.name
    if workflow_data.description is not None:
        workflow.description = workflow_data.description

    db.commit()
    db.refresh(workflow)
    return workflow


@router.post("/{workflow_id}/publish", response_model=WorkflowVersionResponse)
def publish_workflow(
    workflow_id: str,
    _publish_request: WorkflowPublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Publish a workflow - creates immutable version."""
    workspace = current_user.workspaces[0] if current_user.workspaces else None
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No workspace"
        )

    workflow = db.query(Workflow).filter(
        and_(
            Workflow.id == workflow_id,
            Workflow.workspace_id == workspace.id,
        )
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    # Get next version number
    latest_version = db.query(WorkflowVersion).filter(
        WorkflowVersion.workflow_id == workflow.id
    ).order_by(WorkflowVersion.version_number.desc()).first()

    next_version_number = (latest_version.version_number + 1) if latest_version else 1

    # Create immutable version
    version = WorkflowVersion(
        workflow_id=workflow.id,
        version_number=next_version_number,
        nodes=[],  # TODO: store current graph state
        edges=[],  # TODO: store current graph state
        published_at=datetime.utcnow(),
    )
    db.add(version)
    workflow.status = WorkflowStatus.PUBLISHED
    workflow.current_version_id = version.id
    db.commit()
    db.refresh(version)
    return version


@router.get("/{workflow_id}/versions", response_model=List[WorkflowVersionResponse])
def get_workflow_versions(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all versions of a workflow."""
    workspace = current_user.workspaces[0] if current_user.workspaces else None
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No workspace"
        )

    workflow = db.query(Workflow).filter(
        and_(
            Workflow.id == workflow_id,
            Workflow.workspace_id == workspace.id,
        )
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    versions = db.query(WorkflowVersion).filter(
        WorkflowVersion.workflow_id == workflow.id
    ).order_by(WorkflowVersion.version_number.desc()).all()

    return versions


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a workflow (only drafts)."""
    workspace = current_user.workspaces[0] if current_user.workspaces else None
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No workspace"
        )

    workflow = db.query(Workflow).filter(
        and_(
            Workflow.id == workflow_id,
            Workflow.workspace_id == workspace.id,
        )
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    if workflow.status != WorkflowStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft workflows"
        )

    db.delete(workflow)
    db.commit()
    return None
