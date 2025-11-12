# Event Analytics Dashboard — план поэтапной реализации

Наша стратегия: сначала поднимаем минимальный «скелет» (Frontend + API Gateway), затем по очереди подключаем Auth, Collector, Kafka/Redpanda, Writer, ClickHouse, Analytics и прочее. Это упрощает отладку и ускоряет первые результаты.

## Фаза 0 — Инициализация
- [ ] Создать репозиторий и базовую структуру каталогов:
  - `frontend/`
  - `services/api-gateway/`
  - `services/auth/`
  - `services/collector/`
  - `services/writer/`
  - `services/analytics/`
  - `infra/docker/` (docker-compose.* для локалки)
  - `infra/k8s/` (манифесты Kubernetes)
  - `.github/workflows/` (CI/CD)
- [ ] Добавить `.editorconfig`, `.gitignore`, `README.md`
- [ ] Подготовить `docker-compose.dev.yml` (пока только frontend + api-gateway)

## Фаза 1 — Frontend + API Gateway (минимально работоспособно)
- [ ] Frontend (React + Vite):
  - Страницы: Login, Dashboard (пока заглушка).
  - Конфиг API-URL через env.
- [ ] API Gateway (FastAPI):
  - CORS, базовый логгинг, `/healthz`.
  - Заглушки маршрутов `/auth/*`, `/analytics/*` (пока без БД).
  - JWT-миддлварь (пока допускаем «тестовый» токен для разработки).
- [ ] Локальный запуск: `docker compose -f infra/docker/docker-compose.dev.yml up --build`

## Фаза 2 — Auth Service + PostgreSQL
- [ ] Auth (FastAPI + PostgreSQL): эндпоинты `/register`, `/login`, `/verify`.
- [ ] Хеширование паролей (bcrypt), JWT (access/refresh по необходимости).
- [ ] API Gateway: проксирование `/auth/*`, проверка JWT для защищённых роутов.
- [ ] Migrations (Alembic), `docker-compose.dev.yml`: добавить PostgreSQL.

## Фаза 3 — Collector + Kafka (Redpanda)
- [ ] Collector (FastAPI): `POST /events` → в топик `events` (Kafka/Redpanda), ответ `202 Accepted`.
- [ ] Валидация события (тип, userId, timestamp, payload).
- [ ] Добавить Redpanda (или Kafka) в docker-compose с удобной панелью/CLI.

## Фаза 4 — Writer + ClickHouse
- [ ] Writer (consumer): чтение батчами из `events`, запись в ClickHouse, ретраи, логгинг.
- [ ] Метрики Prometheus: `processed_total`, `batch_latency_ms`, `retries_total`.
- [ ] ClickHouse в docker-compose, создать таблицы `events` (MergeTree), партиции/индексы.

## Фаза 5 — Analytics Service
- [ ] Эндпоинты к ClickHouse:
  - `/analytics/events/count`
  - `/analytics/events/by-type`
  - `/analytics/events/by-user`
  - `/analytics/events/timeseries`
- [ ] Оптимизации: материализованные представления (опционально).

## Фаза 6 — Frontend Dashboard (графики)
- [ ] JWT-логин, хранение токена, logout.
- [ ] Графики (Recharts/Chart.js):
  - Timeseries по событиям
  - Разбивка по типам (pie/bar)
  - Топ пользователей
- [ ] Все запросы через API Gateway.

## Фаза 7 — Observability и защитные механизмы
- [ ] Структурированное логирование (JSON) во всех сервисах.
- [ ] Rate limiting в API Gateway (например, slowapi).
- [ ] Прометеевские метрики и (опционально) Grafana в docker-compose.

## Фаза 8 — Kubernetes (namespace: `analytics`)
- [ ] Deployments для frontend, api-gateway, auth, collector, writer, analytics.
- [ ] StatefulSet + PVC для PostgreSQL и ClickHouse.
- [ ] Kafka/Redpanda через Helm chart.
- [ ] ConfigMap/Secret для конфигов и ключей.
- [ ] Ingress (NGINX/Traefik) для внешнего доступа.

## Фаза 9 — CI/CD (GitHub Actions)
- [ ] Сборка и push Docker-образов в реестр.
- [ ] Линт/тесты (где уместно) на PR.
- [ ] Автодеплой в кластер (kubectl/Helm) по тэгу релиза.

## Фаза 10 — Hardening
- [ ] Обновление JWT (refresh), настройка сроков и ротаций ключей.
- [ ] CORS/Headers, TLS через Ingress, базовые бэкапы БД.

---

### Быстрый старт локально (первые шаги)
1) Реализовать Фазу 1 (frontend + api-gateway) и собрать образы.
2) Запустить: `docker compose -f infra/docker/docker-compose.dev.yml up --build`.
3) Проверить `/healthz` у gateway и отрисовку фронта.
4) Дальше двигаться по фазам 2 → 10.
