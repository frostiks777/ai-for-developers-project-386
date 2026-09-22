# MEMORY.md — Состояние проекта «Календарь звонков»

> Дата последнего обновления: 2026-09-22 (sync #2: каталог вырос 16→133)

## Текущее состояние

Проект находится на шаге 2 курса Hexlet "ИИ для разработчиков" — **Каркас приложения**.
Создан и установлен скелет: бэкенд (Fastify + Drizzle ORM + SQLite), фронтенд (React 18 + TypeScript + Vite + shadcn/ui), документация, конфиги.

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
│   ├── types/booking.ts      ✅ TimeSlot, Booking, CreateBookingBody
│   ├── api/client.ts         ✅ fetchSlots, createBooking
│   ├── hooks/use-availability.ts ✅ (no-unsafe-finally исправлен)
│   ├── pages/home-page.tsx   ✅
│   ├── components/ui/button.tsx ✅ shadcn Button
│   └── test/setup.ts         ✅ jest-dom/vitest
├── server/
│   ├── index.ts              ✅ Fastify: /health, /api/*, статика dist/ (SPA)
│   ├── types.ts              ✅ TimeSlot, Booking, CreateBookingBody
│   ├── db/schema.ts          ✅ Drizzle: slots, bookings
│   ├── db/index.ts           ✅ клиент БД + авто-сид слотов
│   └── README.md             ✅
├── docs/
│   ├── architecture.md       ✅
│   ├── conventions.md        ✅
│   ├── agent-principles.md   ✅
│   ├── Структура проекта.md  ✅ (теория агентов)
│   ├── Каркас приложения.md  ✅ (требования шага 2)
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
  "tailwindcss": "^3.4.17"
}
```

## Результаты проверок

```
✅ typecheck: tsc --noEmit — чисто
✅ lint: 0 ошибок, 1 warning (buttonVariants — допустимо)
✅ test: 6/6 passed (2 файла, vitest 3.2.7)
✅ build: vite v6.4.3 — 250.57 kB JS (gzip 80.12), 15.98 kB CSS
✅ smoke (prod): PORT=3100, /health 200, / 200 (index.html), SPA fallback 200, /api/slots 200
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

## Что осталось (следующие шаги)

- [ ] Реализовать функциональность бронирования (сейчас onClick — console.log)
- [ ] Добавить форму бронирования (name, phone) — модалка или отдельная страница
- [ ] Подключить POST /api/bookings к фронтенду
- [ ] Добавить страницу «Мои бронирования»
- [ ] Добавить JWT-аутентификацию (если требуется по спеке)
- [ ] Написать интеграционные тесты API (Vitest + supertest/fastify.inject)
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
| Процессные скиллы | [.agents/skills/](.agents/skills/) — `commit-push`, `interview`, `plan`, `ponytail`, `tdd`, `verify` | Повторно используемые workflow через `skill` tool по триггер-фразам |
| MCP для UI | [`@shadcn/ui/mcp`](docs/mcp.md) через `opencode.jsonc` → `mcp.shadcn` | Доступ к каталогу компонентов через `components.json` |
| Деплой | Render.com (Docker, Free) | Бесплатно без карты; план GCP (`docs/ci_cd.md`) не используется |
| Фронт в проде | `@fastify/static` раздаёт `dist/` из Fastify | Один контейнер, same-origin `/api` без CORS |
| Порт в проде | `process.env.PORT` (fallback 3000) | Требование Render; хост `0.0.0.0` |

## Окружение

- **ОС**: Windows 10 (win32)
- **Node.js**: v26.9.0
- **npm**: 11.19.1
- **better-sqlite3@13** — пресборки для win32-x64 + Node 26 доступны
