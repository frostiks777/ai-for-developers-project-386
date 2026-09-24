# TODO: план развития проекта

Аудит соответствия `docs/code_artifact.md` (спека Hexlet) и текущего MVP.
Репозиторий реализует упрощённый вариант на стеке из `AGENTS.md` (Vite + Fastify + SQLite + Drizzle); отклонение от спеки зафиксировано в `docs/architecture.md`.

## Критерии приёмки проекта — статус (проверяет наставник + hexlet-check)

Легенда: ✅ done · 🟡 partial · ❌ missing. Источник — `docs/course-steps.md`.

### Функциональность

- ✅ Сквозной сценарий: тип встречи → календарь → слот → запись → подтверждение (`event_types` → slots → `POST /api/v1/.../bookings` + UI; e2e Playwright)
- ✅ Занятый слот не бронируется повторно + сообщение о конфликте (partial unique index + `409 SLOT_TAKEN`, в т.ч. для другого типа)
- ✅ Правила бронирования выполняются на сервере (`minNotice`, генерация, проверка в `POST /api/bookings` и v1)
- ✅ Страница владельца со встречами всех типов в одном списке (`/dashboard`, `GET /api/v1/hosts/:slug/bookings`)
- ✅ API по контракту: OpenAPI из TypeSpec → клиентский SDK + серверные артефакты (`api/main.tsp`, `docs/openapi/openapi.yaml`, `src/api/generated/`, `server/generated/api-types.ts`, `npm run api:generate`)
- ✅ Окно записи 14 дней, слоты по 30 минут (`ADR-0004`)
- ✅ Docker-образ, авто-старт, порт из `PORT`, ссылка в `README.md` (`render.yaml`, `calendar-slots-app.onrender.com`)

### Проверяемость

- ✅ Тесты + линтер в GitHub Actions, `main` зелёный (`ci.yml`)
- ✅ Тесты покрывают сценарий бронирования и конфликт слотов (интеграционные + `409` + контракт-тесты `ajv` + e2e Playwright); требования к покрытию Шага 3 — в `docs/spec.md` §7, решение — [ADR-0012](adr/0012-contract-tests-and-e2e.md)
- ✅ Conventional Commits, release-please создаёт release-PR (`release-please.yml`; открыт PR #9 на 1.8.0)
- ✅ Секретов в репозитории нет (`.env` в `.gitignore`, `.env.example`)

### Настройка агентной разработки

- ✅ `AGENTS.md` с командами запуска/тестов/линтера и правилом про коммиты
- ✅ `docs/agents/` с конфигурацией трекера (`issue-tracker.md`, `triage-labels.md`, `domain.md`)
- ✅ Конфигурация MCP-серверов в репозитории (`opencode.jsonc` → `mcp`, `docs/mcp.md`)

### Следы работы по скиллам

- ✅ В Issues есть карта решений с закрытыми задачами и ответами ([#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) + #11–#18)
- ✅ В Issues есть спецификация приложения и тикеты с зависимостями (`docs/spec.md`; тикеты #11–#18 с `blocked_by`)
- ✅ `CONTEXT.md` со словарём проекта (Шаг 1; ADR-0001…ADR-0011)
- ✅ Тикеты ссылаются на спецификацию, коммиты — на тикеты (T1–T9, #19–#27; коммиты ссылаются на номера тикетов)

**Итог:** Шаг 3 завершён — спецификация реализована и сверена с контрактом (тикеты #19–#27 закрыты).

## Сделано

- [x] Каркас: Fastify `:3000` (`/health`, `/api/slots`, `/api/bookings`), Vite, линтер, тесты, CI
- [x] SQLite + Drizzle (`slots`, `bookings`) и сидирование 8 слотов
- [x] `POST /api/bookings`: `400/404/409/201`; `GET /api/slots` с `isBooked`
- [x] UI: список слотов (loading/error/empty), кнопка «Забронировать»/«Занято»
- [x] Диалог брони: имя + телефон, блокировка submit, сброс полей
- [x] Тосты sonner, `ApiError`, хуки `use-availability` / `use-booking`
- [x] Типы синхронизированы фронт/бэк, 6 тестов, `hexlet-check.yml` не тронут
- [x] Обязательный `email`: форма (zod, inline-ошибка), API (400 с сообщением), БД (`ALTER TABLE` при старте). [ADR-0002](adr/0002-zod-api-validation.md)
- [x] Валидация телефона: только цифры и разделители, 10–15 цифр (zod, inline-ошибка на фронте, 400 на бэке)
- [x] Фильтр прошедших слотов: SQL `startAt >= now`, фильтр в `useAvailability`, `400` при попытке брони на прошедший слот
- [x] Ре-сид слотов, когда будущих слотов не осталось
- [x] Интеграционные тесты API: `buildApp()` + `app.inject()` на in-memory БД (`server/app.test.ts`)
- [x] Починен CI: vitest `3.2.7 → 4.1.11` (устранён `Channel closed`, vitest#8201) + матрица Node `[22, 24]` (Node 20 EOL)
- [x] `GET /api/bookings`: брони с данными слота (`BookingWithSlot`), сортировка по `startAt`, 2 интеграционных теста
- [x] README: стек, установка, запуск, env, примеры API; добавлен `.env.example` (asciinema — заглушка, запись за автором)
- [x] Race condition закрыт: уникальный индекс `bookings_slotId_unique` (SQLite вместо exclusion constraint из спеки), `409` через перехват `SQLITE_CONSTRAINT_UNIQUE`; [ADR-0003](adr/0003-unique-slot-booking.md)
- [x] Экран успеха: `BookingSuccess` («Встреча успешно запланирована!», дата/время, длительность, имя, email, кнопка «Выбрать другое время»); `useBooking` возвращает `Booking`, 2 RTL-теста
- [x] Поле «комментарий»: колонка `comment` (nullable + ALTER), zod `max(1000)` с пустым → `null`, Textarea в форме, `comment` в `POST`/`GET /api/bookings`
- [x] Месячная сетка календаря: `MonthCalendar` (навигация по месяцам, метки дней со слотами, прошедшие/пустые дни недоступны), фильтр списка по выбранному дню на клиенте (`src/utils/dates.ts`); 3 теста компонента + интеграционный. API `?date=` отложен к генерации слотов/таймзонам
- [x] Генерация слотов по правилам: `server/availability.ts` (будни, окно 10:00–18:00 UTC, шаг «длительность 30 + буфер 10», minNotice 120 мин, горизонт 14 дней), сид через `generateSlotStarts`, `GET`/`POST` учитывают minNotice; [ADR-0004](adr/0004-slot-generation-rules.md); 4 unit + 2 API-теста
- [x] Таймзоны: хранение в UTC (ISO) уже было; клиент отображает и группирует по дням в выбранном поясе — `src/utils/timezone.ts` (`toDateKeyInZone`, `formatDateTimeInZone`, `timeZoneOptionLabel`), `TimeZoneSelect` (browser TZ по умолчанию, популярные пояса), сквозная передача `timeZone` в Calendar/Dialog/Success; 4 unit + 2 RTL-теста
- [x] Телефон опциональный (по спеке): zod `optional` + `refine` (пустой → не задан), колонка `phone` nullable (миграция-пересборка таблицы для старых БД), `phone: string | null` в контракте, пометка «необязательно» в форме, телефон в экране успеха только если указан; 2 API + 1 RTL-тест
- [x] Убран ESLint warning в `src/components/ui/button.tsx`: `buttonVariants` больше не экспортируется (внутренний, потребителей нет) → `react-refresh/only-export-components` чист
- [x] `/dashboard` организатора: `react-router-dom` (`/` и `/dashboard`), список броней (`BookingsTable`) + отмена (`DELETE /api/bookings/:id`, `204/404/400`), настройки доступности (`AvailabilityForm`) поверх `availability_rules` (одна строка `id=1`) + `GET/PUT /api/availability`; `server/rules.ts` (`load`/`save`/`regenerateFutureSlots` — занятые слоты не трогаются); `minNotice` читается из правил; [ADR-0005](adr/0005-dashboard-availability-and-cancellation.md); 7 API + 6 RTL-тестов
- [x] Экспорт брони в календарь (Экран 3): `src/utils/calendar.ts` (`buildIcs`, `googleCalendarUrl`, `downloadIcs`), кнопки «Скачать .ics» и «Добавить в Google Календарь» на экране успеха; 3 unit + 1 RTL-теста. Ссылка отмены — отложена (токен/API)
- [x] Отмена брони по токену-ссылке (Экран 3): колонка `bookings.cancelToken` (nullable+unique), токен `randomUUID` в ответе на создание, `POST /api/bookings/cancel` (`204/404/400`), ссылка `${origin}/cancel/:token` с копированием на экране успеха, страница `/cancel/:token`; [ADR-0006](adr/0006-cancellation-by-token.md); 4 API + 3 RTL-теста
- [x] Перенос брони по токену (Экран 3): `GET /api/bookings/by-token/:token`, `POST /api/bookings/reschedule` (`UPDATE slotId`; `200/400/404/409`), страница `/reschedule/:token` с календарём и свободными слотами, ссылка «Перенести» на экране успеха; [ADR-0008](adr/0008-reschedule-by-token.md); 6 API + 2 RTL-теста
- [x] `422` вместо `400` на невалидное тело (по спеке): zod-ошибки в `POST /api/bookings`, `POST /api/bookings/cancel`, `PUT /api/availability` → `422 Unprocessable Entity`; бизнес-ошибки (прошедший слот, `minNotice`, некорректный `:id`) остаются `400`; тесты и доки обновлены
- [x] Хосты + версионированный API v1 (Low, аддитивно): таблица `hosts` (UUID PK, unique slug), сид дефолтного хоста, `GET /api/v1/hosts/:slug/settings` и `GET /api/v1/hosts/:slug/slots?date=&timezone=` (`404` неизвестный slug, `400` дата/пояс); `/api/*` не тронут; [ADR-0009](adr/0009-hosts-and-api-v1.md); 7 API-тестов
- [x] Визуальный редизайн A + D и светлая/тёмная тема, этапы 1–7 ([ADR-0007](adr/0007-visual-redesign-and-themes.md)): 1 — токены/шрифты/тема (`ThemeProvider`, `ThemeToggle`, `useMediaQuery`, анти-флеш-скрипт); 2 — десктоп-раскладка бронирования; 3 — мобильная раскладка (`date-strip.tsx`, `booking-bar.tsx`); 4 — рестайл диалога брони; 5 — рестайл экрана успеха; 6 — редизайн панели организатора (`dashboard-sidebar.tsx`, `bookings-list.tsx`, `booking-filter.tsx`, `availability-form.tsx`); 7 — документация (данный этап)
- [x] **Шаг 1 курса**: `CONTEXT.md` (словарь проекта), [ADR-0010](adr/0010-landing-and-booking-routes.md); главная `/` — новый `LandingPage`, бронь переехала на `/book/:slug`, фронт брони на API v1 (`fetchHostSettings`/`fetchHostSlots`), `NotFoundPage`; ссылки дашборда/отмены/переноса обновлены; 3 теста лендинга + обновлены `App`/`home-page` (`src/App.test.tsx`, `src/pages/landing-page.test.tsx`)
- [x] **Шаг 2 курса** (проектирование бронирования): карта решений [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) с тикетами #11–#18 (все закрыты); спецификация `docs/spec.md`; TypeSpec-контракт `api/main.tsp`; [ADR-0011](adr/0011-event-types-status-and-availability-ranges.md); генерация одной командой `npm run api:generate` → `docs/openapi/openapi.yaml`, `src/api/generated/` (SDK), `server/generated/api-types.ts`
- [x] **Шаг 3, T1–T7** (реализация): миграции, типы встреч, диапазоны доступности, слоты по типу/дате, жизненный цикл брони, отмена/перенос по публичному id v1; фронт переведён на сгенерированный SDK ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25)) — ручной `src/api/client.ts` удалён, добавлены `src/api/sdk.ts` (клиент + `call()`/`ApiError`) и `src/api/mappers.ts`

## Осталось

### Blocker приёмки (шаги курса, [docs/course-steps.md](course-steps.md))

1. ~~**Шаг 1** — `CONTEXT.md` + интервью по главной (`grill-with-docs`) + ADR + `/implement`~~ ✅ **выполнено 2026-09-24**: `CONTEXT.md`, [ADR-0010](adr/0010-landing-and-booking-routes.md), лендинг `/`, бронь `/book/:slug`
2. ~~**Шаг 2** — карта решений (`wayfinder`) → `to-spec` → `to-tickets`; Design First: TypeSpec → OpenAPI → SDK + серверные артефакты~~ ✅ **выполнено 2026-09-24**: карта #10, `docs/spec.md`, `api/main.tsp`, `npm run api:generate`
3. ~~**Шаг 3** — реализация тикетов через `/implement`, фронт через сгенерированный SDK, Playwright на сквозной сценарий~~ ✅ **выполнено 2026-09-24**: T1–T9 (SQLite-миграции, `event_types`/`status`/`availability_ranges`, слоты/брони v1, SDK-миграция фронта, контракт-тесты + e2e Playwright, сверка со спецификацией); коммиты по тикетам #19–#27, все закрыты
4. ~~Ввести сущность «тип встречи» (event-types)~~ ✅ **выполнено**: `event_types` + API v1 + интерфейс владельца ([#21](https://github.com/frostiks777/ai-for-developers-project-386/issues/21))

### UI-доработки

- [x] **Колонка «Доступность» (`/dashboard`, `src/components/availability-settings-form.tsx`):** кнопка «Убрать» у интервала дня вылезала за рамки колонки (360 px). Заменена на компактную иконку-крестик (`aria-label`), тайм-инпуты сжаты (`flex-1 min-w-0`); тест `availability-settings-form.test.tsx`.

### Из Gemini-спеки (`docs/calendar_agent_spec.md`)

> Эталон от Gemini — упрощённый (без типов встреч, часового пояса, телефона/комментария, отмены/переноса). Полное выравнивание **отклонено**: сохраняем утверждённый редизайн A/D ([ADR-0007](adr/0007-visual-redesign-and-themes.md)) и API `/api/v1`. Берём только функционально недостающее.
> Сверка: S1 Landing / S2 Slot Selection / S3 Contact Form / S4 Success — уже есть (наша реализация); S2-панель «Свободно»/«Длительность» покрыта `freeCount`/`durationMin`.

- [ ] **Экран «Предстоящие события» (S5):** публичная страница со списком броней-карточек (имя, email, `Слот: YYYY-MM-DD-HH:mm`, `Создано: DD.MM.YYYY, HH:mm`); маршрут (напр. `/events`) поверх существующего `GET /api/v1/hosts/:slug/bookings`.
- [ ] **Табы в шапке «Записаться / Предстоящие события»** — навигация к S5 (сейчас в `AppHeader` одна ссылка).

### Low

- [ ] Полная мульти-хост-модель: `host_id` в `slots`/`bookings`, `POST /api/v1/bookings`, страница `/book/:hostId` (текущий v1 — аддитивный, однохостовый по факту)
- [ ] Авторизация `/dashboard` (сейчас панель публична)
- [x] **Баг:** ссылка «Доступность» в сайдбаре `/dashboard` не скроллила к секции — исправлено: `onClick` + `scrollIntoView({behavior:'smooth'})` + `history.replaceState('#availability')` в `src/components/dashboard-sidebar.tsx`; тест `src/components/dashboard-sidebar.test.tsx`

## Ключевые расхождения со спекой

> Целевое состояние зафиксировано в утверждённой спецификации `docs/spec.md` (Шаг 2). Ниже — расхождения **текущего кода** с этой целью; закрываются на Шаге 3.

1. **Схема БД**: есть `slots`, `bookings`, `availability_rules` + `hosts`; **нет** `event_types`, `bookings.status`/`eventTypeId`, `availability_ranges`. Миграции — Шаг 3 (`server/db/migrate.ts`).
2. **API**: `/api/v1` реализован частично (`GET hosts/:slug/settings|slots`); контракт `api/main.tsp` описывает полный `/api/v1` (event-types CRUD, availability GET/PUT, bookings, cancel/reschedule по UUID), реализация — Шаг 3. Легаси `/api/*` сохранён.
3. **Форма**: email (обяз.) добавлен, телефон опционален; нет `guests`/согласия/`Idempotency-Key` (бэклог P0).
4. **Экраны**: `/` — лендинг, `/book/:slug` — бронь, `/dashboard` (без auth), `/cancel/:token`, `/reschedule/:token`; вместо токенов спека предполагает `/booking/:uuid/...` (Шаг 3).

## Backlog из внешней спеки (Gemini, docs/gemini-code-1790192589378.md)

Сверка пунктов спеки с фактическим кодом: DONE здесь не дублируется, ниже — только MISSING и PARTIAL (`<частично: …>` — что уже есть и чего не хватает).
Умышленные расхождения MVP (один хост, токены вместо uuid, форма `name/email/phone/comment` без `guests`/согласия, `/dashboard` без auth) — бэклог, не баги.

### P0 — Публичный флоу бронирования (§1.1–1.3)

- [ ] Маршрут `/book/:slug` (§1.1): сейчас единый `/` под одного хоста; slug знает только v1 API
- [ ] `TimezoneSelector`: поиск по IANA (§1.1) <частично: селект есть (`src/components/timezone-select.tsx`), поиска нет>
- [ ] Переключатель 12/24-часового формата (§1.1)
- [ ] Валидация имени min 2 (§1.2) <частично: сейчас min 1 (`src/lib/validation.ts`)>
- [ ] Маска телефона (§1.2) <частично: опциональность и формат «10–15 цифр» есть, маски ввода нет>
- [ ] Лимит `notes` 500 (§1.2) <частично: поле `comment` есть, но max 1000>
- [ ] Поле `guests` — массив email с добавлением по Enter (§1.2)
- [ ] Чекбокс согласия с правилами/ПДн (§1.2)
- [ ] Заголовок `Idempotency-Key` (§1.2)
- [ ] Обработка 409 (§1.2) <частично: тост + refetch есть, спец-алерта «слот только что заняли» нет>
- [ ] Экран `/booking/:uuid/confirmed` (§1.3) <частично: `BookingSuccess` на `/` есть (дата/пояс, GCal, .ics, «Перенести»); нет отдельного роута, аватара/названия встречи, ссылки на конференцию>
- [ ] Ссылка «Отменить встречу» на экране успеха (§1.3) <частично: только копируемая ссылка отмены, прямой кнопки нет>

### P1 — Self-service (§2.1–2.2)

- [ ] Роуты `/booking/:uuid/cancel` и `/booking/:uuid/reschedule` (§2.1–2.2): сейчас `/cancel/:token`, `/reschedule/:token`
- [ ] Детали встречи на странице отмены (§2.1)
- [ ] Поле `cancellation_reason` (§2.1)
- [ ] Модалка подтверждения отмены (§2.1) <частично: inline-подтверждение на странице есть>
- [ ] `POST /api/bookings/:uuid/cancel` (§2.1) <частично: есть `POST /api/bookings/cancel` по токену в теле>

### P1 — Дашборд организатора (§3.1–3.3)

- [ ] Роут `/admin/availability` (§3.1) <частично: секция «Доступность» на `/dashboard` есть>
- [ ] Несколько интервалов в день (§3.1) — ✅ **сделано**: `availability_ranges` (несколько окон на день), форма `/dashboard` — «Добавить интервал»
- [ ] Кнопка «Скопировать понедельник на будни» (§3.1)
- [ ] `buffer_before` / `buffer_after` (§3.1) <частично: один `bufferMin` 0–480>
- [ ] Пресеты `max_future_days` 14/30/60 (§3.1) <частично: свободный ввод `horizonDays` 1–90>
- [ ] `/admin/event-types` + `EventForm` (`title`/`slug`/`description`/`location_type`) (§3.2)
- [ ] Роут `/admin/bookings` (§3.3) <частично: список на `/dashboard` есть>
- [ ] Табы Upcoming / Past / Canceled (§3.3) <частично: фильтр Все / Неделя / Сегодня>
- [ ] Поиск по имени и email (§3.3)
- [ ] `BlockTimeModal` + форма блокировки времени (§3.3)