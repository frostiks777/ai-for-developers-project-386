/**
 * A sequence of textual characters.
 */
export type String = string;
export interface EventType {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  /**
   * Длительность встречи в минутах (MVP: 30).
   */
  durationMin: number;
  locationType: LocationType;
  /**
   * Активен ли тип для записи гостем.
   */
  isActive: boolean;
}
/**
 * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
 */
export type Int32 = number;
/**
 * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
 */
export type Int64 = bigint;
/**
 * A whole number. This represent any `integer` value possible.
 * It is commonly represented as `BigInteger` in some languages.
 */
export type Integer = number;
/**
 * A numeric type
 */
export type Numeric = number;
export enum LocationType {
  Online = "online",
  Offline = "offline",
  Phone = "phone"
}
/**
 * Boolean with `true` and `false` values.
 */
export type Boolean = boolean;
/**
 * Тело ответа с ошибкой: конверт `{ error: ApiError }`.
 */
export interface ErrorResponse {
  error: ApiError;
}
/**
 * Единая модель ошибки для всех не-2xx ответов.
 */
export interface ApiError {
  /**
   * Код ошибки для программной обработки.
   */
  code: ErrorCode;
  /**
   * Человекочитаемое сообщение.
   */
  message: string;
  /**
   * Дополнительные детали (например, ошибки полей).
   */
  details?: Record<string, unknown>;
}
export type ErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "SLOT_TAKEN" | "CONFLICT";
export interface CreateEventTypeRequest {
  slug: string;
  title: string;
  description?: string;
  durationMin: number;
  locationType: LocationType;
  isActive?: boolean;
}
export interface UpdateEventTypeRequest {
  title?: string;
  description?: string;
  durationMin?: number;
  locationType?: LocationType;
  isActive?: boolean;
}
export interface AvailabilitySettings {
  timeZone: string;
  slotDurationMin: number;
  bufferMin: number;
  minNoticeMin: number;
  horizonDays: number;
  ranges: Array<AvailabilityRange>;
}
/**
 * Непрерывный интервал записи внутри дня недели (минуты от полуночи, пояс хоста).
 */
export interface AvailabilityRange {
  /**
   * День недели: 1 — понедельник, 7 — воскресенье.
   */
  weekday: number;
  startMinute: number;
  endMinute: number;
}
export interface UpdateAvailabilityRequest {
  timeZone?: string;
  slotDurationMin?: number;
  bufferMin?: number;
  minNoticeMin?: number;
  horizonDays?: number;
  ranges?: Array<AvailabilityRange>;
}
export interface Booking {
  /**
   * UUID — публичный идентификатор для ссылок отмены и переноса.
   */
  id: string;
  hostSlug: string;
  eventTypeId: string;
  /**
   * Начало встречи (UTC ISO 8601).
   */
  startAt: string;
  endAt: string;
  timeZone: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientNotes?: string | null;
  status: BookingStatus;
  /**
   * Причина отмены, если бронь отменена.
   */
  cancellationReason?: string | null;
  createdAt: string;
}
/**
 * Момент времени в UTC, ISO 8601 с миллисекундами и суффиксом `Z`; для отображения — поле timeZone (IANA).
 */
export type UtcDateTime = string;
export enum BookingStatus {
  Confirmed = "confirmed",
  Cancelled = "cancelled"
}
export interface CreateBookingRequest {
  eventTypeId: string;
  /**
   * Желаемое начало слота (UTC ISO 8601).
   */
  startAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
}
/**
 * Интервал, в который организатор не принимает записи.
 */
export interface TimeBlock {
  id: string;
  /**
   * Начало блокировки (UTC ISO 8601).
   */
  startAt: string;
  /**
   * Конец блокировки (UTC ISO 8601).
   */
  endAt: string;
  /**
   * Необязательная причина блокировки.
   */
  reason?: string | null;
  createdAt: string;
}
export interface CreateTimeBlockRequest {
  startAt: string;
  endAt: string;
  reason?: string;
}
export interface CancelBookingRequest {
  /**
   * Необязательная причина отмены.
   */
  reason?: string;
}
export interface RescheduleBookingRequest {
  /**
   * Новое начало слота (UTC ISO 8601).
   */
  startAt: string;
}
/**
 * Публичные настройки организатора по slug.
 */
export interface HostSettings {
  slug: string;
  name: string;
  /**
   * IANA-пояс хоста, например Europe/Moscow.
   */
  timeZone: string;
}
/**
 * Локальная дата (YYYY-MM-DD) в поясе хоста.
 */
export type LocalDate = string;
export interface AvailabilityDay {
  /**
   * Дата фильтра, если была запрошена.
   */
  date?: string | null;
  /**
   * IANA-пояс, к которому относятся startAt слотов.
   */
  timeZone: string;
  slots: Array<Slot>;
}
export interface Slot {
  /**
   * Идентификатор слота (используется до перехода брони на startAt).
   */
  id: number;
  /**
   * Начало слота (UTC ISO 8601).
   */
  startAt: string;
  durationMin: number;
  /**
   * Свободен ли слот для записи активной бронью.
   */
  available: boolean;
}
