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
- Валидация: zod 4 (схемы-зеркала: `server/validation.ts` ↔ `src/lib/validation.ts`)
- Тесты: Vitest 4 + React Testing Library (API — `server/app.test.ts`, `app.inject()`, in-memory БД)
- Линтеры: ESLint 9 (flat config), Prettier

## Directory structure
├── src/
│   ├── components/    # UI-компоненты (shadcn/ui)
│   ├── pages/         # Маршруты/страницы
│   ├── hooks/         # Кастомные хуки
│   ├── utils/         # Утилиты
│   ├── types/         # TypeScript-типы
│   ├── api/           # API-клиент
│   ├── lib/           # cn(), zod-схемы (validation.ts)
│   ├── test/          # setup тестов
│   └── main.tsx       # Точка входа
├── server/
│   ├── index.ts       # Точка входа: buildApp() + listen
│   ├── app.ts         # Фабрика Fastify: /health, /api/*, статика dist/
│   ├── validation.ts  # zod-схема API (зеркало src/lib/validation.ts)
│   ├── types.ts       # Типы API
│   └── db/            # Drizzle schema + клиент (DATABASE_PATH)
├── docs/              # Документация проекта
│   ├── architecture.md
│   ├── conventions.md
│   ├── agent-principles.md
│   ├── model-usage.md
│   ├── Структура проекта.md
│   └── Каркас приложения.md
├── docs/adr/          # Architecture Decision Records (ADR-0001, …)
├── docs/agents/       # Конфиг скиллов: issue-tracker / triage-labels / domain
├── public/            # Статика
├── .agents/
│   └── skills/        # OpenCode SKILL.md (commit-push, interview, plan, ponytail, tdd, verify)
├── MEMORY.md          # Долгосрочное состояние проекта между сессиями
├── skills-lock.json   # Манифест установленных скиллов (mattpocock/skills)
├── opencode.jsonc     # Конфигурация opencode (модели, MCP, субагенты)
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
- Если нужно явно указать модель — используйте только бесплатные ID (провайдер `opencode`; полный список и OpenRouter — в [`docs/model-usage.md`](docs/model-usage.md)):
  - `opencode/muse-spark-1.3-contributor-free`
  - `opencode/ling-3.0-flash-fin-free`
  - `opencode/nemotron-3.5-lightning-free`
  - `opencode/mimo-v2.6-flash-free`
  - `opencode/big-pickle`
- **Запрещено**: `anthropic/*`, `openai/*` и любые другие платные модели для субагентов
- Подробнее: `docs/model-usage.md`

## Documentation
Папка `docs/` содержит теоретические принципы, архитектурные решения и операционные руководства проекта:
- `architecture.md` — архитектура приложения, структура модулей, зависимости
- `conventions.md` — детальные конвенции кодирования (стиль, паттерны, примеры)
- `agent-principles.md` — принципы работы coding-агента, управление контекстом, execution loop, надежность
- `Структура проекта.md` — теория архитектуры агентной системы (урок Hexlet)
- `Каркас приложения.md` — требования шага 2 проекта
- `model-usage.md` — правила использования бесплатных моделей для субагентов
- `code_artifact.md` — ТЗ и логика реализации (спека Hexlet)
- `todo.md` — текущий roadmap и расхождения со спекой
- `ci_cd.md` — руководство по CI/CD-пайплайну в Google Cloud Run
- `ci_cd_render.md` — руководство по бесплатному деплою на Render.com
- `adr/` — Architecture Decision Records (см. `docs/adr/README.md`)
- `mcp.md` — подключённые MCP-серверы и правила работы с ними (если создаётся в § D.2 плана)

При внесении изменений — сверяться с документацией в `docs/`. При принятии архитектурного решения — добавить ADR (шаблон в `docs/adr/template.md`).

## Coding patterns
- Все компоненты — функциональные, с типизацией пропсов
- Хуки → `src/hooks/`, утилиты → `src/utils/`
- API-вызовы → отдельный слой (`src/api/`)
- shadcn/ui компоненты хранить в `src/components/ui/`

## Agent skills

Набор инженерных скиллов [mattpocock/skills](https://github.com/mattpocock/skills) установлен в `.agents/skills/` (`npx skills@latest add mattpocock/skills --agent '*' -y`) и настроен под репозиторий через `setup-matt-pocock-skills`.

### Issue tracker

Задачи и спецификации живут в GitHub Issues этого репозитория (через `gh` CLI). См. `docs/agents/issue-tracker.md`.

### Triage labels

Используются пять канонических меток по умолчанию (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). См. `docs/agents/triage-labels.md`.

### Domain docs

Один контекст (single-context): `CONTEXT.md` + `docs/adr/` в корне репозитория. См. `docs/agents/domain.md`.

## Skills (OpenCode)

OpenCode-скилы — повторно используемые workflow, которые агент подгружает через `skill` tool по триггер-фразам в `description`.

- Расположение: `.agents/skills/<name>/SKILL.md`. Одна директория на скил + YAML frontmatter (`name`, `description` обязательны, `description` ≤ 1024 символов).
- Текущие скилы:
  - `commit-push` — workflow для коммита и пуша (lint + typecheck + тесты → Conventional Commits → push).
  - `interview` — задаёт 3–7 уточняющих вопросов до начала работы над нетривиальной задачей.
  - `plan` — превращает задачу в атомарный пронумерованный чек-лист с проверками.
  - `ponytail` — принудительная проверка «можно ли решить без нового кода/зависимости/абстракции». *(Файл есть в `.agents/skills/`; в текущей версии opencode id не активируется через `skill` tool — содержимое всё равно служит справочником.)*
  - `tdd` — сначала failing-тест, потом минимум кода для зелёного, потом рефакторинг.
  - `verify` — финальный прогон `lint`/`typecheck`/`test`/`build` перед отметкой задачи как «готово».
- Чтобы добавить новый скил: создать `.agents/skills/<имя>/SKILL.md`; имя в frontmatter должно совпадать с именем директории.
- В этом проекте используем **только** `.agents/skills/`. `.opencode/skills/` и `.claude/skills/` больше не применять.
- Порядок применения процессных скиллов: `interview` → `plan` → (`ponytail` по ситуации) → `tdd` по ситуации → `verify` → `commit-push`.
- Подробнее — https://opencode.ai/docs/skills/.

## Agent behavior
- При изменении файлов — проверять типы (`npm run typecheck`) и линтер (`npm run lint`)
- Не коммитить без проверки: `git status` → `git diff` → `git commit`
- При работе с UI — сверяться с existing компонентами в `src/components/`
- При добавлении зависимостей — обновлять `package.json` и `package-lock.json`
- Запуск тестов перед коммитом: `npm test`
- Перед крупными изменениями — изучить соответствующий файл в `docs/`
- **Сверка с архитектурными решениями:** перед изменением схемы БД, API-контракта, аутентификации, деплоя или иного трудно обратимого решения — прочитать релевантный ADR в [`docs/adr/`](docs/adr/README.md) и `MEMORY.md`; в коммите указать, какой ADR затронут, а для нового решения — добавить ADR по `docs/adr/template.md`.

## Hygiene of context window

- **Правило 2 итераций:** если после двух последовательных неудачных правок одна и та же проверка (`npm run lint` / `typecheck` / `test` / `build`) всё ещё красная — остановиться и:
  1. Сформулировать, чем текущий подход плох (одно предложение).
  2. Сформулировать альтернативный подход (одно предложение).
  3. Спросить пользователя через `question(...)`, каким путём идти (или вернуться к скиллу `interview`).
- **Контекст не жалко.** Если диалог раздулся и прогресс нулевой — предложить `/compact` либо начать новый чат, приложив ссылку на ключевые артефакты (`AGENTS.md`, `MEMORY.md`, `docs/adr/*.md`).
- **Файлы-договорённости** — единственный долгосрочный носитель контекста между сессиями: `AGENTS.md`, `MEMORY.md`, `docs/`, `docs/adr/`. То, что не записано туда — будет утеряно при следующем `/compact`.

## Long-term memory

- Состояние проекта между сессиями — в `MEMORY.md` (корень). Обновлять при: изменении стека, критичных фиксах, решении ADR, завершении шага курса.
- Архитектурные решения — в `docs/adr/` (см. `docs/adr/README.md`): один ADR = одно решение. Шаблон — `docs/adr/template.md`.
- Перед началом крупной задачи: прочитать `MEMORY.md` → понять текущее состояние → при наличии релевантного ADR — прочитать его.
- После завершения задачи: обновить `MEMORY.md` (раздел «Что сделано» / «Ключевые решения»), при архитектурном сдвиге — добавить ADR.

## Safety gates

- **Read-only в «проде»:** если окружение помечено как production / staging (`NODE_ENV=production`, явный деплой на удалённый сервер) — агенту разрешены **только** операции чтения: `git log`, чтение файлов, `curl` к запущенному сервису. **Запрещены:** `write` в удалённые репозитории, миграции БД, удаление файлов вне `dist/`.
- **Human-in-the-loop:** ручное применение миграций к существующей БД (`npm run db:push` поверх реальных данных), force-push, изменения `.github/workflows/hexlet-check.yml` и имени репозитория, `git reset --hard` — **только по явной просьбе пользователя**. Перед выполнением — показать команду и последствия в чате.
- **Деструктивные операции** (`rm -rf`, `git push --force-with-lease`, перезапись `MEMORY.md`, удаление ADR) — всегда показывать diff/dry-run и ждать подтверждения.
- **Секреты:** никогда не писать токены/ключи/пароли в код или коммиты. Использовать `.env` + `.env.example` (последний — в репо, первый — в `.gitignore`, что уже сделано).

## Notifications to the user (Windows toast)

Пользователь просит уведомлять его системным тостом **только в двух случаях** (не «просто так»):
1. **Нужно решение пользователя** — агент упёрся в вопрос/выбор/блокер и ждёт ответа (вопрос через `question(...)`, неоднозначность, красная проверка после двух итераций и т.п.).
2. **Успешный релиз в git** — сделан push, CI/деплой «взлетел», задача доведена до конца и запушена.

Отправка выполняется скриптом `scripts/notify.ps1` (требуется UTF-8 **с BOM**, иначе PowerShell 5.1 ломает кириллицу).

Запуск:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/notify.ps1 "Заголовок" "Текст"
```

Правила:
- **Не слать на каждый шаг** и не слать просто так — только случаи 1 и 2 выше.
- Текст — короткий, по-русски, без секретов.
- Скрипт использует WinRT-тип `Windows.UI.Notifications` — его видит только `powershell.exe` (5.1); `pwsh` 7 без projection падает с «Unable to find type».
