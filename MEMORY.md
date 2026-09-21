# MEMORY.md — Состояние проекта «Календарь звонков»

> Дата последнего обновления: 2026-09-21

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
│   ├── index.ts              ✅ Fastify: /health, /api/slots, /api/bookings
│   ├── types.ts              ✅ TimeSlot, Booking, CreateBookingBody
│   ├── db/schema.ts          ✅ Drizzle: slots, bookings
│   ├── db/index.ts           ✅ клиент БД + авто-сид слотов
│   └── README.md             ✅
├── docs/
│   ├── architecture.md       ✅
│   ├── conventions.md        ✅
│   ├── agent-principles.md   ✅
│   ├── Структура проекта.md  ✅ (теория агентов)
│   └── Каркас приложения.md  ✅ (требования шага 2)
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
✅ test: 1/1 passed (vitest 3.2.7, 259ms)
✅ build: vite v6.4.3 — 171.52 kB JS, 9.91 kB CSS (2.64s)
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

## Что осталось (следующие шаги)

- [ ] Реализовать функциональность бронирования (сейчас onClick — console.log)
- [ ] Добавить форму бронирования (name, phone) — модалка или отдельная страница
- [ ] Подключить POST /api/bookings к фронтенду
- [ ] Добавить страницу «Мои бронирования»
- [ ] Добавить JWT-аутентификацию (если требуется по спеке)
- [ ] Написать интеграционные тесты API (Vitest + supertest/fastify.inject)

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

## Окружение

- **ОС**: Windows 10 (win32)
- **Node.js**: v26.9.0
- **npm**: 11.19.1
- **better-sqlite3@13** — пресборки для win32-x64 + Node 26 доступны
