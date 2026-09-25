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

- [x] **Кнопка «Блокировки» в левом меню организатора (`/dashboard`, `src/components/dashboard-sidebar.tsx`):** в сайдбаре есть «Встречи» (текущий), «Типы встреч», «Доступность» — пункта «Блокировки» нет, хотя секция `id="blocks"` на странице присутствует (`src/pages/dashboard-page.tsx:153`). Добавить ссылку по образцу «Типы встреч»/«Доступность» (`scrollToSection` + иконка, напр. `CalendarOff`), добавить `BLOCKS_SECTION_ID = 'blocks'`; тест в `src/components/dashboard-sidebar.test.tsx`.
- [x] **Аудит корректности кнопок левого меню организатора:** проверить, что каждый пункт сайдбара (`Встречи`, `Типы встреч`, `Доступность`, + будущие `Блокировки`) реально скроллит/переключает нужную секцию и не «ломается» при отсутствии элемента (мобильная раскладка использует табы, а не сайдбар — сверить, что десктоп-сайдбар скрыт на мобиле). Зафиксировать найденные баги отдельными пунклами.

### Редизайн блока «Доступность» (`docs/Инструкция по редизайну блока Доступность.md`)

> Внешняя спека (Calendly/Cal.com-паттерны). Сверка с текущим `src/components/availability-settings-form.tsx`.

- [x] **Несколько интервалов в день** — ✅ уже есть: кнопка «Добавить интервал» + удаление по иконке-крестику.
- [x] **Однострочный лейаут дня** — ✅ частично: строка `[чекбокс][Пн][start]–[end][✕]` уже одна линия; интервалы дня идут друг под другом.
- [x] **Перевести чекбоксы в Switch/тоггл** (§3, §7): нативный `input[type=checkbox]` заменён на `role="switch"` (`aria-checked`, `aria-label="Пн: доступность"`).
- [x] **Иконка `+` вместо текста «Добавить интервал»** (§3, §7): кнопка-иконка `Plus` (`aria-label="Добавить интервал: Пн"`); новый интервал ставится после последнего с не пересечением.
- [x] **Кнопка «Копировать» интервал дня** (§3, §7): иконка `Copy` + `Dialog` выбора целевых дней (Bulk copy); копия заменяет интервалы выбранных дней.
- [x] **Быстрые пресеты (Preset Chips)** (§4, §7): `Пн–Пт 10:00–18:00`, `Пн–Пт 09:00–18:00`, `Каждый день 10:00–20:00`, `Очистить всё`.
- [x] **Индикатор таймзоны в шапке карточки** (§2, §7): строка «Часовой пояс: <IANA>» с иконкой `Globe`.
- [x] **Real-time валидация** (§5): хронология (`start < end` → красный бордер + подсказка), пересечение интервалов одного дня, мин. длительность по `slotDurationMin`; кнопка «Сохранить» блокируется.
- [x] **Информационная подсказка о пересечении слотов** в подвале (§2, §4): «Интервалы одного дня не должны пересекаться».
- [x] **Undo для пресетов** (§4): применение пресета показывает toast с кнопкой «Отменить».
- [x] **Учесть маршрут `/admin/availability`** (из P1-дашборда): `DashboardPage` принимает `initialSection`, маршруты `/admin/{availability,event-types,bookings,blocks}` открывают нужную секцию (на десктопе — прокрутка к `#id`, на телефоне — стартовый таб).

### UI-баг: обрезка списка слотов на странице бронирования (`/book/:slug`)

> Колонка со слотами (правая, «Пятница, 25 сентября») по высоте выше карточки: нижний слот срезается, при скролле прячется верхний (заголовок и первый слот). Причина — список слотов растягивает колонку, а прокрутка происходит всей страницей/карточкой, а не внутренним списком.

- [x] **Цель: список слотов помещается в колонку целиком** — сетка слотов должна ужиматься по доступной высоте карточки (без обрезки снизу и без уезжающего верха), заголовок дня остаётся видимым. ✅ **выполнено** (коммиты `4e4ddb6`, `edb3dc7`): колонка правого списка `flex min-h-0 flex-col`, список `flex-1 min-h-0 overflow-y-auto`, сетка календаря вписана в высоту.
- [x] **Фолбэк, если целиком не влезает:** внутренний скролл **только внутри списка слотов**, в стиле страницы (тонкий/скрытый нативный скроллбар, как в остальном UI) — контейнер списка `flex-1 min-h-0 overflow-y-auto`; скроллится список, а не вся страница/карточка. Последний слот доступен, заголовок не уезжает.
- [x] Компонент — `src/components/slot-grid.tsx` (или колонка в `home-page.tsx`). Тест: RTL-смоук на `overflow-y-auto` у контейнера списка; визуальная проверка на 1280×820 и 390×844, обе темы. ✅ реализовано в `home-page.tsx:249-292` (`scrollbar-none` + внутренний скролл); визуальная проверка — за автором при следующем прогоне.

### Из Gemini-спеки (`docs/calendar_agent_spec.md`)

> Эталон от Gemini — упрощённый (без типов встреч, часового пояса, телефона/комментария, отмены/переноса). Полное выравнивание **отклонено**: сохраняем утверждённый редизайн A/D ([ADR-0007](adr/0007-visual-redesign-and-themes.md)) и API `/api/v1`. Берём только функционально недостающее.
> Сверка: S1 Landing / S2 Slot Selection / S3 Contact Form / S4 Success — уже есть (наша реализация); S2-панель «Свободно»/«Длительность» покрыта `freeCount`/`durationMin`.

- [x] **Экран «Предстоящие события» (S5):** публичная страница `src/pages/events-page.tsx` (маршрут `/events`) — карточки броней (имя, email, `Слот: YYYY-MM-DD-HH:mm`, `Создано: DD.MM.YYYY, HH:mm`) поверх `GET /api/v1/hosts/:slug/bookings`; фильтр confirmed + будущие, сортировка, пустое состояние; 2 RTL-теста.
- [x] **Табы в шапке «Записаться / Предстоящие события»** — `AppHeader` получил проп `tabs` (pill-навигация, `aria-current`), используется на лендинге, `/book/:slug` и `/events`.

### Low

- [ ] Полная мульти-хост-модель: `host_id` в `slots`/`bookings`, `POST /api/v1/bookings`, страница `/book/:hostId` (текущий v1 — аддитивный, однохостовый по факту)
- [x] **Авторизация `/dashboard`** — [ADR-0017](adr/0017-dashboard-basic-auth.md): Basic-auth на `/dashboard` и `/admin/*` через `ADMIN_PASSWORD` (если не задан — панель открыта, для dev/тестов); демо-пароль для наставника — в README. Административные API пока публичны (учебный MVP).
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

- [x] Маршрут `/book/:slug` (§1.1) — **сделано** (ADR-0010): лендинг `/`, бронь `/book/:slug`
- [x] `TimezoneSelector`: поиск по IANA (§1.1) — **сделано**: `TimeZoneSelect` переделан в combobox (`role="combobox"` + `role="listbox"`), поиск по подстроке (`searchTimeZones` в `src/utils/timezone.ts`, `Intl.supportedValuesOf`), фокус открывает список популярных поясов; unit + RTL-тесты
- [x] Переключатель 12/24-часового формата (§1.1) — **сделано**: `TimeFormatProvider` + `useTimeFormat` (localStorage `call-calendar-hour12`), `TimeFormatToggle` в `HostInfo` и мобильной шапке; формат учитывают `SlotGrid`, `BookingBar`, `BookingDialog`, `BookingSuccess`; RTL-тест
- [x] Валидация имени min 2 (§1.2) — **сделано**: `min(2, 'Имя от 2 символов')` в `src/lib/validation.ts` ↔ `server/validation.ts` (legacy `name` и v1 `clientName`), inline-ошибка в диалоге
- [x] Маска телефона (§1.2) — **сделано**: `src/utils/phone.ts` (`formatPhoneInput`, RU-маска `+7 (900) 000-00-00`, иностранные — цифры с `+`), применяется в диалоге; unit-тесты
- [x] Лимит `notes` 500 (§1.2) — **сделано**: `max(500)` в зеркалах схем, `maxLength={500}` и счётчик «N / 500» в диалоге
- [x] Поле `guests` — массив email с добавлением по Enter (§1.2) — **сделано**: `CreateBookingRequest.guests`/`Booking.clientGuests`, `bookings.guests` (JSON), чипы в диалоге, API + RTL-тесты ([ADR-0015](adr/0015-booking-guests-consent-idempotency.md))
- [x] Чекбокс согласия с правилами/ПДн (§1.2) — **сделано**: обязательный `consentAccepted` в контракте/v1-валидации, `bookings.consentAccepted`, чекбокс блокирует submit ([ADR-0015](adr/0015-booking-guests-consent-idempotency.md))
- [x] Заголовок `Idempotency-Key` (§1.2) — **сделано**: `@header("Idempotency-Key")`, `bookings.idempotencyKey` (UNIQUE), повтор возвращает ту же бронь ([ADR-0015](adr/0015-booking-guests-consent-idempotency.md))
- [x] Обработка 409 (§1.2) — **сделано**: inline-алерт `role="alert"` «Этот слот только что заняли. Выберите другое время.» (`booking-dialog`), тост + refetch
- [x] Экран `/booking/:uuid/confirmed` (§1.3) — **сделано**: `src/pages/confirmed-page.tsx` (`GET /api/v1/bookings/:id`), название встречи, аватар/имя организатора, дата/время с поясом, способ связи (`locationType`), GCal/.ics, ссылки «Перенести»/«Отменить»; 2 RTL-теста.
- [x] Ссылка «Отменить встречу» на экране успеха (§1.3) — **сделано**: прямая кнопка `Link` на `/cancel/:token` в `BookingSuccess`

### P1 — Self-service (§2.1–2.2)

- [x] Роуты `/booking/:uuid/cancel` и `/booking/:uuid/reschedule` (§2.1–2.2) — **сделано**: добавлены алиасы (`/cancel/:token`, `/reschedule/:token` сохранены); `CancelPage`/`ReschedulePage` читают `token ?? uuid`
- [x] Детали встречи на странице отмены (§2.1) — **сделано**: `CancelPage` тянет `GET /api/v1/bookings/:id` и показывает «Когда» (дата/время + пояс) и «Длительность»
- [x] Поле `cancellation_reason` (§2.1) — **сделано**: колонка `bookings.cancellationReason`, `POST /api/v1/bookings/:id/cancel` принимает `{reason}`, поле + модалка подтверждения на `/cancel/:token`
- [x] Модалка подтверждения отмены (§2.1) — **сделано**: `Dialog` «Вы уверены, что хотите отменить бронирование?» с полем причины
- [ ] `POST /api/bookings/:uuid/cancel` (§2.1) <частично: есть `POST /api/bookings/cancel` по токену в теле и v1 `POST /api/v1/bookings/:id/cancel`>

### P1 — Дашборд организатора (§3.1–3.3)

- [x] Роут `/admin/availability` (§3.1) — **сделано**: маршрут ведёт на панель организатора (секция «Доступность»)
- [x] Несколько интервалов в день (§3.1) — ✅ **сделано**: `availability_ranges` (несколько окон на день), форма `/dashboard` — «Добавить интервал»
- [x] Кнопка «Скопировать понедельник на будни» (§3.1) — **покрыто** общим диалогом копирования дня на выбранные дни (`Copy` → выбор целевых дней)
- [ ] `buffer_before` / `buffer_after` (§3.1) <частично: один `bufferMin` 0–480> — требует изменения контракта/БД
- [x] Пресеты `max_future_days` 14/30/60 (§3.1) — **сделано**: кнопки-пресеты рядом с `horizonDays` в форме доступности
- [x] `/admin/event-types` + `EventForm` (`title`/`slug`/`description`/`location_type`) (§3.2) — **сделано**: маршрут открывает секцию типов встреч (`initialSection="event-types"`), `EventTypesEditor` покрывает `title`/`slug`/`description`/`durationMin`/`locationType`; отдельная страница не требуется.
- [x] Роут `/admin/bookings` (§3.3) — **сделано**: маршрут ведёт на панель организатора
- [x] Табы Upcoming / Past / Canceled (§3.3) — **сделано**: `BookingFilter` → «Предстоящие / Прошедшие / Отменённые», отмена только для предстоящих
- [x] Поиск по имени и email (§3.3) — **сделано**: поле поиска в панели (desktop и mobile), фильтр по имени/email
- [x] `BlockTimeModal` + форма блокировки времени (§3.3) — **сделано**: таблица `time_blocks`, API `/api/v1/hosts/:slug/blocks`, `BlocksEditor` + `BlockTimeModal` в панели; блокировки исключают слоты и дают `409`