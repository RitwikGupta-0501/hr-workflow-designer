"""Authentication API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Workspace
from app.schemas import UserCreate, UserResponse, Token
from app.auth import hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.flush()

    # Create default workspace
    workspace = Workspace(
        name=f"{user_data.username}'s Workspace",
        owner_id=user.id,
    )
    db.add(workspace)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    email: str,
    password: str,
    db: Session = Depends(get_db),
):
    """Login and get access token."""
    from app.auth import verify_password

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Get user's first workspace
    workspace = user.workspaces[0] if user.workspaces else None
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no workspace"
        )

    token = create_access_token(user.id, workspace.id)
    return {"access_token": token}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(None),  # Will be set by dependency
):
    """Get current user info."""
    return current_user
