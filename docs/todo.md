# TODO: план развития проекта

Аудит соответствия `docs/code_artifact.md` (спека Hexlet) и текущего MVP.
Репозиторий реализует упрощённый вариант на стеке из `AGENTS.md` (Vite + Fastify + SQLite + Drizzle); отклонение от спеки зафиксировано в `docs/architecture.md`.

## Критерии приёмки проекта — статус (проверяет наставник + hexlet-check)

Легенда: ✅ done · 🟡 partial · ❌ missing. Источник — `docs/course-steps.md`.

### Функциональность

- 🟡 Сквозной сценарий: тип встречи → календарь → слот → запись → подтверждение <нет «типа встречи» как сущности; экран успеха есть на `/book/:slug`, отдельного `/booking/:uuid/confirmed` нет>
- 🟡 Занятый слот не бронируется повторно + понятное сообщение о конфликте <`UNIQUE(slotId)` + `409` и тост есть; типов встреч нет, сообщение не выделено как спец-алерт>
- ✅ Правила бронирования выполняются на сервере (`minNotice`, генерация, проверка в `POST /api/bookings`)
- 🟡 Страница владельца со встречами всех типов в одном списке <`/dashboard` есть, но типов нет>
- ❌ API по контракту: OpenAPI из TypeSpec → клиентский SDK + серверные артефакты <нет TypeSpec/OpenAPI/SDK; ручной `src/api/client.ts`>
- ✅ Окно записи 14 дней, слоты по 30 минут (`ADR-0004`)
- ✅ Docker-образ, авто-старт, порт из `PORT`, ссылка в `README.md` (`render.yaml`, `calendar-slots-app.onrender.com`)

### Проверяемость

- ✅ Тесты + линтер в GitHub Actions, `main` зелёный (`ci.yml`)
- ✅ Тесты покрывают сценарий бронирования и конфликт слотов (интеграционные + `409`)
- ✅ Conventional Commits, release-please создаёт release-PR (`release-please.yml`)
- ✅ Секретов в репозитории нет (`.env` в `.gitignore`, `.env.example`)

### Настройка агентной разработки

- ✅ `AGENTS.md` с командами запуска/тестов/линтера и правилом про коммиты
- ✅ `docs/agents/` с конфигурацией трекера (`issue-tracker.md`, `triage-labels.md`, `domain.md`)
- ✅ Конфигурация MCP-серверов в репозитории (`opencode.jsonc` → `mcp`, `docs/mcp.md`)

### Следы работы по скиллам

- ❌ В Issues есть карта решений с закрытыми задачами и ответами <Issues пусты — не начат шаг 2 (`wayfinder`)>
- ❌ В Issues есть спецификация приложения и тикеты с зависимостями <не начат (`to-spec` → `to-tickets`)>
- ✅ `CONTEXT.md` со словарём проекта (создан на Шаге 1; записи `docs/adr/` — ADR-0001…0010)
- ❌ Тикеты ссылаются на спецификацию, коммиты — на тикеты <тикетов нет>

**Итог:** критичные пробелы приёмки — TypeSpec→OpenAPI→SDK (Функциональность), `CONTEXT.md` и весь трекер (Следы работы по скиллам). Это шаги курса 1–3, а не хвосты MVP.

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

## Осталось

### Blocker приёмки (шаги курса, [docs/course-steps.md](course-steps.md))

1. ~~**Шаг 1** — `CONTEXT.md` + интервью по главной (`grill-with-docs`) + ADR + `/implement`~~ ✅ **выполнено 2026-09-24**: `CONTEXT.md`, [ADR-0010](adr/0010-landing-and-booking-routes.md), лендинг `/`, бронь `/book/:slug`
2. **Шаг 2** — карта решений (`wayfinder`) → `to-spec` → `to-tickets`; **Design First: TypeSpec → OpenAPI → SDK + серверные артефакты**
3. **Шаг 3** — реализация тикетов через `/implement`, фронт через сгенерированный SDK, Playwright на сквозной сценарий
4. Ввести сущность «тип встречи» (event-types) — общий корень для контракта Шага 2 и страницы владельца

### Low

- [ ] Полная мульти-хост-модель: `host_id` в `slots`/`bookings`, `POST /api/v1/bookings`, страница `/book/:hostId` (текущий v1 — аддитивный, однохостовый по факту)
- [ ] Авторизация `/dashboard` (сейчас панель публична)
- [x] **Баг:** ссылка «Доступность» в сайдбаре `/dashboard` не скроллила к секции — исправлено: `onClick` + `scrollIntoView({behavior:'smooth'})` + `history.replaceState('#availability')` в `src/components/dashboard-sidebar.tsx`; тест `src/components/dashboard-sidebar.test.tsx`

## Ключевые расхождения со спекой

1. **Схема БД**: есть `availability_rules` (одна строка, один хост), нет `hosts`, статусов и диапазонов времени по дням; правила доступности — персистентны, [ADR-0005](adr/0005-dashboard-availability-and-cancellation.md).
2. **API**: `/api/v1` и хосты добавлены аддитивно ([ADR-0009](adr/0009-hosts-and-api-v1.md)): есть `GET /api/v1/hosts/:slug/settings|slots?date=&timezone=`; полной мульти-хост-модели (`host_id` в `slots`/`bookings`, `POST /api/v1/bookings`) нет. Тело брони другое, отмена реализована как `DELETE /api/bookings/:id`.
3. **Форма**: email (обяз.) добавлен, телефон валидируется по формату и теперь опционален (как допускает спека); нет telegram.
4. **Экраны**: `/dashboard` реализован (список, отмена, настройки, без auth); нет `/book/:hostId`.

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
- [ ] Несколько интервалов в день (§3.1; сейчас одно окно `windowStartHour`–`windowEndHour`)
- [ ] Кнопка «Скопировать понедельник на будни» (§3.1)
- [ ] `buffer_before` / `buffer_after` (§3.1) <частично: один `bufferMin` 0–480>
- [ ] Пресеты `max_future_days` 14/30/60 (§3.1) <частично: свободный ввод `horizonDays` 1–90>
- [ ] `/admin/event-types` + `EventForm` (`title`/`slug`/`description`/`location_type`) (§3.2)
- [ ] Роут `/admin/bookings` (§3.3) <частично: список на `/dashboard` есть>
- [ ] Табы Upcoming / Past / Canceled (§3.3) <частично: фильтр Все / Неделя / Сегодня>
- [ ] Поиск по имени и email (§3.3)
- [ ] `BlockTimeModal` + форма блокировки времени (§3.3)