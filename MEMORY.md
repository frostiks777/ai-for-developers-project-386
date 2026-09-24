# MEMORY.md — Состояние проекта «Календарь звонков»

> Дата последнего обновления: 2026-09-24 (Шаг 2 курса: карта решений #10 закрыта — спецификация, TypeSpec-контракт, генерация OpenAPI/SDK/серверных типов)

## Текущее состояние

Проект находится на шаге 3 курса Hexlet "ИИ для разработчиков" — **Реализация тикетов**.
Шаг 2 (проектирование бронирования) завершён: карта решений [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) с тикетами #11–#18 закрыта, утверждена спецификация `docs/spec.md`, контракт `api/main.tsp`, конвейер `npm run api:generate` (OpenAPI + клиентский SDK + серверные типы).
Создан и установлен скелет: бэкенд (Fastify + Drizzle ORM + SQLite), фронтенд (React 18 + TypeScript + Vite + shadcn/ui), документация, конфиги.
Дополнительно реализованы: обязательный email в брони (zod), фильтр прошедших слотов, интеграционные тесты API на in-memory БД, `GET /api/bookings` (панель организатора), README с примерами; тесты на Vitest 4, CI на Node 22/24.

### Файловая структура (создана)

```
├── package.json              ✅ зависимости + скрипты
├── vite.config.ts            ✅ (vitest 4 + vite 6 — совместимы)
├── tsconfig.json             ✅
├── tailwind.config.js        ✅ shadcn/ui
├── postcss.config.js         ✅
├── eslint.config.js          ✅ flat config ESLint 9
├── .prettierrc               ✅
├── .gitignore                ✅
├── components.json           ✅ shadcn/ui
├── drizzle.config.ts         ✅
├── index.html                ✅
├── Dockerfile                ✅ multi-stage (builder + runtime)
├── .dockerignore             ✅
├── render.yaml               ✅ Render Blueprint (docker, free, frankfurt)
├── src/
│   ├── main.tsx              ✅
│   ├── App.tsx               ✅ маршруты (React Router): / (лендинг), /book/:slug, /dashboard, /cancel/:token, /reschedule/:token, *
│   ├── App.test.tsx          ✅ 3 smoke-теста (лендинг, бронь, 404)
│   ├── index.css             ✅ shadcn CSS-переменные + Tailwind
│   ├── lib/utils.ts          ✅ cn()
│   ├── lib/validation.ts     ✅ zod-схемы брони + правил доступности (зеркало server/validation.ts)
│   ├── types/booking.ts      ✅ TimeSlot, Booking, CreateBookingBody (+email)
│   ├── types/host.ts         ✅ HostSettings (зеркало server/types.ts)
│   ├── types/availability.ts ✅ AvailabilityRules (зеркало server/availability.ts)
│   ├── api/client.ts         ✅ fetchSlots, fetchHostSettings, fetchHostSlots, createBooking, fetchBookings, cancelBooking, cancelBookingByToken, fetch/updateAvailability
│   ├── hooks/use-availability.ts ✅ принимает slug, тянет /api/v1/hosts/:slug/slots (фильтр прошедших)
│   ├── hooks/use-availability.test.tsx ✅ 2 теста (фильтр, ошибка загрузки)
│   ├── utils/dates.ts        ✅ (toDateKey/parseDateKey/startOfDay)
│   ├── utils/calendar.ts     ✅ buildIcs / googleCalendarUrl / downloadIcs
│   ├── utils/timezone.ts     ✅ toDateKeyInZone / formatDateTimeInZone / timeZoneOptionLabel
│   ├── pages/landing-page.tsx ✅ главная (витрина, данные из /api/v1/hosts/:slug/settings)
│   ├── pages/landing-page.test.tsx ✅ 2 теста (данные из API, фолбэк на конфиг)
│   ├── pages/not-found-page.tsx ✅ 404 (неизвестный slug/маршрут)
│   ├── pages/home-page.tsx   ✅ страница бронирования (/book/:slug)
│   ├── pages/home-page.test.tsx ✅ 8 тестов (экран успеха, экспорт, назад, TZ, фильтр, мобильная)
│   ├── pages/dashboard-page.tsx ✅ панель организатора (список + отмена + настройки)
│   ├── pages/dashboard-page.test.tsx ✅ 6 тестов
│   ├── pages/cancel-page.tsx ✅ отмена брони по токену (/cancel/:token)
│   ├── pages/cancel-page.test.tsx ✅ 2 теста
│   ├── pages/reschedule-page.tsx ✅ перенос брони по токену (/reschedule/:token)
│   ├── pages/reschedule-page.test.tsx ✅ 2 теста
│   ├── components/bookings-list.tsx ✅ список броней по дням + отмена
│   ├── components/dashboard-sidebar.tsx ✅ сайдбар (скролл к #availability)
│   ├── components/dashboard-sidebar.test.tsx ✅ 1 тест (скролл)
│   ├── components/availability-form.tsx ✅ форма настроек доступности
│   ├── components/ui/button.tsx ✅ shadcn Button
│   └── test/setup.ts         ✅ jest-dom/vitest + jsdom-полифилы (safe для node)
├── server/
│   ├── index.ts              ✅ точка входа: buildApp() + listen + graceful shutdown
│   ├── app.ts                ✅ фабрика buildApp(): /health, /api/*, статика dist/ (SPA)
│   ├── app.test.ts           ✅ 11 интеграционных тестов (app.inject, in-memory БД)
│   ├── dashboard.test.ts     ✅ 7 интеграционных тестов (отмена, availability)
│   ├── validation.ts         ✅ zod createBookingSchema + availabilityRulesSchema
│   ├── availability.ts       ✅ AvailabilityRules, defaultAvailabilityRules, generateSlotStarts, rulesFromRow/ToRow
│   ├── rules.ts              ✅ load/save правил + regenerateFutureSlots
│   ├── types.ts              ✅ TimeSlot, Booking, CreateBookingBody (+email)
│   ├── db/schema.ts          ✅ Drizzle: slots, bookings (+email), availability_rules
│   ├── db/index.ts           ✅ клиент БД (DATABASE_PATH) + ALTER + авто-сид по правилам
│   └── README.md             ✅
├── docs/
│   ├── architecture.md       ✅
│   ├── conventions.md        ✅
│   ├── agent-principles.md   ✅
│   ├── Структура проекта.md  ✅ (теория агентов)
│   ├── Каркас приложения.md  ✅ (требования шага 2)
│   ├── adr/                  ✅ README + ADR-0001, ADR-0002 + template
│   ├── ci_cd.md              ✅ (план GCP — не используется)
│   ├── ci_cd_render.md       ✅ (план Render — основной)
│   ├── ai-tuning-plan.md     ✅ (тюнинг AI-агентов)
│   └── mcp.md                ✅ (MCP-серверы)
└── AGENTS.md                 ✅ (обновлён под финальный стек)
└── CONTEXT.md                ✅ словарь проекта (организатор, гость, слот, бронь, встреча, тип встречи, правило доступности, токен)
```

## Исправленные ошибки

| Что | Ошибка | Исправление |
|---|---|---|
| `npm install` | `better-sqlite3@11` — нет пресборки под Node 26 | Обновлён до `^13.0.3` |
| `npm install` | `drizzle-orm@0.38`, `drizzle-kit@0.30` — устарели | Обновлены до `^0.45.3` / `^0.31.11` |
| `npm install` | `@types/better-sqlite3@7` — не соответствует v13 | Обновлён до `^9.6.0` |
| `typecheck` | Конфликт типов `vitest/config` vs `vite` (vitest 2 bundled свой vite) | vitest обновлён до ^3.2.7 — конфликт устранён |
| `typecheck` | `@ts-expect-error` стал неиспользуемым после обновления vitest | Директива удалена |
| `lint` | `no-unsafe-finally` в `use-availability.ts` | Убран `finally`, логика перенесена после try/catch |
| `lint` | `react-refresh/only-export-components` warning в `button.tsx` | Предупреждение (не ошибка) — допустимо для shadcn |
| `test` | `src/test/setup.ts` падал в node-окружении (`Element is not defined`) | jsdom-полифилы обёрнуты в `typeof Element !== 'undefined'` |
| `test` | `App.test.tsx` — фикстура слота с прошедшей датой ломалась о новый фильтр | `startAt` генерируется как `now + 1h` |
| CI | `lint-and-test (20)`: `Channel closed` (`ERR_IPC_CHANNEL_CLOSED`, tinypool) — баг vitest 3.x ([vitest#8201](https://github.com/vitest-dev/vitest/issues/8201)) | vitest `3.2.7 → 4.1.11` (пул переписан без tinypool) + Node 20 (EOL) убран из матрицы: `[22, 24]` |
| API/БД | check-then-insert: гонка при параллельных бронированиях; после отказа от предпроверки дубль давал `500` | [ADR-0003](docs/adr/0003-unique-slot-booking.md): `UNIQUE`-индекс `bookings_slotId_unique` + перехват `SQLITE_CONSTRAINT_UNIQUE` → `409` |
| `docs sync` | `opencode/mimo-v2.5-free` удалён из каталога моделей, заменён на `opencode/mimo-v2.6-flash-free` | Обновлено во всех 4 файлах: `docs/model-usage.md`, `AGENTS.md`, `opencode.jsonc`, `docs/ai-tuning-plan.md` |

## Версии зависимостей (финальные)

```json
{
  "react": "^18.3.1",
  "vite": "^6.0.7",
  "vitest": "^4.1.11",
  "typescript": "~5.7.2",
  "fastify": "^5.2.0",
  "better-sqlite3": "^13.0.3",
  "drizzle-orm": "^0.45.3",
  "drizzle-kit": "^0.31.11",
  "tailwindcss": "^3.4.17",
  "react-router-dom": "^7",
  "zod": "^4.6.5",
  "@typespec/compiler": "1.16.0",
  "@typespec/http": "1.16.0",
  "@typespec/openapi3": "1.16.0",
  "@typespec/http-client-js": "0.16.2",
  "@typespec/ts-http-runtime": "0.2.1",
  "openapi-typescript": "^7.13.0"
}
```

## Результаты проверок

```
✅ typecheck: tsc --noEmit — чисто
✅ lint: 0 ошибок, 0 warnings
✅ test: 109/109 passed (19 файлов: App, landing-page, home-page, dashboard-page, cancel-page, reschedule-page, dashboard-sidebar, month-calendar, timezone-select, booking-dialog, theme-toggle, date-strip, use-availability, calendar, server/app, server/dashboard, server/hosts, server/availability, timezone)
✅ build: vite v6.4.3 — 439.64 kB JS (gzip 134.53), 43.15 kB CSS
✅ smoke (prod): PORT=3100 + DATABASE_PATH=temp, /health 200, / 200 (index.html), SPA fallback 200,
   /api/slots 200 (6 слотов, прошедших нет), POST booking с email 201, POST с невалидным email 400,
   GET /api/bookings 200 (бронь с startAt/durationMin)
```

## Что сделано (полный список)

1. ✅ package.json — зависимости + скрипты
2. ✅ Конфиги сборки: vite, tsconfig, tailwind, postcss, eslint, prettier, gitignore, components.json
3. ✅ Фронтенд-скелет src/ (12 файлов)
4. ✅ Бэкенд server/ (Fastify + Drizzle + SQLite, 6 файлов)
5. ✅ Документация docs/ (5 файлов)
6. ✅ npm install — 426 пакетов
7. ✅ Проверки: typecheck, lint, test, build
8. ✅ Исправление ошибок (better-sqlite3 v13, vitest 3, no-unsafe-finally)
9. ✅ GitHub Actions: CI workflow (lint+test на push)
10. ✅ GitHub Actions: release-please workflow
11. ✅ AGENTS.md — обновлён под финальный стек
12. ✅ Тюнинг AI-агентов по [`docs/ai-tuning-plan.md`](docs/ai-tuning-plan.md):
    - ADR-хранилище: [`docs/adr/`](docs/adr/README.md) (README + ADR-0001 + template)
    - Процессные скиллы: `.agents/skills/{interview,plan,ponytail,tdd,verify}` (5 файлов)
    - AGENTS.md: добавлены разделы `## Hygiene of context window`, `## Long-term memory`, `## Safety gates`; обновлены `## Documentation`, `## Skills (OpenCode)`, `## Directory structure`
    - MCP: shadcn MCP подключён в `opencode.jsonc` → блок `mcp`; read-only permission установлена для субагента `explore`; документировано в [`docs/mcp.md`](docs/mcp.md)
    - `docs/agent-principles.md` дополнен ссылками на новые скиллы, ADR и правило 2 итераций
13. ✅ Деплой на Render.com по [`docs/ci_cd_render.md`](docs/ci_cd_render.md):
    - `server/index.ts` — `PORT` из env, раздача `dist/` через `@fastify/static`, SPA fallback
    - `package.json` — скрипт `start` (tsx), `@fastify/static` в dependencies, `tsx` перенесён в dependencies
    - `Dockerfile` — multi-stage (python3/make/g++ для better-sqlite3, non-root), `.dockerignore`
    - `render.yaml` — docker, plan free, region frankfurt, branch main, healthCheck `/health`
    - Коммиты `aa22fb0`, `1202442`, `7c5a1ba`, `ed95bf7` запушены в `main`
14. ✅ Синхронизация документации с каталогом моделей (`tools.opencode.models`):
    - **Sync #1:** `docs/model-usage.md`, `AGENTS.md`, `opencode.jsonc`, `docs/ai-tuning-plan.md` — открытый ID `opencode/mimo-v2.5-free` заменён на `opencode/mimo-v2.6-flash-free`. Добавлен OpenRouter как «справочно».
    - **Sync #2 (текущий):** каталог вырос с 16 до 133 моделей. Обновлено:
      - `docs/model-usage.md`: opencode — добавлена 5-я бесплатная `big-pickle` (теперь 5 из 18); openrouter — таблица переразбита на 3 группы (универсальные 7, роутеры 5, специализированные 1) итого 12 из 115; добавлены `fusion`, `pareto-code`, `bodybuilder`, `auto`, `lyria-3-clip-preview`; удалены 4 устаревших free-модели (`qwen3.8-27b:free`, `laguna-xs:free`, `glm-5.2:free`, `gemma-4-31b-it:free`); список платных opencode-моделей для справки.
      - `AGENTS.md`: добавлен `opencode/big-pickle` в список бесплатных ID.
      - `opencode.jsonc`, `docs/ai-tuning-plan.md`: без изменений (sync #1 уже закрыл `mimo-v2.5-free → v2.6`).
      - Сводная статистика: **133 модели всего, 17 бесплатных, 116 платных**.
15. ✅ Подключение плагина [obra/superpowers](https://github.com/obra/superpowers) в `opencode.jsonc`:
    - Добавлен ключ `plugins: ["superpowers@git+https://github.com/obra/superpowers.git"]` (V2, требует opencode ≥ 2.0.4).
    - Регистрирует 14 дополнительных процессных скилов через OpenCode plugin manager (см. таблицу ключевых решений).
    - `verification-before-completion` + `using-superpowers` теперь доступны в этой же сессии.
    - Локальные 6 скилов в `.agents/skills/` остаются — приоритет V2: проектные → персональные → плагины, ID не пересекаются.
16. ✅ Обязательный email ([ADR-0002](docs/adr/0002-zod-api-validation.md)):
    - zod 4: `server/validation.ts` + зеркало `src/lib/validation.ts`
    - форма: поле Email, inline-ошибка «Неверный email», submit заблокирован
    - API: 400 с сообщением из zod; БД: колонка `email` + `ALTER TABLE` для старых БД
17. ✅ Фильтр прошедших слотов:
    - SQL: `GET /api/slots` возвращает только `startAt >= now`
    - фронт: `useAvailability` дополнительно фильтрует
    - `POST /api/bookings` на прошедший слот → 400 «Слот уже прошёл»
    - ре-сид 8 слотов, если будущих слотов не осталось
18. ✅ Интеграционные тесты API: `server/app.ts` (`buildApp()`), `server/app.test.ts` — 11 тестов через `app.inject()` на `DATABASE_PATH=:memory:`
19. ✅ Валидация телефона (zod `refine`): цифры + разделители, 10–15 цифр; inline-ошибка «Неверный номер телефона» в форме, 400 на бэке
19. ✅ Импорт 37 upstream-скилов в `.agents/skills/` (по требованию — доступны всем агентам, не только OpenCode):
    - **Single-skill репо (5):** `open-code-review` (alibaba), `i-have-adhd` (ayghri), `security-audit` (cloudflare, +references/ +scripts/), `archify-review` (tt-a1i), `browser-skill` (Tencent: CLI body + DSH variant section, объединено из двух SKILL.md в один).
    - **Каталог tech-leads-club/agent-skills (32):** только категории `(development)` — 18 шт. (`codenavi`, `coding-guidelines`, `confluence-assistant`, `docs-writer`, `gh-address-comments`, `harness-eval`, `jira-assistant`, `nestjs-modular-monolith`, `not-your-babysitter`, `rails-dev`, `react-native-expert`, `shopify-developer`, `spec-driven-eval`, `tlc-discover`, `tlc-implement`, `tlc-plan`, `tlc-spec-driven`, `tlc-spec-lean`) — и `(architecture)` — 14 шт. (`component-common-domain-detection`, `component-flattening-analysis`, `component-identification-sizing`, `coupling-analysis`, `decomposition-planning-roadmap`, `domain-analysis`, `domain-identification-grouping`, `evolutionary-modular-architecture`, `frontend-blueprint`, `legacy-migration-planner`, `modular-decomposition`, `modular-design-principles`, `react-composition-patterns`, `tactical-ddd`).
    - **Имена → из frontmatter `name:`**, директории = `name` в kebab-case. Никаких переименований/префиксов.
    - **Vitest exclude:** добавлен `.agents/skills/**` в `vite.config.ts` → `test.exclude`, чтобы исключить upstream-ские `.cjs` test-файлы из `npm test`.
    - **Проверки:** `npm run lint` ✓ (0 err, 1 допустимый warn в `button.tsx`), `npm run typecheck` ✓, `npm test` 20/20 ✓, валидация frontmatter 43/43 (все SKILL.md имеют `--- ---`, `name:`, `description:`).
    - **Известные мелочи:** 3 скила имеют description чуть выше рекомендованных 1024 chars (`evolutionary-modular-architecture` ~1069, `not-your-babysitter` ~1066, `tlc-spec-driven` ~1060 — описания upstream-а, не правлены).
20. ✅ CI зелёный (High): vitest `3.2.7 → 4.1.11` — устранён `ERR_IPC_CHANNEL_CLOSED`/`Channel closed` (баг tinypool, [vitest#8201](https://github.com/vitest-dev/vitest/issues/8201)); матрица CI `node-version: [20, 22] → [22, 24]` (Node 20 EOL). Проверки: 25/25 тестов, typecheck, lint, build — зелёные. Запушено (`d5954e7`); CI run [35885094173](https://github.com/frostiks777/ai-for-developers-project-386/actions/runs/35885094173): оба job (22, 24) — success. Release-please выпустил v1.1.0.
21. ✅ `GET /api/bookings` (High): список броней с данными слота (`BookingWithSlot extends Booking` + `startAt`, `durationMin`), `innerJoin(slots)`, сортировка по `startAt`; типы-зеркала в `server/types.ts` и `src/types/booking.ts`; 2 интеграционных теста (TDD: red → green). Фронтовых потребителей пока нет.
22. ✅ README (High): стек, требования (Node 22/24), установка, запуск dev/prod, таблица env, таблица API + curl-примеры, скрипты, структура, тесты, деплой; добавлен `.env.example` (PORT, DATABASE_PATH). Asciinema — заглушка + TODO.
23. ✅ Race condition (Medium #1): `UNIQUE`-индекс `bookings_slotId_unique` (`CREATE UNIQUE INDEX IF NOT EXISTS` в `server/db/index.ts` + `.unique()` в Drizzle-схеме), предпроверка дубля удалена, `SQLITE_CONSTRAINT_UNIQUE` → `409`; тест на уровне БД + существующий API-тест 409. [ADR-0003](docs/adr/0003-unique-slot-booking.md).
24. ✅ Экран успеха (Medium #2): `src/components/booking-success.tsx` — «Встреча успешно запланирована!», сводка (дата/время, длительность, имя, email), кнопка «Выбрать другое время» (сброс + refetch); `useBooking.bookSlot` возвращает `Booking | null`, `onBooked(booking)`; HomePage рендерит экран вместо списка. 2 RTL-теста (`src/pages/home-page.test.tsx`).
25. ✅ Комментарий (Medium #3): колонка `comment TEXT` (+ALTER при старте), zod `max(1000)` с пустым → `null`, зеркала схем и типов обновлены, `Textarea` (`src/components/ui/textarea.tsx`) в диалоге, `comment` в `POST`/`GET /api/bookings`; 5 серверных + 1 RTL-тест. Билд-объём CSS 16.47 kB, JS 341.48 kB (gzip 106.10).
26. ✅ Месячная сетка (Medium #4): `src/components/month-calendar.tsx` (навигация по месяцам, метки дней со слотами, прошлые/пустые/занятые дни disabled, `aria-label=YYYY-MM-DD`), `src/utils/dates.ts` (`toDateKey`/`parseDateKey`/`startOfDay`); HomePage фильтрует список по выбранному дню на клиенте (activeDate = earliest slot, если выбранного дня больше нет). 3 теста компонента + интеграционный; API `?date=` сознательно отложен к генерации/TZ.
27. ✅ Генерация слотов (Medium #5): `server/availability.ts` — `defaultAvailabilityRules` (Пн–Пт, 10:00–18:00 UTC, 30 мин, буфер 10, minNotice 120 мин, горизонт 14 дней) и чистая `generateSlotStarts(now, rules)`; сид в `server/db/index.ts` заменён генератором; `GET /api/slots` фильтрует `now + minNotice`; `POST /api/bookings` → 400 «Слот уже недоступен» в пределах minNotice. [ADR-0004](docs/adr/0004-slot-generation-rules.md). 4 unit + 2 API-теста.
28. ✅ Таймзоны (Medium #6, последний): `src/utils/timezone.ts` (`toDateKeyInZone` через en-CA, `formatDateTimeInZone`, `timeZoneOptionLabel` с GMT-offset), `TimeZoneSelect` (нативный select, browser TZ по умолчанию + 6 популярных), `timeZone` прокинут в MonthCalendar (группировка дней), BookingDialog, BookingSuccess и список слотов; хранение — по-прежнему UTC ISO. 4 unit + 2 RTL-теста.
29. ✅ Телефон опциональный (по спеке): zod `optional` + `transform` (пустой/`undefined` → не задан) + `refine` (валиден только если задан) в `server/validation.ts` ↔ `src/lib/validation.ts`; колонка `phone` стала nullable в Drizzle-схеме, миграция старых БД через пересборку таблицы (SQLite не умеет снимать `NOT NULL`); контракт `phone?: string` (вход) / `phone: string | null` (выход); в форме пометка «необязательно»; в экране успеха телефон показывается только если указан. 2 API + 1 RTL-тест.
30. ✅ ESLint полностью чистый: `buttonVariants` перестал экспортироваться из `src/components/ui/button.tsx` (внутренний, потребителей нет) — убран warning `react-refresh/only-export-components`.
31. ✅ Деплой на Render подтверждён как живой: https://calendar-slots-app.onrender.com (см. `docs/ci_cd_render.md`). Проверено: `/health` 200, `/` 200 (SPA), `/api/slots` 200, `/api/bookings` 200; собранный JS-хеш совпадает с локальным. В README исправлен неверный URL (`ai-for-developers-project-386.onrender.com` → `calendar-slots-app.onrender.com`).
32. ✅ Панель организатора `/dashboard` (Low): `react-router-dom` 7 (`BrowserRouter` в `main.tsx`, `/` и `/dashboard`); `DashboardPage` + `BookingsTable` (список броней с отменой) + `AvailabilityForm` (чекбоксы дней, числовые поля, zod до отправки). Бэкенд: таблица `availability_rules` (одна строка `id=1`), `server/rules.ts` (`load`/`save`/`regenerateFutureSlots` — свободные будущие слоты пересобираются, занятые не трогаются), `GET/PUT /api/availability`, `DELETE /api/bookings/:id` (`204/404/400`), `minNotice` читается из правил. Схемы/типы-зеркала (`availabilityRulesSchema`, `src/types/availability.ts`). [ADR-0005](docs/adr/0005-dashboard-availability-and-cancellation.md). 7 API + 6 RTL-тестов.
33. ✅ Кнопка «Назад» на экране успеха (`BookingSuccess`): `Button variant="ghost"` с иконкой `ArrowLeft` вверху карточки, вызывает `onReset` → возврат к списку слотов; +1 RTL-тест.
34. ✅ Экспорт брони в календарь (Экран 3 спеки): `src/utils/calendar.ts` (`buildIcs` — VCALENDAR/VEVENT с UTC `DTSTART/DTEND`, CRLF, экранирование переводов строк; `googleCalendarUrl` — шаблон события; `downloadIcs` — Blob-скачивание). Кнопки «Скачать .ics» и «Добавить в Google Календарь» на экране успеха. 3 unit + 1 RTL-теста. Ссылка отмены отложена (нужен токен/API).
35. ✅ Отмена брони по токену-ссылке (Экран 3): колонка `bookings.cancelToken` (nullable + unique; миграция `ALTER`+индекс после колонки), токен `crypto.randomUUID()` в ответе `201` (`CreatedBooking`), `POST /api/bookings/cancel` (`204/404/400`), ссылка `${origin}/cancel/:token` с копированием на экране успеха, страница `/cancel/:token` (отмена по явной кнопке, не при открытии). [ADR-0006](docs/adr/0006-cancellation-by-token.md). 4 API + 3 RTL-теста.
36. ✅ Перенос брони по токену (Экран 3): `GET /api/bookings/by-token/:token` (capability, 404), `POST /api/bookings/reschedule` — `UPDATE bookings.slotId` (старый слот свободен, новый занят; `200/400/404/409`, no-op на тот же слот), страница `/reschedule/:token` (текущее время + календарь + свободные слоты), ссылка «Перенести» на экране успеха. Схема БД не менялась. [ADR-0008](docs/adr/0008-reschedule-by-token.md). 6 API + 2 RTL-теста.
37. ✅ `422` вместо `400` на невалидное тело (спека): zod-ошибки в `POST /api/bookings`, `POST /api/bookings/cancel`, `PUT /api/availability` → `422 Unprocessable Entity`; бизнес-ошибки (прошедший слот, `minNotice`, некорректный `:id`) остаются `400`. Тесты и доки обновлены.
38. ✅ Визуальный редизайн, **Этап 1** (`3c97980`): токены в `src/index.css`, шрифты (`@fontsource/golos-text`, `@fontsource/lora`), `ThemeProvider`/`useTheme`/`ThemeToggle`, `useMediaQuery`, анти-флеш-скрипт в `index.html`, стабы `matchMedia`/`localStorage` в `src/test/setup.ts`. [ADR-0007](docs/adr/0007-visual-redesign-and-themes.md) (Proposed).
39. ✅ Визуальный редизайн, **Этап 2** (`14df808`): Desktop-раскладка страницы бронирования — `AppHeader`, `HostInfo` (слот-карточка хоста), `SlotGrid`, `MonthCalendar`/`TimeZoneSelect` обновлены, `src/config/host.ts`, `src/utils/plural.ts`. `minNoticeMin` поднят из `HostInfo` в `HomePage` (порядок `fetch` важен для контрактного `App.test`). 91/91 тестов зелёные.
40. ✅ Скиллы и агентная среда (шаг курса, `6aa21ce`): установлен набор [mattpocock/skills](https://github.com/mattpocock/skills) в `.agents/skills/` (`npx skills@latest add mattpocock/skills --agent '*' -y`, 38 скилов) + `skills-lock.json`; настроено через `setup-matt-pocock-skills`: трекер — GitHub Issues, метки — дефолтные, домен — single-context. Записано в `docs/agents/{issue-tracker,triage-labels,domain}.md`, в `AGENTS.md` добавлен раздел `## Agent skills`. Лишние `.claude/`/`agent/` удалены (конвенция `.agents/skills/`).
41. ✅ Хосты + API v1 (`server/hosts.ts`, аддитивно): таблица `hosts` (UUID PK, unique slug), сид дефолтного хоста (`slug=default`), `GET /api/v1/hosts/:slug/settings` и `GET /api/v1/hosts/:slug/slots?date=&timezone=` (`404` unknown slug, `400` дата/пояс); `selectFutureSlots()` переиспользован; `/api/*` без изменений. [ADR-0009](docs/adr/0009-hosts-and-api-v1.md). 7 API-тестов. Итог: 98/98 тестов.
42. ✅ Визуальный редизайн, **Этап 3** (`b163d03`): мобильная раскладка D — `src/components/date-strip.tsx` (лента доступных дат, `aria-pressed`, прокрутка к выбранной), `src/components/booking-bar.tsx` (sticky-панель снизу с выбранным временем), `HomePage` при `useMediaQuery('(min-width: 1024px)') === false` (`AppHeader variant="mobile"`, кнопка «Весь месяц» с `aria-expanded`, `SlotGrid columns={3}`). Тесты: `date-strip.test.tsx` + тест страницы с `matchMedia → false`.
43. ✅ Визуальный редизайн, фикс (`5a4e95e`): `ThemeToggle` добавлен в панель организатора до этапа 6 (переключатель темы доступен на обеих страницах).
44. ✅ Визуальный редизайн, **Этап 4** (`8d0513a`): рестайл формы брони — `DialogContent` с пропом `hideClose`, заголовок Lora, сводка с иконкой `Calendar`, порядок полей Имя → Email → Телефон → Комментарий, счётчик «N / 1000» под комментарием, на телефоне — панель снизу с ручкой и кнопкой во всю ширину, фокус на поле «Имя» при открытии; ошибка 409/400 из API: toast + закрыть диалог + `refetch` + снять выбор в `home-page.tsx`.
45. ✅ Визуальный редизайн, **Этап 5** (`db5aec2`): рестайл экрана успеха — `src/components/booking-success.tsx` по `design-spec.md` §3.4 (десктоп — карточка 600 px, телефон — колонка с кнопками внизу), кнопка «Назад» — ghost со стрелкой.
46. ✅ Визуальный редизайн, **Этап 6** (`7293469`): редизайн панели организатора — `src/components/dashboard-sidebar.tsx` (десктопный сайдбар: лого-`h1`, «Встречи» со счётчиком, «Доступность» → `#availability`, `ThemeToggle`), `src/components/bookings-list.tsx` вместо `bookings-table.tsx` (группировка по дню через `toDateKeyInZone`, карточки `<li>`, пустое состояние «Пока нет ни одной брони»; старый файл удалён), `src/components/booking-filter.tsx` (сегменты «Все / Неделя / Сегодня», `role="tablist"`, фильтр на клиенте), `src/components/availability-form.tsx` (дни-«таблетки», select часов, подсказка «≈ N слотов в рабочий день», кнопка «Сохранить» во всю ширину; `id` полей и zod-схема сохранены). Тесты: `closest('tr') → closest('li')` + новые (группировка, фильтр «Сегодня», подсказка «≈ 12 слотов»).
47. ✅ Внешний бэклог Gemini: добавлен `docs/gemini-code-1790192589378.md` (спека от внешнего ревью) + раздел «Backlog из внешней спеки» в `docs/todo.md` (только MISSING/PARTIAL, P0/P1); `docs/roadmap.html` перегенерирован. Итог: 105/105 тестов (17 файлов).
48. ✅ Визуальный редизайн, **Этап 7** (документация, текущий): [ADR-0007](docs/adr/0007-visual-redesign-and-themes.md) переведён в **Accepted** (ветка `feat/redesign-a-d-themes` смержена в `main`), индекс `docs/adr/README.md` обновлён; `README.md` упоминает светлую/тёмную тему и десктоп/мобильные раскладки; `MEMORY.md` и `docs/todo.md` отмечают завершение этапов 1–7.
49. ✅ Шаг 1 курса (главная страница): `CONTEXT.md` — словарь проекта (русские каноны + англ. алиасы); [ADR-0010](docs/adr/0010-landing-and-booking-routes.md); маршруты — `/` = новый `LandingPage` (витрина гостя: hero, «Как это работает», карточка организатора, CTA; данные из `GET /api/v1/hosts/:slug/settings`, фолбэк на `src/config/host.ts`), `/book/:slug` = `HomePage`, `*` = `NotFoundPage`; `host.slug = 'default'`; фронт брони переведён на API v1 (`fetchHostSettings`/`fetchHostSlots`, `useAvailability(slug)`), легаси `/api/*` сохранён; ссылки дашборда/отмены/переноса → `/book/${host.slug}`; фикс бага сайдбара (`scrollIntoView`); 3 теста лендинга + 3 smoke `App` + обновлены `home-page`/`use-availability`. Итог: 109/109 тестов, lint/typecheck/build — зелёные.
50. ✅ Шаг 2 курса (проектирование бронирования, карта решений): карта [#10](https://github.com/frostiks777/ai-for-developers-project-386/issues/10) с тикетами #11–#18, все закрыты. Артефакты:
    - `docs/spec.md` — утверждённая спецификация v1 (роли, user stories, правила, доменная модель, API, тестирование, соответствие критериям).
    - `api/main.tsp` + `api/tspconfig.yaml` — TypeSpec-контракт `/api/v1` (типы встреч, слоты, брони, availability, ошибки).
    - `npm run api:generate` (`scripts/api-generate.mjs`) → `docs/openapi/openapi.yaml`, `src/api/generated/` (клиентский SDK), `server/generated/api-types.ts` (серверные типы через `openapi-typescript`).
    - [ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md) — типы встреч, статусы брони, диапазоны доступности; `CONTEXT.md` дополнен терминами.
    - Правки: `@service(#{ title })` (TypeSpec 1.16), `src/api/generated` и `server/generated` вне ESLint, `tsp-output/` в `.gitignore`; повторная генерация детерминирована. Проверки: lint/typecheck/test (109)/build — зелёные.
51. ⏳ **Шаг 3 курса, T7** ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25)): фронт переведён на сгенерированный SDK. Ручной `src/api/client.ts` удалён; добавлены `src/api/sdk.ts` (инстанс `ApiV1Client` + `call()` + `ApiError`) и `src/api/mappers.ts` (контрактные модели → UI-типы). Все страницы/хуки/компоненты ходят через `api.*`. Технические решения:
    - SDK сконфигурирован `endpoint: window.location.origin`, `allowInsecureConnection: true`, `retryOptions: { maxRetries: 0 }`, кастомный `httpClient` поверх глобального `fetch` — иначе в Node-тестах `@typespec/ts-http-runtime` резолвит nodeHttpClient и не перехватывается `vi.stubGlobal('fetch')`.
    - Удалены `src/types/{host,availability,event-type}.ts`; `src/types/booking.ts` оставлен как UI-модели; типы `AvailabilitySettings`/`EventType`/`Booking` из `@/api/generated`.
    - Тестовый хелпер `src/test/http.ts` (`requestPath` + `jsonResponse`); моки обновлены (абсолютный URL SDK, обязательный `Content-Type: application/json`). `dashboard` собирает `eventTypeTitle` из `listEventTypes`.
    - Проверки: lint 0, typecheck чисто, **137/137 тестов**, build ✓ (JS 510.78 kB / gzip 155.12 — предупреждение о размере чанка).

## Что осталось (следующие шаги)

- [ ] **План курса (процессы)** — сохранён в [`docs/course-steps.md`](docs/course-steps.md): 4 шага — (1) главная страница — **✅ выполнено 2026-09-24** ([ADR-0010](docs/adr/0010-landing-and-booking-routes.md)); (2) проектирование бронирования (wayfinder → спека → тикеты, Design First) — **✅ выполнено 2026-09-24** (карта #10, `docs/spec.md`, `api/main.tsp`, `npm run api:generate`); (3) реализация тикетов через `implement` + Playwright — **не начато**; (4) Docker/деплой — **уже выполнено**. Подробные критерии приёмки — в том же файле (см. также `docs/gemini-code-1790192589378.md` — внешний backlog).
- [ ] **Шаг 3 курса**: тикеты T1–T7 закрыты (см. #19–#25); фронт переведён на сгенерированный SDK ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25), `src/api/sdk.ts` + `mappers.ts`, ручной `src/api/client.ts` удалён). Осталось: T8 (#26) контракт-тесты + e2e Playwright, T9 (#27) финальная сверка со спецификацией.
- [ ] Записать asciinema для README (сейчас заглушка `asciinema.org/a/placeholder` в разделе «Демо»)
- [ ] Low-этап: полная мульти-хост-модель (`host_id` в `slots`/`bookings`, `POST /api/v1/bookings`, `/book/:hostId`), авторизация `/dashboard`

## Ключевые решения

| Решение | Выбор | Причина |
|---|---|---|
| Бэкенд | Fastify 5 | Современный, быстрый, встроенная валидация |
| ORM | Drizzle ORM | TypeScript-first, SQL-подобный, лёгкий |
| БД | SQLite (better-sqlite3) | Нулевая конфигурация, in-app файл |
| UI | shadcn/ui + Tailwind v3.4 | Хорошая поддержка coding-агентами |
| Тесты | Vitest 4 + React Testing Library | Нативная интеграция с Vite 6; пул без tinypool — фикс `Channel closed` |
| CI | GitHub Actions: lint + typecheck + test + build на Node 22 и 24 | Node 20 EOL (апрель 2026); vitest 4 требует Node ^20 \|\| ^22 \|\| >=24 |
| `GET /api/bookings` | Плоский массив `BookingWithSlot`, сортировка по `startAt` | Потребитель — `/dashboard` (`BookingsTable`); контракт простой |
| Защита от двойных броней | `UNIQUE(slotId)` на уровне SQLite + `409` из перехвата constraint | [ADR-0003](docs/adr/0003-unique-slot-booking.md); exclusion constraint спеки в SQLite недоступен |
| Фильтр слотов по дате | Клиентский (группировка по локальной дате в `MonthCalendar`/HomePage) | `GET /api/slots?date=` требует TZ-семантики — отложен к TZ-шагу; слотов ≤ ~112 (14 дней) |
| Генерация слотов | Правила-константы в `server/availability.ts`, материализация в `slots` при старте, правила в UTC | [ADR-0004](docs/adr/0004-slot-generation-rules.md); `hosts/availability_rules` — Low-этап |
| Таймзоны | Хранение — UTC ISO; отображение и группировка по дням — на клиенте в выбранном поясе (`Intl`, без зависимостей) | Селектор в UI, browser TZ по умолчанию; серверные `?date=`/`timezone` не нужны, пока слотов ≤ ~112 |
| Телефон опционален | nullable-колонка + пересборка таблицы при старте (SQLite не умеет DROP NOT NULL) | По спеке телефон необязателен; `ALTER TABLE … ADD COLUMN` недостаточно |
| Панель организатора | `/dashboard` + `react-router-dom`: список броней, отмена, настройки доступности | [ADR-0005](docs/adr/0005-dashboard-availability-and-cancellation.md); без auth (учебный MVP) |
| Правила доступности | Персистентная таблица `availability_rules` — одна строка `id=1`; `PUT` пересобирает свободные будущие слоты, занятые не трогает | [ADR-0005](docs/adr/0005-dashboard-availability-and-cancellation.md); `hosts`/`/api/v1` отложены |
| Отмена брони | `DELETE /api/bookings/:id` удаляет строку → `isBooked` вычисляется join-ом, слот освобождается | Несовместимо с soft-delete из-за `UNIQUE(slotId)`; partial index отложен ([ADR-0005](docs/adr/0005-dashboard-availability-and-cancellation.md)) |
| Отмена гостем | Токен `cancelToken` (UUID, `UNIQUE`) в ответе на создание + `POST /api/bookings/cancel`; ссылка `/cancel/:token` | [ADR-0006](docs/adr/0006-cancellation-by-token.md); capability-модель без auth |
| Перенос гостем | `POST /api/bookings/reschedule` — `UPDATE bookings.slotId` по токену; старый слот свободен | [ADR-0007](docs/adr/0008-reschedule-by-token.md); переиспользует `UNIQUE(slotId)` и токен |
| Порт бэкенда | 3000 | Vite proxy `/api` → `:3000` |
| Порт фронтенда | 5173 (default Vite) | — |
| Долгосрочная память решений | ADR в [`docs/adr/`](docs/adr/README.md) ([ADR-0001](docs/adr/0001-record-architecture-decisions.md)) | Nygard-шаблон; решения переживают `/compact` и смены сессий |
| Процессные скиллы (локальные) | [.agents/skills/](.agents/skills/) — `commit-push`, `interview`, `plan`, `ponytail`, `tdd`, `verify` | Повторно используемые workflow через `skill` tool по триггер-фразам |
| Процессные скиллы (плагин) | [obra/superpowers](https://github.com/obra/superpowers) через `opencode.jsonc` → `plugins` (V2 git-spec) | Дополнительные 14 скилов: `brainstorming`, `systematic-debugging`, `test-driven-development`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`, `using-git-worktrees`, `verification-before-completion`, `using-superpowers`, `diagnosing-superpowers`. Приоритет V2: проектные → персональные → superpowers (локальные `ponytail` и др. не страдают). |
| MCP для UI | [`@shadcn/ui/mcp`](docs/mcp.md) через `opencode.jsonc` → `mcp.shadcn` | Доступ к каталогу компонентов через `components.json` |
| Деплой | Render.com (Docker, Free) | Бесплатно без карты; план GCP (`docs/ci_cd.md`) не используется |
| Фронт в проде | `@fastify/static` раздаёт `dist/` из Fastify | Один контейнер, same-origin `/api` без CORS |
| Порт в проде | `process.env.PORT` (fallback 3000) | Требование Render; хост `0.0.0.0` |
| Валидация API | zod 4 (схема-зеркало: `server/validation.ts` ↔ `src/lib/validation.ts`) | См. [ADR-0002](docs/adr/0002-zod-api-validation.md); единые сообщения об ошибках фронт/бэк |
| Архитектура сервера | Фабрика `buildApp()` в `server/app.ts`, `server/index.ts` — только listen | Тесты через `app.inject()` без реального порта |
| БД в тестах | `DATABASE_PATH=:memory:` (`vite.config.ts` → `test.env`) | Изоляция тестов от `server/data/app.db` |
| Upstream-скилы | Копия upstream-репо в `.agents/skills/<name>/`, имена = frontmatter `name:`, deep-рекурсия (`references/`, `scripts/`) | Доступны всем агентам в проекте (не только opencode); не зависят от локального кеша персональных скилов и плагинов |
| Хосты + API v1 | Аддитивный слой: таблица `hosts` (UUID PK, unique slug), `/api/v1/hosts/:slug/settings|slots`; `/api/*` не тронут | [ADR-0009](docs/adr/0009-hosts-and-api-v1.md); основа мульти-хоста без ломающей миграции |
| Скиллы Matt Pocock | Набор `mattpocock/skills` в `.agents/skills/` + `skills-lock.json`; конфиг трекера/меток/домена в `docs/agents/` | Требование шага курса: GitHub Issues, дефолтные метки, single-context (`CONTEXT.md` + `docs/adr/`) |
| Раскладки редизайна | Десктоп A / телефон D выбираются хуком `useMediaQuery('(min-width: 1024px)')`, а не скрытием через CSS | В DOM нет дублей календаря — не ломаются тесты и доступность ([ADR-0007](docs/adr/0007-visual-redesign-and-themes.md)) |
| Светлая/тёмная тема | `ThemeProvider` + `localStorage` (`call-calendar-theme`, режим `system` по умолчанию) + inline-анти-флеш-скрипт в `index.html`; `sonner` берёт `resolvedTheme` | Токены shadcn (HSL) для обеих тем, без «белых вспышек» при первой загрузке ([ADR-0007](docs/adr/0007-visual-redesign-and-themes.md)) |
| Маршруты главная/бронь | `/` — лендинг (`LandingPage`), `/book/:slug` — бронь (`HomePage`), `*` — 404; slug из `src/config/host.ts`; бронь на API v1 | Требование Шага 1 + спека `/book/:slug`; Hexlet-автопроверка `/` отвечает 200 ([ADR-0010](docs/adr/0010-landing-and-booking-routes.md)) |
| Контракт API (Шаг 2) | TypeSpec `api/main.tsp` → OpenAPI → клиентский SDK + серверные типы; источник истины — `.tsp`, сгенерированное не правится | Design First (Шаг 2); серверный эмиттер TypeSpec alpha без Fastify/zod → серверные маршруты/валидация ручные ([#13](https://github.com/frostiks777/ai-for-developers-project-386/issues/13), [#15](https://github.com/frostiks777/ai-for-developers-project-386/issues/15)) |
| Генерация артефактов | `npm run api:generate` → `docs/openapi/openapi.yaml`, `src/api/generated/`, `server/generated/api-types.ts` (`openapi-typescript`); сгенерированное коммитится | Одной командой, детерминированно; CI/hexlet-check не запускают `tsp` ([#17](https://github.com/frostiks777/ai-for-developers-project-386/issues/17)) |
| Модель данных v1 | Материализованные `slots` остаются; `event_types`; `bookings.eventTypeId` + `status` + `startAt`/`endAt`; `availability_ranges`; partial unique `UNIQUE(slotId) WHERE status != 'cancelled'`; миграции — `server/db/migrate.ts` | Отклонение от ТЗ §5 (нет `slots`) обосновано: SQLite без exclusion constraint ([ADR-0003](docs/adr/0003-unique-slot-booking.md), [ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md), [#12](https://github.com/frostiks777/ai-for-developers-project-386/issues/12)) |
| Отмена брони (Шаг 2) | Смена `status` на `cancelled` вместо удаления строки; занятость считается только для `confirmed` | ТЗ требует `status` и историю ([ADR-0011](docs/adr/0011-event-types-status-and-availability-ranges.md)); в коде — переход на Шаге 3 |
| Тестирование v1 | API (`app.inject` + in-memory) + RTL/jsdOM + e2e Playwright (`npm run test:e2e`, отдельный гейт); контракт-тесты — валидация ключевых ответов по OpenAPI; миграции на `:memory:` | Требование курса: сценарий и конфликт покрыты; правила на сервере ([#14](https://github.com/frostiks777/ai-for-developers-project-386/issues/14)) |

## Окружение

- **ОС**: Windows 10 (win32)
- **Node.js**: v26.9.0
- **npm**: 11.19.1
- **better-sqlite3@13** — пресборки для win32-x64 + Node 26 доступны
