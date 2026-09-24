import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{
  title: "Call Calendar API",
})
@server("http://localhost:3000", "Local development")
namespace CallCalendar;

// ---------------------------------------------------------------------------
// Скаляры и общие модели
// ---------------------------------------------------------------------------

/** Локальное время хоста без смещения (YYYY-MM-DDTHH:mm), всегда с полем timeZone (IANA). */
@format("date-time-local")
scalar LocalDateTime extends string;

/** Локальная дата (YYYY-MM-DD) в поясе хоста. */
@format("date")
scalar LocalDate extends string;

alias HostSlug = string;

enum LocationType {
  online,
  offline,
  phone,
}

enum BookingStatus {
  confirmed,
  cancelled,
}

/** Единая модель ошибки для всех не-2xx ответов. */
model ApiError {
  @doc("Код ошибки для программной обработки.")
  code: ErrorCode;
  @doc("Человекочитаемое сообщение.")
  message: string;
  @doc("Дополнительные детали (например, ошибки полей).")
  details?: Record<unknown>;
}

union ErrorCode {
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "SLOT_TAKEN",
  "CONFLICT",
}

/** Публичные настройки организатора по slug. */
model HostSettings {
  slug: HostSlug;
  name: string;
  @doc("IANA-пояс хоста, например Europe/Moscow.")
  timeZone: string;
}

// ---------------------------------------------------------------------------
// Типы встреч
// ---------------------------------------------------------------------------

model EventType {
  id: string;
  slug: string;
  title: string;
  description?: string;
  @doc("Длительность встречи в минутах (MVP: 30).")
  durationMin: int32;
  locationType: LocationType;
  @doc("Активен ли тип для записи гостем.")
  isActive: boolean;
}

model CreateEventTypeRequest {
  slug: string;
  title: string;
  description?: string;
  durationMin: int32;
  locationType: LocationType;
  isActive?: boolean;
}

model UpdateEventTypeRequest {
  title?: string;
  description?: string;
  durationMin?: int32;
  locationType?: LocationType;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Доступность
// ---------------------------------------------------------------------------

/** Непрерывный интервал записи внутри дня недели (минуты от полуночи, пояс хоста). */
model AvailabilityRange {
  @doc("День недели: 1 — понедельник, 7 — воскресенье.")
  @minValue(1)
  @maxValue(7)
  weekday: int32;
  @minValue(0)
  @maxValue(1440)
  startMinute: int32;
  @minValue(0)
  @maxValue(1440)
  endMinute: int32;
}

model AvailabilitySettings {
  timeZone: string;
  slotDurationMin: int32;
  bufferMin: int32;
  minNoticeMin: int32;
  horizonDays: int32;
  ranges: AvailabilityRange[];
}

model UpdateAvailabilityRequest {
  timeZone?: string;
  slotDurationMin?: int32;
  bufferMin?: int32;
  minNoticeMin?: int32;
  horizonDays?: int32;
  ranges?: AvailabilityRange[];
}

// ---------------------------------------------------------------------------
// Слоты
// ---------------------------------------------------------------------------

model Slot {
  @doc("Идентификатор слота (используется до перехода брони на startAt).")
  id: int32;
  @doc("Начало слота в локальном времени хоста.")
  startAt: LocalDateTime;
  durationMin: int32;
  @doc("Свободен ли слот для записи активной бронью.")
  available: boolean;
}

model AvailabilityDay {
  @doc("Дата фильтра, если была запрошена.")
  date?: LocalDate;
  @doc("IANA-пояс, к которому относятся startAt слотов.")
  timeZone: string;
  slots: Slot[];
}

// ---------------------------------------------------------------------------
// Бронирования
// ---------------------------------------------------------------------------

model Booking {
  @doc("UUID — публичный идентификатор для ссылок отмены и переноса.")
  id: string;
  hostSlug: HostSlug;
  eventTypeId: string;
  @doc("Начало встречи в локальном времени хоста.")
  startAt: LocalDateTime;
  endAt: LocalDateTime;
  timeZone: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
  status: BookingStatus;
  createdAt: string;
}

model CreateBookingRequest {
  eventTypeId: string;
  @doc("Желаемое начало слота в локальном времени хоста.")
  startAt: LocalDateTime;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
}

model RescheduleBookingRequest {
  @doc("Новое начало слота в локальном времени хоста.")
  startAt: LocalDateTime;
}

// ---------------------------------------------------------------------------
// Операции
// ---------------------------------------------------------------------------

@route("/api/v1")
namespace ApiV1 {
  @route("/hosts/{slug}/settings")
  @get
  op getHostSettings(@path slug: HostSlug): HostSettings | ApiError;

  @route("/hosts/{slug}/event-types")
  namespace EventTypes {
    @get
    op listEventTypes(@path slug: HostSlug): EventType[] | ApiError;

    @post
    op createEventType(
      @path slug: HostSlug,
      @body body: CreateEventTypeRequest,
    ): EventType | ApiError;

    @route("/{eventTypeId}")
    @patch
    op updateEventType(
      @path slug: HostSlug,
      @path eventTypeId: string,
      @body body: UpdateEventTypeRequest,
    ): EventType | ApiError;

    @route("/{eventTypeId}")
    @delete
    op deleteEventType(
      @path slug: HostSlug,
      @path eventTypeId: string,
    ): void | ApiError;
  }

  @route("/hosts/{slug}/availability")
  namespace Availability {
    @get
    op getAvailability(@path slug: HostSlug): AvailabilitySettings | ApiError;

    @put
    op updateAvailability(
      @path slug: HostSlug,
      @body body: UpdateAvailabilityRequest,
    ): AvailabilitySettings | ApiError;
  }

  @route("/hosts/{slug}/slots")
  @get
  op listSlots(
    @path slug: HostSlug,
    @query date: LocalDate,
    @query eventTypeId?: string,
  ): AvailabilityDay | ApiError;

  @route("/hosts/{slug}/bookings")
  namespace HostBookings {
    @get
    op listHostBookings(@path slug: HostSlug): Booking[] | ApiError;

    @post
    op createBooking(
      @path slug: HostSlug,
      @body body: CreateBookingRequest,
    ): Booking | ApiError;
  }

  @route("/bookings/{bookingId}")
  namespace Bookings {
    @get
    op getBooking(@path bookingId: string): Booking | ApiError;

    @route("/cancel")
    @post
    op cancelBooking(@path bookingId: string): Booking | ApiError;

    @route("/reschedule")
    @post
    op rescheduleBooking(
      @path bookingId: string,
      @body body: RescheduleBookingRequest,
    ): Booking | ApiError;
  }
}
