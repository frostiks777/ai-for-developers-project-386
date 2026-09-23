import { Button } from '@/components/ui/button'
import type { Booking, TimeSlot } from '@/types/booking'

interface BookingSuccessProps {
  booking: Booking
  slot: TimeSlot
  onReset: () => void
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

function formatTimeRange(slot: TimeSlot): string {
  const start = new Date(slot.startAt)
  const end = new Date(start.getTime() + slot.durationMin * 60 * 1000)

  return `${dateFormatter.format(start)}, ${timeFormatter.format(start)} — ${timeFormatter.format(end)}`
}

export function BookingSuccess({ booking, slot, onReset }: BookingSuccessProps) {
  return (
    <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight">Встреча успешно запланирована!</h2>

      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Когда:</dt>
          <dd>{formatTimeRange(slot)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Длительность:</dt>
          <dd>{slot.durationMin} мин</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Имя:</dt>
          <dd>{booking.name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Email:</dt>
          <dd>{booking.email}</dd>
        </div>
      </dl>

      <Button className="mt-6" onClick={onReset}>
        Выбрать другое время
      </Button>
    </section>
  )
}