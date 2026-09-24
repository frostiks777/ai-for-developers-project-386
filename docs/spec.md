# Спецификация приложения «Календарь звонков» (v1)

> Источник истины по поведению. Термины — в [`CONTEXT.md`](../CONTEXT.md), архитектурные решения — в [`docs/adr/`](adr/), контракт — [`api/main.tsp`](../api/main.tsp), исходное ТЗ — [`docs/code_artifact.md`](code_artifact.md).
> Утверждено в тикет-карте #10 (тикеты #11, #12, #14, #15, #16, #17, #18).

## 1. Цель и рамки

Сервис бронирования звонков: организатор публикует ссылку, гость выбирает **тип встречи** и свободный слот, оставляет контакты и получает подтверждение. Регистрации и авторизации нет.

**В рамках v1:** типы встреч, генерация слотов, бронирование, конфликт слотов, отмена/перенос, страница владельца, контракт TypeSpec → OpenAPI → SDK + серверные типы.
**Вне рамок:** мульти-хост, авторизация, email/напоминания, блокировка дат, Telegram, многодневные интервалы, раздельные буферы, аналитика.

## 2. Роли

- **Организатор** (владелец) — настраивает доступность и типы встреч, видит предстоящие встречи, отменяет их.
- **Гость** — открывает публичную страницу по ссылке, выбирает тип и слот, бронирует, отменяет/переносит по ссылке.

## 3. User stories

**Организатор:**
1. Настроить доступность (рабочие дни, диапазоны времени, длительность слота, буфер, минимальный запас, горизонт).
2. Создавать и редактировать типы встреч.
3. Видеть предстоящие встречи всех типов одним списком.
4. Отменять встречу.

**Гость:**
1. Открыть публичную страницу по ссылке.
2. Увидеть доступные типы встреч и выбрать один.
3. Выбрать свободный слот в пределах горизонта (по умолчанию 14 дней).
4. Оставить контакты и забронировать.
5. Получить подтверждение и ссылки (календарь / перенос / отмена).
6. Отменить или перенести встречу по ссылке.

## 4. Функциональные правила

- **Тип встречи** задаёт `durationMin` (в MVP — 30 мин), `locationType`, признак активности. Типы с длительностью ≠ 30 в MVP скрыты.
- **Слоты** генерируются из правил доступности: диапазоны по дням недели, шаг `slotDurationMin`, с учётом `bufferMin`, `minNoticeMin`, `horizonDays`.
- **Окно записи** — по умолчанию 14 дней; слоты по 30 минут.
- **Конфликт:** на одно время — не более одной активной брони, **в том числе для разных типов**. Занятый слот не предлагается как свободный; повторная запись отклоняется с понятным сообщением.
- **Правила бронирования выполняются на сервере** — UI-проверки не считаются защитой.
- **Отмена** переводит бронь в статус `cancelled` (не удаляет); слот снова свободен. **Перенос** меняет слот брони.
- **Доступность:** `availability_rules` (одна строка на хоста в MVP) + `availability_ranges` (диапазоны по дням недели).

## 5. Доменная модель (SQLite / Drizzle)

| Таблица | Ключевые поля | Примечание |
|---|---|---|
| `hosts` | `id`, `slug` (unique), `name`, `timezone`, `createdAt` | MVP — один организатор |
| `availability_rules` | `host_id`, `slotDurationMin`, `bufferMin`, `minNoticeMin`, `horizonDays` | параметры генерации слотов |
| `availability_ranges` | `host_id`, `weekday` (1–7), `start_minute`, `end_minute` | несколько интервалов на день |
| `event_types` | `id`, `host_id`, `slug`, `title`, `description`, `duration_min`, `location_type`, `is_active` | сеется дефолтный тип |
| `slots` | `id`, `startAt` (UTC ISO), `durationMin` | материализованные слоты (ADR-0003/0004) |
| `bookings` | `id`, `slotId`, `eventTypeId`, `startAt`, `endAt`, `status`, контакты, `cancelToken`, `createdAt` | `startAt`/`endAt` — снимок времени |

- `bookings.status` — `confirmed` \| `cancelled`; уникальность: partial unique index `UNIQUE(slotId) WHERE status != 'cancelled'` (вместо прежнего `UNIQUE(slotId)`).
- Миграции — идемпотентный модуль `server/db/migrate.ts`, выполняется при старте; тесты на `DATABASE_PATH=:memory:`.
- Модель ТЗ без `slots` (overlap-проверка) отклонена: SQLite не даёт exclusion constraint (см. тикет #12).

## 6. API-контракт

Источник — `api/main.tsp`; OpenAPI — `docs/openapi/openapi.yaml`; клиентский SDK — `src/api/generated/`; серверные типы — `server/generated/api-types.ts`. Генерация одной командой:

```bash
npm run api:generate
```

Все пути — под `/api/v1`. Легаси `/api/*` вне контракта.

| Метод и путь | Назначение |
|---|---|
| `GET /hosts/{slug}/settings` | публичные настройки организатора |
| `GET /hosts/{slug}/event-types` | список типов встреч |
| `POST /hosts/{slug}/event-types` | создать тип |
| `PATCH /hosts/{slug}/event-types/{eventTypeId}` | изменить тип |
| `DELETE /hosts/{slug}/event-types/{eventTypeId}` | удалить тип |
| `GET /hosts/{slug}/availability` | правила доступности |
| `PUT /hosts/{slug}/availability` | обновить правила |
| `GET /hosts/{slug}/slots?date=&eventTypeId=` | слоты на дату → `{ date, timeZone, slots[] }` |
| `GET /hosts/{slug}/bookings` | предстоящие встречи (владелец) |
| `POST /hosts/{slug}/bookings` | создать бронь (гость) |
| `GET /bookings/{bookingId}` | бронь по UUID |
| `POST /bookings/{bookingId}/cancel` | отменить |
| `POST /bookings/{bookingId}/reschedule` | перенести |

- **Идентификаторы:** `bookingId` — публичный UUID (он же в ссылках отмены/переноса).
- **Ошибки:** `ApiError { code, message, details? }`, коды `VALIDATION_ERROR`, `NOT_FOUND`, `SLOT_TAKEN`, `CONFLICT`.
- **Время:** локальное время организатора (`LocalDateTime`, `YYYY-MM-DDTHH:mm`) + поле `timeZone` (IANA); даты — `LocalDate`.
- Сгенерированные файлы коммитятся и **вручную не правятся**.

## 7. Тестирование

- **API-интеграционные** — `app.inject()` + in-memory БД.
- **UI** — React Testing Library + jsdom.
- **E2E Playwright** — обязателен, отдельный гейт `npm run test:e2e` (не в `npm test`); сквозной сценарий гостя и конфликт слотов.
- **Контрактные** — маршруты `/api/v1/*` существуют; ключевые ответы (слоты, бронь) валидны по OpenAPI.
- **Обязательные кейсы:** повторная бронь занятого слота; отмена освобождает слот; разные типы не занимают один слот дважды; `minNotice`/`horizon` отсекают слоты.
- **Миграции** — отдельный тест на `:memory:` (таблицы, backfill, partial unique index).
- Порог покрытия в vitest не вводится; SDK не тестируется (только `typecheck`/сборка).

## 8. Соответствие критериям приёмки курса

| Требование | Как закрыто |
|---|---|
| Сквозной сценарий записи | `GET event-types → GET slots → POST bookings` + UI |
| Занятый слот не бронируется (в т.ч. другой тип) | partial unique index + серверная проверка, кейс `SLOT_TAKEN` |
| Правила на сервере | валидация и проверка конфликта в `server/` |
| Страница владельца | `GET /hosts/{slug}/bookings`, UI-список |
| API по контракту | `api/main.tsp` → OpenAPI → SDK + `server/generated/api-types.ts` |
| OpenAPI из TypeSpec, генерация одной командой | `npm run api:generate` |
| Клиентский SDK и серверные артефакты | `src/api/generated/`, `server/generated/api-types.ts` |
| Окно 14 дней, слоты 30 минут | `availability_rules`, генерация слотов |
| Тесты и линтер в CI зелёные | `npm run lint/typecheck/test/build` |
| Тесты сценария и конфликта | API + RTL + Playwright |
| Conventional Commits, release-please | коммиты `feat/fix/docs/chore` |
| Карта, спецификация, тикеты в Issues | #10 + #11–#18 + эта спека |

## 9. Открытые вопросы (на Шаг 3)

- Пересборка сетки слотов под длительность типа (15/45/60 мин).
- Как отмена/перенос и дашборд отражают `status` в UI.
- Миграция `src/api/client.ts` на сгенерированный SDK.
- Совместимость легаси `/api/*` с новыми `status`/`eventTypeId`.
- Состав e2e-сценариев Playwright.

## 10. Ссылки

- Тикет-карта: [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) и дочерние #11–#18.
- Контракт: `api/main.tsp`, `docs/openapi/openapi.yaml`.
- Словарь: `CONTEXT.md`. ADR: `docs/adr/README.md`.
- Research: `docs/research/typespec-toolchain.md`.
