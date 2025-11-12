#!/usr/bin/env python3
"""
Простой скрипт для тестирования Collector Service
"""

import asyncio
import json
import httpx
from datetime import datetime

COLLECTOR_URL = "http://localhost:8002"

async def test_health_check():
    """Тест health check endpoint"""
    print("🔍 Testing health check...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{COLLECTOR_URL}/health")
            print(f"Health check status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Service status: {data.get('status')}")
                print(f"Kafka connected: {data.get('kafka_connected')}")
            else:
                print(f"Health check failed: {response.text}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

async def test_event_collection():
    """Тест отправки события"""
    print("\n📊 Testing event collection...")
    
    test_event = {
        "event_type": "test_event",
        "user_id": "test_user_123",
        "session_id": "test_session_456",
        "timestamp": datetime.utcnow().isoformat(),
        "url": "http://localhost:3000/test",
        "user_agent": "TestAgent/1.0",
        "screen_resolution": "1920x1080",
        "additional_data": {
            "test_field": "test_value",
            "number_field": 42
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COLLECTOR_URL}/events",
                json=test_event,
                headers={"Content-Type": "application/json"}
            )
            print(f"Event submission status: {response.status_code}")
            if response.status_code == 202:
                data = response.json()
                print(f"Event ID: {data.get('event_id')}")
                print(f"Message: {data.get('message')}")
            else:
                print(f"Event submission failed: {response.text}")
    except Exception as e:
        print(f"❌ Event submission error: {e}")

async def test_metrics():
    """Тест метрик сервиса"""
    print("\n📈 Testing metrics...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{COLLECTOR_URL}/metrics")
            print(f"Metrics status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Total events: {data.get('events_total')}")
                print(f"Events per minute: {data.get('events_per_minute')}")
                print(f"Errors: {data.get('errors_total')}")
            else:
                print(f"Metrics failed: {response.text}")
    except Exception as e:
        print(f"❌ Metrics error: {e}")

async def test_root_endpoint():
    """Тест корневого endpoint"""
    print("\n🏠 Testing root endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{COLLECTOR_URL}/")
            print(f"Root endpoint status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Service: {data.get('service')}")
                print(f"Version: {data.get('version')}")
                print(f"Status: {data.get('status')}")
                print(f"Uptime: {data.get('uptime_seconds')}s")
            else:
                print(f"Root endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")

async def main():
    """Запуск всех тестов"""
    print("🚀 Starting Collector Service tests...")
    print(f"Testing service at: {COLLECTOR_URL}")
    
    await test_root_endpoint()
    await test_health_check() 
    await test_event_collection()
    await test_metrics()
    
    print("\n✅ Tests completed!")

if __name__ == "__main__":
    asyncio.run(main())