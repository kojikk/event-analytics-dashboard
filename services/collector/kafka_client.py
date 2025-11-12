import json
import logging
from typing import Dict, Any
from kafka import KafkaProducer
from kafka.errors import KafkaError
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os
import uuid

logger = logging.getLogger(__name__)

class KafkaEventProducer:
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.topic = os.getenv("KAFKA_EVENTS_TOPIC", "events")
        self.producer = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._events_sent = 0
        self._errors = 0
        
    async def initialize(self):
        """Инициализация Kafka Producer"""
        try:
            loop = asyncio.get_event_loop()
            self.producer = await loop.run_in_executor(
                self.executor, 
                self._create_producer
            )
            logger.info(f"Kafka producer initialized for servers: {self.bootstrap_servers}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Kafka producer: {e}")
            return False
    
    def _create_producer(self) -> KafkaProducer:
        """Создание синхронного producer в отдельном потоке"""
        return KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda v: v.encode('utf-8') if v else None,
            acks='all',  # Ждать подтверждения от всех реплик
            retries=3,
            batch_size=16384,
            linger_ms=10,  # Ждать 10ms для батчинга
            compression_type='gzip'
        )
    
    async def send_event(self, event_data: Dict[str, Any]) -> str:
        """Отправка события в Kafka"""
        if not self.producer:
            raise RuntimeError("Kafka producer not initialized")
        
        event_id = str(uuid.uuid4())
        event_with_id = {
            "event_id": event_id,
            **event_data
        }
        
        try:
            loop = asyncio.get_event_loop()
            future = await loop.run_in_executor(
                self.executor,
                self._send_sync,
                event_with_id,
                event_id
            )
            
            self._events_sent += 1
            logger.debug(f"Event {event_id} sent to Kafka topic '{self.topic}'")
            return event_id
            
        except Exception as e:
            self._errors += 1
            logger.error(f"Failed to send event {event_id} to Kafka: {e}")
            raise
    
    def _send_sync(self, event_data: Dict[str, Any], event_id: str):
        """Синхронная отправка в Kafka"""
        future = self.producer.send(
            self.topic,
            key=event_id,
            value=event_data
        )
        # Ждем подтверждения отправки
        record_metadata = future.get(timeout=10)
        return record_metadata
    
    async def health_check(self) -> bool:
        """Проверка подключения к Kafka"""
        if not self.producer:
            return False
        
        try:
            loop = asyncio.get_event_loop()
            metadata = await loop.run_in_executor(
                self.executor,
                lambda: self.producer.partitions_for(self.topic)
            )
            return metadata is not None
        except Exception as e:
            logger.error(f"Kafka health check failed: {e}")
            return False
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Получение метрик producer"""
        return {
            "events_sent": self._events_sent,
            "errors": self._errors,
            "topic": self.topic,
            "bootstrap_servers": self.bootstrap_servers
        }
    
    async def close(self):
        """Закрытие producer"""
        if self.producer:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor,
                self.producer.close
            )
            logger.info("Kafka producer closed")
        
        self.executor.shutdown(wait=True)

# Глобальный экземпляр producer
kafka_producer = KafkaEventProducer()