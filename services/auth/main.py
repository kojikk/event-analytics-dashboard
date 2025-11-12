import os
import logging
from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from dotenv import load_dotenv

from models import User, Base
from schemas import (
    UserCreate, UserResponse, UserLogin, Token, MessageResponse, 
    HealthResponse, UserStatsResponse
)
from database import get_db, create_tables, check_db_health, engine
from auth_utils import (
    authenticate_user, create_access_token, get_current_active_user,
    get_user_by_username, get_user_by_email, get_password_hash,
    create_initial_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Analytics Auth Service",
    description="Authentication and user management service for Event Analytics Dashboard",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and create initial data."""
    logger.info("Starting Auth Service...")
    
    # Create tables
    await create_tables()
    
    # Create initial admin user if not exists
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(select(User).where(User.username == "admin"))
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                initial_user_data = create_initial_user()
                admin_user = User(**initial_user_data)
                session.add(admin_user)
                await session.commit()
                logger.info("Created initial admin user: admin/admin")
            else:
                logger.info("Admin user already exists")
                
        except Exception as e:
            logger.error(f"Error creating initial user: {e}")
            await session.rollback()

# Health check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    db_healthy = await check_db_health()
    return HealthResponse(
        status="healthy" if db_healthy else "unhealthy",
        timestamp=datetime.utcnow(),
        database=db_healthy
    )

# Authentication endpoints
@app.post("/register", response_model=UserResponse)
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    logger.info(f"Registration attempt for user: {user_create.username}")
    
    # Check if username already exists
    existing_user = await get_user_by_username(db, user_create.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = await get_user_by_email(db, user_create.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_create.password)
    db_user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    logger.info(f"User {user_create.username} registered successfully")
    return db_user

@app.post("/login", response_model=Token)
async def login(user_login: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    logger.info(f"Login attempt for user: {user_login.username}")
    
    user = await authenticate_user(db, user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User {user_login.username} logged in successfully")
    return Token(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    )

@app.get("/verify", response_model=UserResponse)
async def verify_token(current_user: User = Depends(get_current_active_user)):
    """Verify JWT token and return current user info."""
    return current_user

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

# User management endpoints
@app.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of users (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID."""
    # Users can only see their own data unless they're superuser
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

# Statistics endpoint
@app.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user statistics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Get total users
    total_result = await db.execute(select(func.count(User.id)))
    total_users = total_result.scalar()
    
    # Get active users
    active_result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    active_users = active_result.scalar()
    
    # Get recent registrations (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )
    recent_registrations = recent_result.scalar()
    
    return UserStatsResponse(
        total_users=total_users,
        active_users=active_users,
        recent_registrations=recent_registrations
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
