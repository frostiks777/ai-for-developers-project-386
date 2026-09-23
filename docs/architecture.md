# Архитектура приложения

## Обзор

«Календарь звонков» — сервис бронирования звонков. Приложение состоит из двух частей, которые разрабатываются и запускаются в одном репозитории:

- **Фронтенд** — React 18 + TypeScript (strict) + Vite. UI строится на Tailwind CSS и компонентах shadcn/ui.
- **Бэкенд** — Fastify 5 на Node.js, порт **3000**. Данные хранятся во встроенной БД **SQLite**, доступ к ней идёт через **Drizzle ORM**.

Общий язык проекта — TypeScript в strict-режиме: и клиент, и сервер типизированы, проверка типов выполняется командой `npm run typecheck`.

## Слои фронтенда

Код фронтенда живёт в `src/`. Каждая директория — отдельный слой со своей зоной ответственности:

| Директория | Назначение |
|---|---|
| `src/components/` | UI-компоненты приложения (функциональные, с типизацией пропсов) |
| `src/components/ui/` | Компоненты shadcn/ui — базовые примитивы (кнопки, инпуты, диалоги) |
| `src/pages/` | Маршруты/страницы; только здесь разрешены default-экспорты |
| `src/hooks/` | Кастомные хуки (`use-slots.ts` → `useSlots`) |
| `src/api/` | Клиентский слой API-вызовов — все обращения к бэкенду только отсюда |
| `src/utils/`, `src/lib/` | Утилиты; в `src/lib/utils.ts` живёт хелпер `cn()` |
| `src/types/` | Общие TypeScript-типы (интерфейсы сущностей: слот, бронирование) |
| `src/main.tsx` | Точка входа приложения |

Во всём проекте настроен path alias: **`@` → `./src`** (в `vite.config.ts` и `tsconfig.json`). Импорты пишутся через алиас, а не через относительные пути вида `../../`.

```ts
import { Button } from '@/components/ui/button'
import { fetchSlots } from '@/api/slots'
import type { Slot } from '@/types/slot'
```

## Бэкенд

Код сервера отделён от фронтенда и лежит в `server/`:

- `server/index.ts` — точка входа: создаёт приложение через `buildApp()` и слушает порт 3000. Запуск в dev-режиме — `npm run server:dev` (через `tsx watch`).
- `server/app.ts` — фабрика `buildApp()`: регистрирует `/health`, маршруты `/api/*` и раздачу собранного фронтенда из `dist/`. Фабрика позволяет тестам поднять изолированный инстанс без `listen()` (`app.inject()`).
- `server/validation.ts` — zod-схемы API-контракта (`createBookingSchema`, `availabilityRulesSchema`); зеркало для фронтенда — `src/lib/validation.ts`. См. [ADR-0002](adr/0002-zod-api-validation.md).
- `server/availability.ts` — правила доступности (`AvailabilityRules`), дефолт и чистая генерация слотов `generateSlotStarts`; конверсия строк таблицы `availability_rules`. См. [ADR-0004](adr/0004-slot-generation-rules.md), [ADR-0005](adr/0005-dashboard-availability-and-cancellation.md).
- `server/rules.ts` — персистентные правила: `loadAvailabilityRules` / `saveAvailabilityRules` / `regenerateFutureSlots` (пересборка свободных будущих слотов, занятые не трогаются).
- `server/db/schema.ts` — схема БД в терминах Drizzle ORM (таблицы `slots`, `bookings`, `availability_rules`).
- `server/db/` — клиент Drizzle поверх `better-sqlite3`; путь к файлу БД переопределяется переменной `DATABASE_PATH` (`:memory:` используется в тестах).
- `server/data/app.db` — файл базы SQLite. БД **in-app**: не требует отдельного сервера СУБД, файл живёт внутри проекта.

Миграции и синхронизация схемы выполняются через drizzle-kit (`npm run db:generate` / `npm run db:push`). Для скелета при старте создаются недостающие таблицы и колонки, а также сидируются слоты по правилам доступности (если будущих слотов нет).

Маршруты фронтенда (React Router): `/` — страница гостя (`HomePage`), `/dashboard` — панель организатора (`DashboardPage`: список броней с отменой и настройки доступности).

Интеграционные тесты API живут в `server/app.test.ts` и `server/dashboard.test.ts` и работают с in-memory БД (`DATABASE_PATH=:memory:` в `vite.config.ts` → `test.env`).

## Поток данных

В dev-режиме фронтенд открывается на порту Vite (5173), а все запросы к API идут через **прокси**: Vite перенаправляет пути `/api/*` на Fastify (`http://localhost:3000`, настроено в `vite.config.ts`). Поэтому клиентский код всегда обращается к относительному пути `/api/...` и не знает ни про порт сервера, ни про CORS.

Цепочка: **браузер → vite dev proxy `/api` → Fastify :3000 → Drizzle → SQLite**.

Пример на двух эндпоинтах:

1. `GET /api/slots` — страница календаря вызывает `fetchSlots()` из `src/api/client.ts` → запрос уходит на `/api/slots` → прокси Vite передаёт его Fastify → маршрут через Drizzle читает таблицу слотов из `server/data/app.db` (прошедшие слоты отфильтровываются и на бэке, и в `useAvailability`) → JSON со слотами возвращается на фронтенд и кладётся в состояние хука.
2. `POST /api/bookings` — форма бронирования вызывает `createBooking()` из `src/api/client.ts` с данными формы → Fastify валидирует тело zod-схемой (`name`, `email`, `slotId`, опциональные `phone`, `comment`) → Drizzle вставляет запись в таблицу бронирований → клиент получает созданное бронирование и обновляет UI.

## Диаграмма потока запроса

```
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│     Браузер      │  HTTP    │   Vite dev :5173 │  proxy   │   Fastify :3000  │
│  React-компонент │ ───────► │  proxy '/api'    │ ───────► │  server/app.ts   │
│  → src/api/*     │ ◄─────── │                  │ ◄─────── │  маршруты /api/* │
└──────────────────┘   JSON   └──────────────────┘          └────────┬─────────┘
                                                                     │ Drizzle ORM
                                                                     ▼
                                                            ┌──────────────────┐
                                                            │     SQLite       │
                                                            │ server/data/     │
                                                            │   app.db         │
                                                            └──────────────────┘
```

## Команды разработки

| Команда | Что делает |
|---|---|
| `npm run dev` | Запуск dev-сервера Vite (фронтенд, :5173, с прокси `/api`) |
| `npm run server:dev` | Запуск бэкенда Fastify с перезагрузкой (`tsx watch server/index.ts`, :3000) |
| `npm test` | Прогон тестов (Vitest + React Testing Library) |
| `npm run lint` | Проверка ESLint |
| `npm run typecheck` | Проверка типов (`tsc --noEmit`) |
| `npm run build` | Продакшн-сборка (`tsc --noEmit && vite build`) |
| `npm run db:generate` | Генерация миграций Drizzle по изменениям схемы |
| `npm run db:push` | Применение схемы к БД напрямую (для локальной разработки) |

Для полноценной локальной работы нужны два процесса: `npm run server:dev` и `npm run dev` — бэкенд и фронтенд запускаются параллельно.
