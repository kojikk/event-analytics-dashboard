import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import httpx
from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from jose import JWTError, jwt
from pydantic import BaseModel
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Конфигурация
class Config:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # URLs сервисов (пока заглушки)
    AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8001")
    COLLECTOR_SERVICE_URL = os.getenv("COLLECTOR_SERVICE_URL", "http://collector:8002")
    ANALYTICS_SERVICE_URL = os.getenv("ANALYTICS_SERVICE_URL", "http://analytics:8003")
    
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

config = Config()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# FastAPI app
app = FastAPI(
    title="Event Analytics API Gateway",
    description="Central gateway for Event Analytics Dashboard",
    version="1.0.0"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Rate limiting error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security
security = HTTPBearer(auto_error=False)

# Models
class EventPayload(BaseModel):
    event_type: str
    user_id: str
    session_id: str
    timestamp: str
    url: str
    user_agent: str
    screen_resolution: str
    additional_data: Optional[Dict[str, Any]] = {}

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(credentials.credentials, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        username = payload.get("sub")
        if username is None:
            return None
        return {"username": username, "token": credentials.credentials}
    except JWTError:
        return None

def require_auth(user = Depends(verify_token)):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Middleware для логирования запросов
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.utcnow()
    
    # Логируем входящий запрос
    logger.info(f"Incoming request: {request.method} {request.url.path} from {request.client.host}")
    
    response = await call_next(request)
    
    # Логируем время обработки
    process_time = (datetime.utcnow() - start_time).total_seconds()
    logger.info(f"Request processed in {process_time:.3f}s with status {response.status_code}")
    
    return response

# Health check
@app.get("/healthz")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Auth endpoints (заглушки)
@app.post("/auth/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(request: Request, login_data: LoginRequest):
    logger.info(f"Login attempt for user: {login_data.username}")
    
    # Заглушка аутентификации
    if login_data.username == "admin" and login_data.password == "admin":
        access_token = create_access_token(data={"sub": login_data.username})
        return LoginResponse(
            access_token=access_token,
            expires_in=config.JWT_EXPIRATION_HOURS * 3600
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

@app.post("/auth/register")
@limiter.limit("3/minute")
async def register(request: Request, user_data: dict):
    # Заглушка регистрации
    logger.info("Registration attempt")
    return {"message": "Registration endpoint - not implemented yet"}

@app.get("/auth/verify")
async def verify_user(user = Depends(require_auth)):
    return {"valid": True, "user": user["username"]}

# Events endpoints
@app.post("/events", status_code=202)
@limiter.limit("100/minute")
async def collect_event(request: Request, event: EventPayload):
    logger.info(f"Received event: {event.event_type} from user {event.user_id}")
    
    # Заглушка - в реальности переправим в Collector Service
    # try:
    #     async with httpx.AsyncClient() as client:
    #         response = await client.post(f"{config.COLLECTOR_SERVICE_URL}/events", json=event.dict())
    #         return response.json()
    # except Exception as e:
    #     logger.error(f"Error forwarding event: {e}")
    #     raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    
    # Пока просто логируем и возвращаем 202
    return {"message": "Event accepted", "event_id": f"evt_{datetime.utcnow().timestamp()}"}

# Analytics endpoints (заглушки)
@app.get("/analytics/events/count")
async def get_event_count(user = Depends(require_auth)):
    # Заглушка
    return {"total_events": 1247, "today": 89}

@app.get("/analytics/events/by-type")
async def get_events_by_type(user = Depends(require_auth)):
    # Заглушка
    return [
        {"event_type": "button_click", "count": 456},
        {"event_type": "page_view", "count": 789},
        {"event_type": "feature_usage", "count": 123}
    ]

@app.get("/analytics/events/by-user")
async def get_events_by_user(user = Depends(require_auth)):
    # Заглушка
    return [
        {"user_id": "user_001", "count": 45},
        {"user_id": "user_002", "count": 67},
        {"user_id": "user_003", "count": 23}
    ]

@app.get("/analytics/events/timeseries")
async def get_events_timeseries(user = Depends(require_auth)):
    # Заглушка
    return [
        {"timestamp": "2024-01-01T00:00:00Z", "count": 12},
        {"timestamp": "2024-01-01T01:00:00Z", "count": 23},
        {"timestamp": "2024-01-01T02:00:00Z", "count": 34}
    ]

# Generic proxy function (для будущего использования)
async def proxy_request(service_url: str, path: str, method: str, **kwargs):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(method, f"{service_url}{path}", **kwargs)
            return response.json()
    except Exception as e:
        logger.error(f"Error proxying to {service_url}{path}: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)