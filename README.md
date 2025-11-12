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
# Запуск минимальной версии (Frontend + API Gateway)
docker compose -f infra/docker/docker-compose.dev.yml up --build

# Фронтенд доступен на http://localhost:3000
# API Gateway на http://localhost:8000
```

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

## Фазы разработки

Проект реализуется поэтапно согласно [PLAN.md](./PLAN.md):
1. ✅ Инициализация проекта
2. 🔄 Frontend + API Gateway (базовый функционал)
3. ⏳ Auth Service + PostgreSQL
4. ⏳ Collector + Kafka/Redpanda
5. ⏳ Writer + ClickHouse
6. ⏳ Analytics Service
7. ⏳ Полноценный Dashboard с графиками
8. ⏳ Observability (логи, метрики)
9. ⏳ Kubernetes деплой
10. ⏳ CI/CD автоматизация

## Переменные окружения

Создайте `.env` файл в корне проекта:

```bash
# API Gateway
API_GATEWAY_PORT=8000
JWT_SECRET_KEY=your-secret-key-here

# Frontend
VITE_API_URL=http://localhost:8000

# Auth Service (когда будет добавлен)
POSTGRES_HOST=localhost
POSTGRES_DB=analytics_auth
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# ClickHouse (когда будет добавлен)  
CLICKHOUSE_HOST=localhost
CLICKHOUSE_DB=analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```