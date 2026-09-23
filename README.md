# Календарь звонков

[![hexlet-check](https://github.com/frostiks777/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/frostiks777/ai-for-developers-project-386/actions)
[![CI](https://github.com/frostiks777/ai-for-developers-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/frostiks777/ai-for-developers-project-386/actions/workflows/ci.yml)

Сервис бронирования звонков (аналог Calendly): гость видит свободные слоты и оставляет заявку, организатор получает список броней.

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

Страницы:
- `/` — гость: календарь, слоты, форма бронирования.
- `/dashboard` — организатор: список броней с отменой и настройки доступности.
- `/cancel/:token` — гость отменяет свою бронь по ссылке с экрана успеха.

После брони доступен экспорт встречи в календарь (`.ics`, Google Календарь) и ссылка для самостоятельной отмены.

## Демо

<!-- TODO: записать asciinema и заменить ссылку: asciinema rec demo.cast -->
[![asciinema](https://asciinema.org/a/placeholder.svg)](https://asciinema.org/a/placeholder)

Живое демо (Render, free-план — сервис засыпает после простоя): https://calendar-slots-app.onrender.com

## Стек

- **Frontend:** React 18, TypeScript, Vite 6, React Router 7, shadcn/ui, Tailwind CSS 3.4
- **Backend:** Node.js, Fastify 5, zod 4
- **БД:** SQLite (better-sqlite3) + Drizzle ORM
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
| `DATABASE_PATH` | `server/data/app.db` | путь к SQLite; `:memory:` — БД в памяти (тесты) |

Пример — [`.env.example`](.env.example). При первом старте создаются слоты на 14 дней вперёд по правилам: будни 10:00–18:00 UTC, слот 30 мин, буфер 10 мин, бронь не позднее чем за 2 часа до начала (см. [ADR-0004](docs/adr/0004-slot-generation-rules.md)). В интерфейсе можно переключить часовой пояс отображения — по умолчанию берётся пояс браузера.

## API

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/health` | проверка живости |
| `GET` | `/api/slots` | будущие слоты с признаком `isBooked` |
| `POST` | `/api/bookings` | создать бронь: `slotId`, `name`, `email`, `phone?`, `comment?` (до 1000 символов) |
| `GET` | `/api/bookings` | брони с данными слота (панель организатора) |
| `DELETE` | `/api/bookings/:id` | отменить бронь (слот освобождается) |
| `POST` | `/api/bookings/cancel` | отменить бронь по токену из ссылки: `{ token }` |
| `GET` | `/api/availability` | правила доступности организатора |
| `PUT` | `/api/availability` | обновить правила (пересобирает будущие слоты) |

Примеры:

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok"}

curl http://127.0.0.1:3000/api/slots
# [{"id":1,"startAt":"2026-09-24T07:00:00.000Z","durationMin":30,"isBooked":false}]

curl -X POST http://127.0.0.1:3000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"slotId":1,"name":"Иван","phone":"+79000000000","email":"ivan@example.com"}'
# 201 {"id":1,"slotId":1,...,"createdAt":"2026-09-23 18:00:00"}

curl -X POST http://127.0.0.1:3000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"slotId":1,"name":"Иван","phone":"+79000000000","email":"not-an-email"}'
# 400 {"error":"Неверный email"}

curl http://127.0.0.1:3000/api/bookings
# [{"id":1,"slotId":1,"name":"Иван",...,"startAt":"...","durationMin":30}]
```

Ошибки: `422` — невалидное тело запроса, `400` — прошедший слот или слот в пределах 2 часов до начала, `404` — слот не найден, `409` — слот уже занят.

## Скрипты

| Команда | Действие |
|---|---|
| `npm run dev` | Vite dev-сервер (:5173) |
| `npm run server:dev` | Fastify с автоперезапуском (:3000) |
| `npm run build` | typecheck + продакшн-сборка |
| `npm run start` | запуск продакшн-сервера |
| `npm test` | тесты (Vitest) |
| `npm run lint` / `npm run typecheck` | линтер / проверка типов |
| `npm run db:generate` / `npm run db:push` | миграции Drizzle |

## Структура

```
src/       фронтенд: pages, components/ui, hooks, api, lib (zod), types
server/    Fastify: app.ts (фабрика), validation.ts (zod), db/ (Drizzle + SQLite)
docs/      архитектура, конвенции, ADR, планы
```

## Тесты

```bash
npm test
```

- фронтенд — React Testing Library (jsdom);
- API — интеграционные тесты через `app.inject()` на in-memory SQLite (`DATABASE_PATH=:memory:`).

## Деплой

Docker-образ (multi-stage) + `render.yaml` для Render.com: план free, healthcheck `/health`, SQLite-файл эфемерный (данные сбрасываются при перезапуске). Подробности — [`docs/ci_cd_render.md`](docs/ci_cd_render.md).

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.