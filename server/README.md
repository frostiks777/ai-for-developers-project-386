# Бэкенд «Календарь звонков»

Fastify 5 + Drizzle ORM + better-sqlite3. Точка входа — `server/index.ts`.

## Запуск

```bash
npm run server:dev
```

Сервер поднимется на `http://localhost:3000` (слушает `0.0.0.0`), перезапускается при изменении файлов (tsx watch).

## Эндпоинты

### `GET /health` — проверка живости

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### `GET /api/slots` — список слотов (отсортирован по `startAt`)

```bash
curl http://localhost:3000/api/slots
# [{"id":1,"startAt":"2026-09-21T07:00:00.000Z","durationMin":30,"isBooked":false}, ...]
```

### `POST /api/bookings` — бронирование слота

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"slotId":1,"name":"Иван","email":"ivan@example.com","phone":"+79001234567"}'
# 201 {"id":1,"slotId":1,"name":"Иван","phone":"+79001234567","email":"ivan@example.com","comment":null,"createdAt":"2026-09-21 12:00:00"}
```

`phone` и `comment` — необязательные поля. Пустой `phone` сохраняется как `null`.

Ошибки:

- `400 { "error": "Невалидное тело запроса" }` — slotId не положительное целое, пустое name, невалидные email/phone
- `404 { "error": "Слот не найден" }` — слота с таким id нет
- `409 { "error": "Слот уже занят" }` — на слот уже есть бронь

## База данных

Файл БД: `server/data/app.db` (создаётся автоматически вместе с каталогом).

При старте сервера таблицы создаются через `CREATE TABLE IF NOT EXISTS`, поэтому скелет работает без миграций. Если таблица `slots` пуста — автоматически сидятся 8 слотов: ближайшие 4 дня, 10:00 и 15:00, длительность 30 минут.

## Миграции

Схема — `server/db/schema.ts`, конфиг — `drizzle.config.ts` в корне проекта.

```bash
npm run db:generate  # сгенерировать миграции в server/db/migrations по изменениям схемы
npm run db:push      # применить схему к БД напрямую (prototyping)
```
