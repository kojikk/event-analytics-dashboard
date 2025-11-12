from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
from datetime import datetime
from typing import Dict, Any
import uvicorn
import os

from schemas import EventPayload, EventResponse, HealthResponse, MetricsResponse
from kafka_client import kafka_producer

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Метрики в памяти (в продакшене лучше использовать Redis или Prometheus)
metrics = {
    "events_total": 0,
    "events_per_minute": 0.0,
    "errors_total": 0,
    "last_minute_events": [],
    "start_time": time.time()
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle событий приложения"""
    # Startup
    logger.info("Starting Collector Service...")
    
    # Инициализация Kafka producer
    success = await kafka_producer.initialize()
    if not success:
        logger.error("Failed to initialize Kafka producer. Service may not work properly.")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Collector Service...")
    await kafka_producer.close()

# Создание FastAPI приложения
app = FastAPI(
    title="Event Collector Service",
    description="Сервис для сбора событий аналитики и отправки в Kafka",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def update_metrics(success: bool = True):
    """Обновление метрик"""
    current_time = time.time()
    
    if success:
        metrics["events_total"] += 1
        metrics["last_minute_events"].append(current_time)
    else:
        metrics["errors_total"] += 1
    
    # Очищаем события старше минуты
    minute_ago = current_time - 60
    metrics["last_minute_events"] = [
        t for t in metrics["last_minute_events"] if t > minute_ago
    ]
    
    # Вычисляем события в минуту
    metrics["events_per_minute"] = len(metrics["last_minute_events"])

@app.post("/events", response_model=EventResponse, status_code=202)
async def collect_event(
    event: EventPayload,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Принимает событие от фронтенда и отправляет в Kafka
    """
    try:
        # Добавляем метаданные к событию
        enriched_event = {
            **event.dict(),
            "client_ip": request.client.host,
            "received_at": datetime.utcnow().isoformat(),
            "service": "collector"
        }
        
        # Отправляем событие в Kafka
        event_id = await kafka_producer.send_event(enriched_event)
        
        # Обновляем метрики
        update_metrics(success=True)
        
        logger.info(f"Event collected: {event.event_type} from user {event.user_id}")
        
        return EventResponse(
            event_id=event_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to process event: {e}")
        update_metrics(success=False)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process event: {str(e)}"
        )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    """
    try:
        kafka_connected = await kafka_producer.health_check()
        
        return HealthResponse(
            status="healthy" if kafka_connected else "degraded",
            timestamp=datetime.utcnow(),
            kafka_connected=kafka_connected,
            events_processed=metrics["events_total"]
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service unavailable"
        )

@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """
    Метрики сервиса
    """
    try:
        kafka_metrics = await kafka_producer.get_metrics()
        
        return MetricsResponse(
            events_total=metrics["events_total"],
            events_per_minute=metrics["events_per_minute"],
            errors_total=metrics["errors_total"],
            kafka_queue_size=kafka_metrics.get("events_sent", 0)
        )
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get metrics"
        )

@app.get("/")
async def root():
    """
    Корневой endpoint
    """
    uptime = time.time() - metrics["start_time"]
    return {
        "service": "Event Collector",
        "version": "1.0.0",
        "status": "running",
        "uptime_seconds": int(uptime)
    }

if __name__ == "__main__":
    port = int(os.getenv("COLLECTOR_PORT", "8002"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )