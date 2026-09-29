# Календарь звонков

[![hexlet-check](https://github.com/frostiks777/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/frostiks777/ai-for-developers-project-386/actions)
[![CI](https://github.com/frostiks777/ai-for-developers-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/frostiks777/ai-for-developers-project-386/actions/workflows/ci.yml)

Сервис бронирования звонков (аналог Calendly): гость видит свободные слоты и оставляет заявку, организатор получает список броней.

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

Страницы:
- `/` — главная: рассказ о сервисе и переход к записи.
- `/book/:slug` — гость: календарь, слоты, форма бронирования (`slug` хоста или его UUID).
- `/my` — «Мои встречи»: брони, сделанные с этого устройства (перенос, отмена, удаление).
- `/booking/:uuid/confirmed` — shareable-экран подтверждения: детали встречи, экспорт в календарь, ссылки на перенос и отмену.
- `/booking/:uuid/cancel`, `/booking/:uuid/reschedule` (алиасы `/cancel/:token`, `/reschedule/:token`) — гость управляет своей встречей.
- `/dashboard` — организатор: обзор, брони, типы встреч, доступность, блокировки, организаторы (вход по паролю, см. [«Доступ организатора»](#доступ-организатора-пароль)).
- `/admin/{bookings,availability,event-types,blocks,hosts}` — deep-link на раздел панели.

Список броней и контакты гостей видны только организатору ([ADR-0022](docs/adr/0022-private-bookings-list.md)). Старый публичный маршрут `/events` отвечает редиректом на панель.

После брони доступен экспорт встречи в календарь (`.ics`, Google Календарь), перенос и ссылка для самостоятельной отмены.

Интерфейс поддерживает светлую и тёмную темы (переключатель в шапке, выбор сохраняется), формат времени 12/24 ч и выбор часового пояса отображения. На десктопе страница бронирования — вид «Дни» или «Неделя», на телефоне — мастер из трёх шагов.

## Демо

[![asciinema](https://asciinema.org/a/mpuvYnckvG7iKlH4.svg)](https://asciinema.org/a/mpuvYnckvG7iKlH4)

Запись каста (нужен [asciinema](https://asciinema.org)): сначала поднять сервер (`npm run start`), затем

```bash
asciinema rec demo.cast -c "bash scripts/demo.sh"
asciinema upload demo.cast
```

На Windows asciinema официально не поддерживается — используйте [PowerSession](https://github.com/Watfaq/PowerSession-rs) и Git Bash: `PowerSession rec -c "bash scripts/demo.sh" demo.cast`. Готовый каст лежит в [`docs/demo.cast`](docs/demo.cast) (проигрывание — `asciinema play docs/demo.cast` или `PowerSession play`).

`scripts/demo.sh` проигрывает сквозной путь гостя через API: health → настройки хоста → слоты → бронь → конфликт `409` → отмена → слот снова свободен.

Живое демо (Render, free-план — сервис засыпает после простоя): https://calendar-slots-app.onrender.com

## Стек

- **Frontend:** React 18, TypeScript, Vite 6, React Router 7, shadcn/ui, Tailwind CSS 3.4
- **Backend:** Node.js, Fastify 5, zod 4
- **БД:** PostgreSQL (Neon) + Drizzle ORM; в тестах и локальном dev без `DATABASE_URL` — PGlite
- **Тесты:** Vitest 4 + React Testing Library
- **Инструменты:** ESLint 9, Prettier, Docker

## Установка

Требуется Node.js 22 или 24 (LTS).

```bash
git clone https://github.com/frostiks777/ai-for-developers-project-386.git
cd ai-for-developers-project-386
npm ci
```

## Запуск

В разработке нужны два процесса (в двух терминалах):

```bash
npm run server:dev   # API на http://127.0.0.1:3000
npm run dev          # фронтенд на http://127.0.0.1:5173 (proxy /api → :3000)
```

Продакшн-режим — один процесс, Fastify раздаёт собранный фронтенд:

```bash
npm run build        # tsc --noEmit + vite build → dist/
npm run start        # http://127.0.0.1:3000 (API + статика из dist/)
```

## Переменные окружения

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `PORT` | `3000` | порт Fastify; в проде задаёт платформа |
| `DATABASE_URL` | — | строка подключения Postgres (Neon); пусто → PGlite (тесты/локальный dev) |
| `ADMIN_PASSWORD` | — | пароль для входа в `/dashboard` и `/admin/*`; если не задан — панель открыта |
| `TURNSTILE_SECRET_KEY` | — | секрет Cloudflare Turnstile. **Пока не задан — CAPTCHA выключена**: виджет не показывается, сервер не проверяет токен |
| `TURNSTILE_SITEKEY` | — | публичный site key, отдаётся гостю в `GET /api/v1/hosts/:slug/settings` |
| `TURNSTILE_ALLOWED_HOSTNAMES` | — | домены через запятую, которым разрешён site key; пусто — сверка отключена |
| `RATE_LIMIT_BOOKING_MAX` | `20` | лимит записей/отмен/переносов на IP за минуту |
| `RATE_LIMIT_READ_MAX` | `300` | лимит публичных чтений на IP за минуту |
| `RATE_LIMIT_GLOBAL_MAX` | `600` | общий предохранитель на IP за минуту |
| `EMAIL_API_KEY` | — | ключ Brevo HTTP API. **Пока не задан — письма не отправляются** (no-op) |
| `EMAIL_FROM` | — | отправитель, формат `Имя <email@example.com>`; email верифицируется в Brevo |
| `EMAIL_REPLY_TO` | — | Reply-To (почта организатора) |
| `ORGANIZER_EMAIL` | — | получатель писем организатору (новая бронь/отмена); пусто — не шлём |
| `REMINDER_LEAD_MINUTES` | `1440` | за сколько минут до встречи напоминать |
| `REMINDERS_SECRET` | — | секрет endpoint `/api/internal/reminders`; пусто — endpoint выключен |
| `APP_ORIGIN` | — | базовый origin для ссылок в письмах; пусто → `RENDER_EXTERNAL_URL` |

Пример — [`.env.example`](.env.example). При первом старте создаются слоты на 14 дней вперёд по правилам хоста: будни 10:00–18:00, слот 30 мин, буферы до/после встречи, бронь не позднее чем за 2 часа до начала ([ADR-0004](docs/adr/0004-slot-generation-rules.md)). Слоты генерируются в часовом поясе хоста ([ADR-0024](docs/adr/0024-slots-in-host-timezone.md)), в интерфейсе их можно переключить на любой IANA-пояс.

## Доступ организатора (пароль)

Панель организатора (`/dashboard` и `/admin/*`) закрыта HTTP Basic Auth. Пароль задаётся переменной `ADMIN_PASSWORD`; имя пользователя — любое. Тот же пароль требуется для изменяющих админ-запросов (настройки доступности, типы встреч, блокировки) и для списка броней (`GET /api/v1/hosts/:slug/bookings`); публичные чтения для гостей (слоты, типы, доступность) открыты, создание брони — тоже публичное.

- **Демо-стенд:** `https://calendar-slots-app.onrender.com/dashboard` — пользователь `admin`, пароль **`call-calendar-admin`**.
- **Локально:** задайте `ADMIN_PASSWORD` в `.env` (см. [`.env.example`](.env.example)) — браузер спросит логин и пароль. Если переменная не задана, панель открыта (удобно для разработки и тестов).
- **Смена пароля на Render:** Environment → `ADMIN_PASSWORD` → новое значение → сохранить (сервис перезапустится).

## Защита формы записи (CAPTCHA и лимиты)

Публичный эндпоинт записи закрыт двумя независимыми слоями ([ADR-0025](docs/adr/0025-captcha-and-rate-limit.md)).

**CAPTCHA — Cloudflare Turnstile, бесплатный план.** Виджет подтверждает, что запись сделал человек;
сервер проверяет одноразовый токен через Siteverify API и **не пропускает бронь, если Cloudflare
недоступен** (fail-closed).

- **Единый переключатель:** CAPTCHA выключена, пока не задан `TURNSTILE_SECRET_KEY`. Без него виджет
  не рендерится и токен не проверяется — поэтому локальный dev, `npm test` и e2e в CI не зависят от
  внешнего сервиса. В production без секрета приложение пишет предупреждение в лог.
- **Локально** можно посмотреть живой виджет с официальными тестовыми ключами Cloudflare
  (в `.env`): `TURNSTILE_SITEKEY=1x00000000000000000000AA`,
  `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`.
- **В Render:** Environment → `TURNSTILE_SITEKEY`, `TURNSTILE_SECRET_KEY`,
  `TURNSTILE_ALLOWED_HOSTNAMES=calendar-slots-app.onrender.com` → Save & Deploy. Настройка виджета —
  [dash.cloudflare.com → Turnstile](https://dash.cloudflare.com) → Create a widget: режим **Managed**,
  вид **Visible**, Pre-clearance **Off**; на бесплатном плане нужно добавить хост
  `calendar-slots-app.onrender.com` (иначе Cloudflare вернёт ошибку 400020).

**Rate-limit по IP** (`@fastify/rate-limit`, счётчики в памяти процесса): 20 записей/отмен/переносов в
минуту, 300 публичных чтений, 600 запросов суммарно. При превышении — `429` с кодом `RATE_LIMITED`.
Значения настраиваются переменными `RATE_LIMIT_*`.

Ключ лимита — реальный IP гостя: заголовок `CF-Connecting-IP`, который перезаписывает Cloudflare, с
откатом на `request.ip`. Поэтому `trustProxy: true` в `server/app.ts` обязателен — без него адрес
прокси станет ключом для всех сразу и лимит превратится в глобальный.

## Уведомления по email

Письма гостю (подтверждение, перенос, отмена, напоминание за 24 часа) и организатору (новая бронь,
отмена) отправляются через **Brevo HTTP API** ([ADR-0026](docs/adr/0026-email-notifications.md)); на
бесплатном плане — 300 писем/день, без карты. SMTP не используется: Render Free блокирует порты
25/465/587, а Brevo требует верифицировать хотя бы один sender-email (свой домен не обязателен) —
выбор и сравнение провайдеров в [`docs/research/email-notifications.md`](docs/research/email-notifications.md).

- **Единый переключатель:** пока не задан `EMAIL_API_KEY`, отправка — no-op; локальный dev, `npm test`
  и e2e в CI не ходят в сеть. В production без ключа приложение пишет предупреждение в лог.
- **В Render:** Environment → `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `ORGANIZER_EMAIL` →
  Save & Deploy. Ключ берётся в Brevo: SMTP & API → API Keys; sender верифицируется в Senders.
  Подробная пошаговая инструкция (Brevo → Render → cron-job.org) — [`docs/email-setup-brevo.md`](docs/email-setup-brevo.md).
- **Напоминания** не планируются in-process (сервис спит через 15 минут): ленивая проверка due-писем
  при старте и входящих запросах (`reminderSentAt` защищает от дублей). Для точности подключите
  бесплатный внешний cron (например, [cron-job.org](https://cron-job.org)): `POST
  {APP_ORIGIN}/api/internal/reminders` каждые 15 минут с заголовком `X-Reminders-Secret:
  <REMINDERS_SECRET>`. Пока `REMINDERS_SECRET` не задан, endpoint отвечает `404`.
- **Антиспам:** отправка только транзакционных писем opted-in получателям, `Reply-To` организатора,
  rate-limit/backoff; для лучшей доставляемости стоит добавить домен и SPF/DKIM/DMARC.

## API

Контракт задан в `api/main.tsp` (TypeSpec) и сгенерирован в `docs/openapi/openapi.yaml`; ниже — фактические маршруты `server/app.ts`. Столбец **auth** — `admin` означает HTTP Basic Auth (см. [«Доступ организатора»](#доступ-организатора-пароль)).

Публичные (гостевые):

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/health` | проверка живости |
| `GET` | `/api/v1/hosts` | список организаторов (публичное чтение) |
| `GET` | `/api/v1/hosts/:slug/settings` | настройки хоста (`slug`, `name`, `timeZone`; `404` — неизвестный хост) |
| `GET` | `/api/v1/hosts/:slug/slots` | слоты хоста; `?date=YYYY-MM-DD`, `?eventTypeId=` |
| `GET` | `/api/v1/hosts/:slug/event-types` | типы встреч |
| `GET` | `/api/v1/hosts/:slug/availability` | правила доступности |
| `POST` | `/api/v1/hosts/:slug/bookings` | создать бронь (`Idempotency-Key` поддерживается) |
| `GET` | `/api/v1/bookings/:bookingId` | бронь по id (страница управления встречей) |
| `POST` | `/api/v1/bookings/:bookingId/cancel` | отмена: `{ reason? }` |
| `POST` | `/api/v1/bookings/:bookingId/reschedule` | перенос: `{ startAt }` |

Административные (`ADMIN_PASSWORD`):

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/api/v1/hosts` | создать организатора (`409` — занятый slug) |
| `PUT` | `/api/v1/hosts/:slug/availability` | обновить правила (пересобирает свободные будущие слоты) |
| `POST`/`DELETE` | `/api/v1/hosts/:slug/event-types[/:eventTypeId]` | создать / удалить тип встречи |
| `GET` | `/api/v1/hosts/:slug/bookings` | брони со контактами гостей ([ADR-0022](docs/adr/0022-private-bookings-list.md)) |
| `GET`/`POST`/`DELETE` | `/api/v1/hosts/:slug/blocks[/:blockId]` | блокировки времени |
| `GET` | `/api/availability`, `GET` `/api/bookings` | легаси-чтение для панели (дефолтный хост) |
| `POST` | `/api/bookings` | легаси-создание брони (`slotId`, `name`, `email`, `phone?`, `comment?` до 500 символов) |
| `DELETE` | `/api/bookings/:id` | легаси-отмена брони |
| `POST` | `/api/bookings/cancel`, `POST /api/bookings/reschedule`, `GET /api/bookings/by-token/:token` | управление по capability-токену (открыты) |
| `PUT` | `/api/availability` | легаси-обновление правил |
| `POST` | `/api/internal/reminders` | служебный запуск due-напоминаний; закрыт `X-Reminders-Secret` (`404`, если `REMINDERS_SECRET` не задан) |

Примеры:

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok"}

curl http://127.0.0.1:3000/api/v1/hosts/default/slots
# {"slots":[{"id":1,"startAt":"2026-09-24T07:00:00.000Z","durationMin":30,"isBooked":false}]}

curl -X POST http://127.0.0.1:3000/api/v1/hosts/default/bookings \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-1' \
  -d '{"eventTypeId":"default-consultation","startAt":"2026-09-24T07:00:00.000Z","clientName":"Иван","clientEmail":"ivan@example.com","consentAccepted":true}'
# 201 {"id":"<uuid>","status":"confirmed",...}   (id = токен для ссылок переноса/отмены)

curl -X POST http://127.0.0.1:3000/api/v1/hosts/default/bookings \
  -H 'Content-Type: application/json' \
  -d '{"eventTypeId":"default-consultation","startAt":"2026-09-24T07:00:00.000Z","clientName":"Иван","clientEmail":"not-an-email","consentAccepted":true}'
# 422 {"error":{"code":"VALIDATION_ERROR","message":"Неверный email"}}
```

Ошибки:
- **v1** (`/api/v1/*`) — конверт `{ "error": { "code", "message" } }`, коды: `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `SLOT_TAKEN` (409), `CONFLICT` (409), `UNAUTHORIZED` (401), плюс `400` на бизнес-ошибки (прошедший слот, окно `minNotice`).
- **легаси `/api/*`** — плоский `{ "error": "текст" }`; `422` на невалидное тело (кроме `POST /api/bookings/reschedule` — там `400`), `400` на бизнес-ошибку, `404`, `409` — слот занят (перехват `23505`, уникальный индекс по `slotId`).

## Скрипты

| Команда | Действие |
|---|---|
| `npm run dev` | Vite dev-сервер (:5173) |
| `npm run server:dev` | Fastify с автоперезапуском (:3000) |
| `npm run dev:all` | оба процесса сразу (`scripts/dev-all.mjs`) |
| `npm run build` | typecheck + продакшн-сборка |
| `npm run start` | запуск продакшн-сервера |
| `npm test` | юнит + интеграционные + контрактные тесты (Vitest) |
| `npm run test:e2e` | сквозные тесты в браузере (Playwright; отдельный гейт, входит в CI job `e2e`) |
| `npm run lint` / `npm run typecheck` | линтер / проверка типов |
| `npm run api:generate` | генерация OpenAPI + клиентского SDK + серверных типов из `api/main.tsp` |
| `npm run db:generate` / `npm run db:push` | drizzle-kit (справочно; реальные миграции идемпотентные и выполняются при старте сервера) |

## API-контракт (TypeSpec)

Источник контракта — `api/main.tsp`. Одна команда генерирует артефакты:

```bash
npm run api:generate   # tsp compile api/main.tsp → docs/openapi/openapi.yaml + src/api/generated/ + server/generated/
```

- `docs/openapi/openapi.yaml` — OpenAPI 3 (спека).
- `src/api/generated/` — клиентский SDK (TypeScript), инстанс — `src/api/sdk.ts`.
- `server/generated/api-types.ts` — серверные типы (через `openapi-typescript`).
- Сгенерированные файлы коммитятся и **вручную не правятся**: изменения вносим только в `api/main.tsp` и перегенерируем.


## Структура

```
src/       фронтенд: pages, components (в т.ч. ui/), hooks, utils, api (SDK + mappers), lib (zod)
server/    Fastify: app.ts (фабрика и роуты), bookings-v1.ts, hosts.ts, event-types.ts, time-blocks.ts, email.ts + email-templates.ts + notifications.ts + reminders.ts, db/ (Drizzle pg-core + миграции)
api/       TypeSpec-контракт API v1
e2e/       сценарии Playwright
docs/      архитектура, конвенции, ADR, спека, дизайн-пакеты, план
```

## Тесты

```bash
npm test          # Vitest: юнит + интеграционные + контрактные
npm run test:e2e  # Playwright: сквозной сценарий в браузере (отдельный гейт, job в CI)
```

- фронтенд — React Testing Library (jsdom);
- API — интеграционные тесты через `app.inject()` на PGlite в памяти (`DATABASE_URL` пустой);
- контрактные (`server/contract.test.ts`) — маршруты `/api/v1/*` из `docs/openapi/openapi.yaml` зарегистрированы, а ключевые ответы (настройки, слоты, бронь) валидны по OpenAPI через ajv;
- e2e (`e2e/`) — Playwright гоняется против **собранного** приложения (`npm run build && npm start`, `PORT=3100`, PGlite) и проверяет сквозной сценарий гостя и конфликт слотов.

Перед первым запуском e2e установите браузер:

```bash
npx playwright install chromium
npm run test:e2e
```

`npm run test:e2e` не входит в `npm test`, но выполняется в CI отдельным job `e2e`.

## Деплой

Docker-образ (multi-stage) + `render.yaml` для Render.com: план free, healthcheck `/health`, хост `0.0.0.0`, порт из `PORT`. Данные — PostgreSQL в Neon (`DATABASE_URL` из Environment Group `DB`), доступ к панели — `ADMIN_PASSWORD`. Подробности — [`docs/ci_cd_render.md`](docs/ci_cd_render.md).

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.