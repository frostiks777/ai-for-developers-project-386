# MEMORY.md — Состояние проекта «Календарь звонков»

> Дата последнего обновления: 2026-09-22 (sync #3: +37 upstream-скилов в `.agents/skills/`)

## Текущее состояние

Проект находится на шаге 2 курса Hexlet "ИИ для разработчиков" — **Каркас приложения**.
Создан и установлен скелет: бэкенд (Fastify + Drizzle ORM + SQLite), фронтенд (React 18 + TypeScript + Vite + shadcn/ui), документация, конфиги.
Дополнительно реализованы: обязательный email в брони (zod), фильтр прошедших слотов, интеграционные тесты API на in-memory БД.

### Файловая структура (создана)

```
├── package.json              ✅ зависимости + скрипты
├── vite.config.ts            ✅ (vitest 3 + vite 6 — типы совместимы)
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
│   ├── App.tsx               ✅
│   ├── App.test.tsx          ✅ smoke-тест
│   ├── index.css             ✅ shadcn CSS-переменные + Tailwind
│   ├── lib/utils.ts          ✅ cn()
│   ├── lib/validation.ts     ✅ zod-схема брони (зеркало server/validation.ts)
│   ├── types/booking.ts      ✅ TimeSlot, Booking, CreateBookingBody (+email)
│   ├── api/client.ts         ✅ fetchSlots, createBooking
│   ├── hooks/use-availability.ts ✅ (no-unsafe-finally исправлен, фильтр прошедших)
│   ├── hooks/use-availability.test.tsx ✅ 2 теста (фильтр, ошибка загрузки)
│   ├── pages/home-page.tsx   ✅
│   ├── components/ui/button.tsx ✅ shadcn Button
│   └── test/setup.ts         ✅ jest-dom/vitest + jsdom-полифилы (safe для node)
├── server/
│   ├── index.ts              ✅ точка входа: buildApp() + listen + graceful shutdown
│   ├── app.ts                ✅ фабрика buildApp(): /health, /api/*, статика dist/ (SPA)
│   ├── app.test.ts           ✅ 11 интеграционных тестов (app.inject, in-memory БД)
│   ├── validation.ts         ✅ zod createBookingSchema
│   ├── types.ts              ✅ TimeSlot, Booking, CreateBookingBody (+email)
│   ├── db/schema.ts          ✅ Drizzle: slots, bookings (+email)
│   ├── db/index.ts           ✅ клиент БД (DATABASE_PATH) + ALTER + авто-сид
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
| `docs sync` | `opencode/mimo-v2.5-free` удалён из каталога моделей, заменён на `opencode/mimo-v2.6-flash-free` | Обновлено во всех 4 файлах: `docs/model-usage.md`, `AGENTS.md`, `opencode.jsonc`, `docs/ai-tuning-plan.md` |

## Версии зависимостей (финальные)

```json
{
  "react": "^18.3.1",
  "vite": "^6.0.7",
  "vitest": "^3.2.7",
  "typescript": "~5.7.2",
  "fastify": "^5.2.0",
  "better-sqlite3": "^13.0.3",
  "drizzle-orm": "^0.45.3",
  "drizzle-kit": "^0.31.11",
  "tailwindcss": "^3.4.17",
  "zod": "^4.6.5"
}
```

## Результаты проверок

```
✅ typecheck: tsc --noEmit — чисто
✅ lint: 0 ошибок, 1 warning (buttonVariants — допустимо)
✅ test: 20/20 passed (4 файла: App, booking-dialog, use-availability, server/app)
✅ build: vite v6.4.3 — 338.63 kB JS (gzip 105.39), 16.17 kB CSS
✅ smoke (prod): PORT=3100 + DATABASE_PATH=temp, /health 200, / 200 (index.html), SPA fallback 200,
   /api/slots 200 (6 слотов, прошедших нет), POST booking с email 201, POST с невалидным email 400
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
19. ✅ Импорт 37 upstream-скилов в `.agents/skills/` (по требованию — доступны всем агентам, не только OpenCode):
    - **Single-skill репо (5):** `open-code-review` (alibaba), `i-have-adhd` (ayghri), `security-audit` (cloudflare, +references/ +scripts/), `archify-review` (tt-a1i), `browser-skill` (Tencent: CLI body + DSH variant section, объединено из двух SKILL.md в один).
    - **Каталог tech-leads-club/agent-skills (32):** только категории `(development)` — 18 шт. (`codenavi`, `coding-guidelines`, `confluence-assistant`, `docs-writer`, `gh-address-comments`, `harness-eval`, `jira-assistant`, `nestjs-modular-monolith`, `not-your-babysitter`, `rails-dev`, `react-native-expert`, `shopify-developer`, `spec-driven-eval`, `tlc-discover`, `tlc-implement`, `tlc-plan`, `tlc-spec-driven`, `tlc-spec-lean`) — и `(architecture)` — 14 шт. (`component-common-domain-detection`, `component-flattening-analysis`, `component-identification-sizing`, `coupling-analysis`, `decomposition-planning-roadmap`, `domain-analysis`, `domain-identification-grouping`, `evolutionary-modular-architecture`, `frontend-blueprint`, `legacy-migration-planner`, `modular-decomposition`, `modular-design-principles`, `react-composition-patterns`, `tactical-ddd`).
    - **Имена → из frontmatter `name:`**, директории = `name` в kebab-case. Никаких переименований/префиксов.
    - **Vitest exclude:** добавлен `.agents/skills/**` в `vite.config.ts` → `test.exclude`, чтобы исключить upstream-ские `.cjs` test-файлы из `npm test`.
    - **Проверки:** `npm run lint` ✓ (0 err, 1 допустимый warn в `button.tsx`), `npm run typecheck` ✓, `npm test` 20/20 ✓, валидация frontmatter 43/43 (все SKILL.md имеют `--- ---`, `name:`, `description:`).
    - **Известные мелочи:** 3 скила имеют description чуть выше рекомендованных 1024 chars (`evolutionary-modular-architecture` ~1069, `not-your-babysitter` ~1066, `tlc-spec-driven` ~1060 — описания upstream-а, не правлены).

## Что осталось (следующие шаги)

- [ ] Реализовать `GET /api/bookings` (для панели организатора)
- [ ] Обновить `README.md`: установка, запуск, примеры, asciinema
- [ ] Транзакция / уникальный индекс на `bookings.slotId` — закрыть race condition
- [ ] Экран успеха («Встреча запланирована», сводка) вместо только тоста
- [ ] Поле «комментарий», телефон как опциональный (по спеке)
- [ ] Месячная сетка календаря, таймзоны, генерация слотов по правилам доступности
- [ ] Создать Web Service/Blueprint на Render (код готов и запушен; Free — сервис засыпает, SQLite эфемерна)

## Ключевые решения

| Решение | Выбор | Причина |
|---|---|---|
| Бэкенд | Fastify 5 | Современный, быстрый, встроенная валидация |
| ORM | Drizzle ORM | TypeScript-first, SQL-подобный, лёгкий |
| БД | SQLite (better-sqlite3) | Нулевая конфигурация, in-app файл |
| UI | shadcn/ui + Tailwind v3.4 | Хорошая поддержка coding-агентами |
| Тесты | Vitest 3 + React Testing Library | Нативная интеграция с Vite 6 |
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

## Окружение

- **ОС**: Windows 10 (win32)
- **Node.js**: v26.9.0
- **npm**: 11.19.1
- **better-sqlite3@13** — пресборки для win32-x64 + Node 26 доступны
