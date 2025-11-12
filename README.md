# Event Analytics Dashboard

Микросервисное приложение для сбора, хранения и визуализации пользовательских событий.

## Архитектура

- **Frontend** (React + Vite): Dashboard с кликабельными элементами + Admin Panel для аналитики
- **API Gateway** (FastAPI): Центральная точка входа, JWT-авторизация, роутинг
- **Auth Service** (FastAPI + PostgreSQL): Регистрация, логин, управление пользователями
- **Collector Service** (FastAPI + Kafka): Прием событий от фронтенда
- **Writer Service** (Python + Kafka + ClickHouse): Потребитель очереди, запись в БД
- **Analytics Service** (FastAPI + ClickHouse): Агрегация данных для админки

## Быстрый старт

### Локальная разработка

```bash
# Запуск всех сервисов (Frontend + API Gateway + Auth + PostgreSQL)
docker compose -f infra/docker/docker-compose.dev.yml up --build

# Доступные сервисы:
# 🎨 Frontend: http://localhost:3000
# 🔌 API Gateway: http://localhost:8000  
# 🔐 Auth Service: http://localhost:8001
# 🐘 PostgreSQL: localhost:5433
```

### 🚀 Быстрый тест

1. Откройте http://localhost:3000
2. Потыкайте элементы на Dashboard (события отправляются в API)
3. Нажмите **Admin Panel** → войдите как `admin` / `admin`
4. Увидите username и email в правом верхнем углу
5. Попробуйте неверные данные - должна быть ошибка 401

### Полная версия со всеми сервисами

```bash
# TODO: будет добавлено в следующих фазах
docker compose -f infra/docker/docker-compose.full.yml up --build
```

## Структура проекта

```
├── frontend/                 # React приложение
├── services/
│   ├── api-gateway/         # FastAPI роутер
│   ├── auth/                # Сервис авторизации
│   ├── collector/           # Прием событий
│   ├── writer/              # Запись в ClickHouse
│   └── analytics/           # Агрегация данных
├── infra/
│   ├── docker/              # Docker Compose файлы
│   └── k8s/                 # Kubernetes манифесты
└── .github/workflows/       # CI/CD пайплайны
```

## 🎯 Статус разработки

### ✅ Завершено (Фазы 1-2)
- 🎨 **Красивый тёмный Frontend** с glassmorphism дизайном
- 🔐 **Полная система авторизации** с JWT + PostgreSQL
- 👤 **Отображение пользователя** в navbar (username + email)
- 🚀 **API Gateway** с CORS, rate limiting, проксированием
- 📊 **Интерактивный Dashboard** с кликабельными элементами
- 📈 **Admin Panel** с графиками (пока заглушки)
- 🐳 **Docker контейнеризация** для разработки
- 🛡️ **Безопасность** - правильная валидация токенов

### 🔄 В разработке (Фаза 3)
- ⏳ Collector Service + Kafka/Redpanda
- ⏳ Writer Service + ClickHouse
- ⏳ Analytics Service

### 📋 Планируется
- ⏳ Kubernetes деплой
- ⏳ CI/CD автоматизация  
- ⏳ Observability (метрики, логи)

Подробный план в [PLAN.md](./PLAN.md)

## Переменные окружения

Создайте `.env` файл в корне проекта:

```bash
# API Gateway
API_GATEWAY_PORT=8000
JWT_SECRET_KEY=your-secret-key-here

# Frontend
VITE_API_URL=http://localhost:8000

# Auth Service
POSTGRES_HOST=postgres
POSTGRES_DB=analytics_auth
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password

# ClickHouse (когда будет добавлен)  
CLICKHOUSE_HOST=localhost
CLICKHOUSE_DB=analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```