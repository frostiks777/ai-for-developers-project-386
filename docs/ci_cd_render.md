# Деплой: Render.com + Neon

Актуальная схема деплоя «Календарь звонков»: контейнер на **Render** (план free) + база в **Neon** (PostgreSQL). План Google Cloud Run из `docs/ci_cd.md` **не используется** — он остался как альтернатива.

Конфигурация в репозитории: `render.yaml` (Blueprint), `Dockerfile` (multi-stage). Живой стенд: <https://calendar-slots-app.onrender.com>.

## 1. Архитектура деплоя

| Слой | Где | Notes |
|---|---|---|
| Фронтенд + API | Render Web Service (Docker, `main`, `frankfurt`, plan `free`) | Fastify раздаёт `dist/` и слушает `/api/*` — один origin, CORS не нужен |
| БД | Neon (PostgreSQL) | строки подключения в `DATABASE_URL` |
| Доступ к панели | `ADMIN_PASSWORD` → HTTP Basic Auth на `/dashboard`, `/admin/*` и админских мутациях ([ADR-0017](adr/0017-dashboard-basic-auth.md)) | без переменной гейт выключен |

Данные **не** хранятся в контейнере: файловая система Render free эфемерна, поэтому БД обязана быть внешней. Без `DATABASE_URL` сервер поднимает PGlite в памяти — это годится для локального dev, но на Render приведёт к потере всех данных при каждом рестарте.

## 2. Переменные окружения

| Переменная | Значение в проде | Комментарий |
|---|---|---|
| `DATABASE_URL` | `postgresql://…?sslmode=require` | на Render приходит из **Environment Group `DB`** (см. `render.yaml`). Значение `sslmode` менять не нужно — нормализуется в `verify-full` на старте сервера |
| `PORT` | `10000` | Render задаёт порт; сервер читает `process.env.PORT` |
| `ADMIN_PASSWORD` | пароль организатора | в Blueprint задано демо-значение `call-calendar-admin` — **смените** |
| `NODE_ENV` | `production` | отключает тестовый логгер Fastify |

## 3. Создание сервиса вручную (если Blueprint не подошёл)

1. <https://dashboard.render.com> → **Sign in with GitHub**.
2. **New +** → **Web Service** → подключить репозиторий.
3. Параметры: `Name: calendar-slots-app`, `Region: Frankfurt (EU Central)`, `Branch: main`, `Root Directory: пусто`, `Runtime: Docker`, `Instance Type: Free`.
4. **Environment Variables**: `NODE_ENV=production`, `PORT=10000`, `ADMIN_PASSWORD=<свой пароль>`, `DATABASE_URL=<строка Neon>`.
5. **Create Web Service** — Render соберёт образ из `Dockerfile` и начнёт деплой по каждому пушу в `main` (`autoDeploy: true`).
6. Healthcheck — `GET /health` (в Blueprint: `healthCheckPath: /health`).

Через Blueprint (`render.yaml`) всё то же создаётся одной кнопкой в разделе **Blueprints** — файл уже содержит `fromGroup: DB`, `PORT`, `NODE_ENV` и демо-пароль.

## 4. База данных Neon

1. <https://console.neon.tech> → новый проект, регион рядом с Render ( frankfurt/berlin ).
2. Скопировать **pooled connection string** → это и есть `DATABASE_URL`. Значение `sslmode` править **не нужно**: сервер приводит его к `verify-full` сам (`server/env.ts`, `normalizeSslMode`), потому что и Neon, и Render формируют ссылку сами и по умолчанию кладут `sslmode=require`, на который `pg-connection-string` ругается предупреждением. Подробности — в [ADR-0013](adr/0013-postgres-migration.md) и бэклоге `docs/todo.md`.
3. На Render: **Environment Groups** → создать группу (например `DB`) и добавить в неё `DATABASE_URL`; в `render.yaml` он подхватывается через `fromGroup: DB`.
4. Схему создавать вручную не нужно: при старте сервера выполняются идемпотентные миграции `server/db/migrate.ts`, а при старте с пустой БД сидируются дефолтный хост, тип встречи и слоты по правилам доступности.

Проверка соединения: `curl https://<host>/health` → `{"status":"ok"}`. SSL-предупреждение `pg` в логах быть не должно — режим приводится к `verify-full` в `server/env.ts` (ADR-0013).

## 5. Обновление и откат

- **Деплой новой версии:** пуш в `main` → автосборка (сборка занимает несколько минут, free-план может «заснуть»).
- **Откат:** Render → *Deploys* → выбрать предыдущий успешный деплой → *Rollback*.
- **Логи:** Render → *Logs* (live/по времени). Полезные маркеры: `Server listening at http://0.0.0.0:10000`, отсутствие ошибок миграций.
- **Проверка после деплоя:** `/health`, `/` (SPA), `/book/default`, `/dashboard` (запросит пароль).

## 6. Ограничения free-плана

- Засыпание после ~15 минут простоя; первый запрос после сна — медленный (холодный старт).
- Сборка идёт на `free`-инстансе: лимит 512 МБ RAM. Образ multi-stage, native-зависимостей с компиляцией больше нет (`pg` — чистый JS), поэтому сборка лёгкая.
- Один инстанс: горизонтальное масштабирование невозможно, состояние держится в БД.
- Секреты (`DATABASE_URL`, `ADMIN_PASSWORD`) живут только в переменных Render, в репозитории их нет (`.env` в `.gitignore`, `.env.example` — без значений).
