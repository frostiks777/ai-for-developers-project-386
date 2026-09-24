import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { toBookingWithSlot, toTimeSlot } from '@/api/mappers'
import { ApiError, api, call } from '@/api/sdk'
import { MonthCalendar } from '@/components/month-calendar'
import { TimeZoneSelect } from '@/components/timezone-select'
import { Button } from '@/components/ui/button'
import { host } from '@/config/host'
import type { BookingWithSlot, TimeSlot } from '@/types/booking'
import { defaultTimeZone, formatDateTimeInZone, toDateKeyInZone } from '@/utils/timezone'

export default function ReschedulePage() {
  const { token } = useParams<{ token: string }>()

  const [booking, setBooking] = useState<BookingWithSlot | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timeZone, setTimeZone] = useState(defaultTimeZone)
  const [reschedulingId, setReschedulingId] = useState<number | null>(null)
  const [result, setResult] = useState<BookingWithSlot | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      setLoadError('Некорректная ссылка переноса')
      return
    }

    setIsLoading(true)

    try {
      const current = await call(api.bookingsClient.getBooking(token))
      const allSlots = await call(
        api.listSlots(current.hostSlug, { eventTypeId: current.eventTypeId }),
      )

      setBooking(toBookingWithSlot(current))
      setSlots(allSlots.slots.map(toTimeSlot))
      setLoadError(null)
    } catch {
      setLoadError('Бронь не найдена или ссылка недействительна')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const freeSlots = slots.filter((slot) => !slot.isBooked)
  const slotDates = freeSlots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone))
  const activeDate =
    selectedDate !== null && slotDates.includes(selectedDate)
      ? selectedDate
      : (slotDates[0] ?? null)
  const visibleSlots = activeDate
    ? freeSlots.filter((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone) === activeDate)
    : freeSlots

  const handleReschedule = async (slotId: number, startAt: string) => {
    if (!token) {
      return
    }

    setReschedulingId(slotId)

    try {
      const updated = await call(api.bookingsClient.rescheduleBooking(token, { startAt }))
      setResult(toBookingWithSlot(updated))
      toast.success('Встреча перенесена')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось перенести встречу')
    } finally {
      setReschedulingId(null)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Перенос встречи</h1>
        <Link
          to={`/book/${host.slug}`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          К странице бронирования
        </Link>
      </header>

      {isLoading && <p>Загрузка…</p>}

      {!isLoading && loadError && <p className="text-destructive">{loadError}</p>}

      {!isLoading && result && (
        <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Встреча перенесена</h2>
          <p className="mt-2 text-muted-foreground">
            Новое время: {formatDateTimeInZone(result.startAt, timeZone)} ({result.durationMin} мин)
          </p>
          <Button className="mt-6" asChild>
            <Link to={`/book/${host.slug}`}>К списку слотов</Link>
          </Button>
        </section>
      )}

      {!isLoading && !loadError && !result && booking && (
        <>
          <p className="mb-6 text-muted-foreground">
            Текущее время: {formatDateTimeInZone(booking.startAt, timeZone)} ({booking.durationMin}{' '}
            мин). Выберите новое время ниже.
          </p>

          <div className="mb-6 sm:max-w-xs">
            <TimeZoneSelect value={timeZone} onChange={setTimeZone} />
          </div>

          {freeSlots.length === 0 ? (
            <p>Нет доступных слотов для переноса</p>
          ) : (
            <div className="grid gap-6">
              <MonthCalendar
                slots={freeSlots}
                selectedDate={activeDate ?? ''}
                timeZone={timeZone}
                onSelectDate={setSelectedDate}
              />
              <ul className="grid gap-4 sm:grid-cols-2">
                {visibleSlots.map((slot) => (
                  <li
                    key={slot.id}
                    className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
                  >
                    <p className="font-medium">{formatDateTimeInZone(slot.startAt, timeZone)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Длительность: {slot.durationMin} мин
                    </p>
                    <Button
                      className="mt-4"
                      disabled={reschedulingId !== null}
                      onClick={() => handleReschedule(slot.id, slot.startAt)}
                    >
                      {reschedulingId === slot.id ? 'Перенос…' : 'Перенести сюда'}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
