# TODO: план развития проекта

Аудит соответствия `docs/code_artifact.md` (спека Hexlet) и текущего MVP.
Репозиторий реализует упрощённый вариант на стеке из `AGENTS.md` (Vite + Fastify + SQLite + Drizzle); отклонение от спеки зафиксировано в `docs/architecture.md`.

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

## Осталось

### Low

- [ ] Таблицы `hosts` и эндпоинты `GET /api/v1/hosts/:slug/...` (мульти-хост + версионирование API)
- [ ] `422` вместо `400` на невалидное тело (по спеке) или зафиксировать отклонение
- [ ] `.ics` / Google Calendar и ссылка отмены на экране успеха
- [ ] Авторизация `/dashboard` (сейчас панель публична)

## Ключевые расхождения со спекой

1. **Схема БД**: есть `availability_rules` (одна строка, один хост), нет `hosts`, статусов и диапазонов времени по дням; правила доступности — персистентны, [ADR-0005](adr/0005-dashboard-availability-and-cancellation.md).
2. **API**: нет версионирования `/api/v1`, хостов, фильтра по дате; тело брони другое, отмена реализована как `DELETE /api/bookings/:id`.
3. **Форма**: email (обяз.) добавлен, телефон валидируется по формату и теперь опционален (как допускает спека); нет telegram.
4. **Экраны**: `/dashboard` реализован (список, отмена, настройки, без auth); нет `/book/:hostId`.