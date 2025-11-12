from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class EventPayload(BaseModel):
    """Схема для входящих событий от фронтенда"""
    event_type: str = Field(..., min_length=1, max_length=100)
    user_id: str = Field(..., min_length=1, max_length=100)
    session_id: str = Field(..., min_length=1, max_length=100)
    timestamp: str
    url: str = Field(..., max_length=500)
    user_agent: str = Field(..., max_length=1000)
    screen_resolution: str = Field(..., max_length=50)
    additional_data: Optional[Dict[str, Any]] = {}

class EventResponse(BaseModel):
    """Ответ при успешном приеме события"""
    message: str = "Event accepted"
    event_id: str
    timestamp: str

class HealthResponse(BaseModel):
    """Ответ health check"""
    status: str
    timestamp: datetime
    kafka_connected: bool
    events_processed: int

class MetricsResponse(BaseModel):
    """Ответ с метриками"""
    events_total: int
    events_per_minute: float
    errors_total: int
    kafka_queue_size: int