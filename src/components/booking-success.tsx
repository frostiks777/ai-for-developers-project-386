import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Booking, TimeSlot } from '@/types/booking'
import { buildIcs, downloadIcs, googleCalendarUrl } from '@/utils/calendar'
import { formatDateTimeInZone } from '@/utils/timezone'

interface BookingSuccessProps {
  booking: Booking
  slot: TimeSlot
  timeZone: string
  onReset: () => void
}

const endTimeFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('ru-RU', { timeZone, hour: '2-digit', minute: '2-digit' })

function formatTimeRange(slot: TimeSlot, timeZone: string): string {
  const start = new Date(slot.startAt)
  const end = new Date(start.getTime() + slot.durationMin * 60 * 1000)
  const startLabel = formatDateTimeInZone(slot.startAt, timeZone)
  const endLabel = endTimeFormatter(timeZone).format(end)

  return `${startLabel} — ${endLabel}`
}

export function BookingSuccess({ booking, slot, timeZone, onReset }: BookingSuccessProps) {
  return (
    <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" onClick={onReset}>
        <ArrowLeft className="size-4" />
        Назад
      </Button>

      <h2 className="text-2xl font-semibold tracking-tight">Встреча успешно запланирована!</h2>

      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Когда:</dt>
          <dd>{formatTimeRange(slot, timeZone)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Длительность:</dt>
          <dd>{slot.durationMin} мин</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Имя:</dt>
          <dd>{booking.name}</dd>
        </div>
        {booking.phone && (
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Телефон:</dt>
            <dd>{booking.phone}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Email:</dt>
          <dd>{booking.email}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => downloadIcs(`booking-${booking.id}.ics`, buildIcs(booking, slot))}
        >
          Скачать .ics
        </Button>
        <Button variant="outline" asChild>
          <a href={googleCalendarUrl(booking, slot)} target="_blank" rel="noreferrer">
            Добавить в Google Календарь
          </a>
        </Button>
        <Button onClick={onReset}>Выбрать другое время</Button>
      </div>
    </section>
  )
}