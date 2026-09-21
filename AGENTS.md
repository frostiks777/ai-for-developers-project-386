# AGENTS.md

## Project
Hexlet "AI for Developers" course project: **Календарь звонков** (Call Calendar) — a call booking service.
- Spec: https://files.hexlet.app/a/2ipc5m
- Repo has skeleton: backend (Fastify + SQLite), frontend (React + Vite), docs.

## Critical constraints
- **DO NOT edit or delete** `.github/workflows/hexlet-check.yml` or the repo name — they drive automated Hexlet tests on every push.

## Stack
- Runtime: Node.js
- Language: TypeScript (strict mode)
- Bundler: Vite 6
- UI: shadcn/ui + Tailwind CSS 3.4
- API: Fastify 5 (порт 3000, vite proxy `/api`)
- БД: SQLite + Drizzle ORM 0.45
- Тесты: Vitest 3 + React Testing Library
- Линтеры: ESLint 9 (flat config), Prettier

## Directory structure
├── src/
│   ├── components/    # UI-компоненты (shadcn/ui)
│   ├── pages/         # Маршруты/страницы
│   ├── hooks/         # Кастомные хуки
│   ├── utils/         # Утилиты
│   ├── types/         # TypeScript-типы
│   ├── api/           # API-клиент
│   ├── lib/           # cn() и прочее
│   ├── test/          # setup тестов
│   └── main.tsx       # Точка входа
├── server/
│   ├── index.ts       # Fastify: /health, /api/slots, /api/bookings
│   ├── types.ts       # Типы API
│   └── db/            # Drizzle schema + клиент
├── docs/              # Документация проекта
│   ├── architecture.md
│   ├── conventions.md
│   ├── agent-principles.md
│   ├── Структура проекта.md
│   └── Каркас приложения.md
├── public/            # Статика
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
└── AGENTS.md

## Commands
- `npm run dev` — запуск dev-сервера (Vite, :5173)
- `npm run server:dev` — запуск бэкенда (Fastify, :3000)
- `npm run build` — продакшн-сборка
- `npm run lint` — проверка ESLint
- `npm run typecheck` — проверка типов (tsc --noEmit)
- `npm test` — запуск тестов (Vitest)
- `npm run db:generate` — генерация миграций Drizzle
- `npm run db:push` — push схемы в БД

## Conventions
- Язык проекта: русский (README, комментарии — по необходимости)
- Именование файлов: kebab-case (`user-card.tsx`)
- Именование компонентов: PascalCase (`UserCard`)
- Экспорт: именованные экспорты; дефолтные — только для страниц
- Стилизация: Tailwind CSS, избегать инлайн-стилей
- Типы: interface/type для пропсов компонентов
- Коммиты: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Модели: бесплатные модели для субагентов (КРИТИЧНО)

**Все субагенты обязаны использовать ТОЛЬКО бесплатные модели.** Это строгое правило проекта.

- При вызове `subagent(...)` **никогда не указывайте параметр `model` с платной моделью**
- Дефолтная модель субагентов задана в `opencode.jsonc` и является бесплатной
- Если нужно явно указать модель — используйте только бесплатные ID:
  - `opencode/muse-spark-1.3-contributor-free`
  - `opencode/ling-3.0-flash-fin-free`
  - `opencode/nemotron-3.5-lightning-free`
  - `opencode/mimo-v2.5-free`
- **Запрещено**: `anthropic/*`, `openai/*` и любые другие платные модели для субагентов
- Подробнее: `docs/model-usage.md`

## Documentation
Папка `docs/` содержит теоретические принципы и архитектурные решения проекта:
- `architecture.md` — архитектура приложения, структура модулей, зависимости
- `conventions.md` — детальные конвенции кодирования (стиль, паттерны, примеры)
- `agent-principles.md` — принципы работы coding-агента, управление контекстом, execution loop, надежность
- `Структура проекта.md` — теория архитектуры агентной системы (урок Hexlet)
- `Каркас приложения.md` — требования шага 2 проекта
- `model-usage.md` — правила использования бесплатных моделей для субагентов

При внесении изменений — сверяться с документацией в `docs/`.

## Coding patterns
- Все компоненты — функциональные, с типизацией пропсов
- Хуки → `src/hooks/`, утилиты → `src/utils/`
- API-вызовы → отдельный слой (`src/api/`)
- shadcn/ui компоненты хранить в `src/components/ui/`

## Agent behavior
- При изменении файлов — проверять типы (`npm run typecheck`) и линтер (`npm run lint`)
- Не коммитить без проверки: `git status` → `git diff` → `git commit`
- При работе с UI — сверяться с existing компонентами в `src/components/`
- При добавлении зависимостей — обновлять `package.json` и `package-lock.json`
- Запуск тестов перед коммитом: `npm test`
- Перед крупными изменениями — изучить соответствующий файл в `docs/`
