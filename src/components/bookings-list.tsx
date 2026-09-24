import { Calendar, Mail, MessageSquare, Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { BookingWithSlot } from '@/types/booking'
import {
  defaultTimeZone,
  formatDayTitle,
  formatTimeInZone,
  toDateKeyInZone,
} from '@/utils/timezone'

interface BookingsListProps {
  bookings: BookingWithSlot[]
  onCancel: (booking: BookingWithSlot) => void
}

function endTimeIso(booking: BookingWithSlot): string {
  const end = new Date(new Date(booking.startAt).getTime() + booking.durationMin * 60_000)
  return end.toISOString()
}

function groupByDay(bookings: BookingWithSlot[]): Array<{ dateKey: string; items: BookingWithSlot[] }> {
  const groups = new Map<string, BookingWithSlot[]>()

  for (const booking of bookings) {
    const key = toDateKeyInZone(new Date(booking.startAt), defaultTimeZone)
    const list = groups.get(key)

    if (list) {
      list.push(booking)
    } else {
      groups.set(key, [booking])
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dateKey, items]) => ({
      dateKey,
      items: [...items].sort((a, b) =>
        a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0,
      ),
    }))
}

export function BookingsList({ bookings, onCancel }: BookingsListProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Calendar className="size-6" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <p className="text-[15px] text-muted-foreground">Пока нет ни одной брони</p>
      </div>
    )
  }

  const groups = groupByDay(bookings)

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.dateKey} aria-label={formatDayTitle(group.dateKey)}>
          <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            {formatDayTitle(group.dateKey)}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.items.map((booking) =>
              isDesktop ? (
                <li
                  key={booking.id}
                  className="flex items-center gap-5 rounded-xl border bg-card p-4"
                >
                  <div className="w-[92px] shrink-0">
                    <div className="text-lg font-semibold">
                      {formatTimeInZone(booking.startAt, defaultTimeZone)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      до {formatTimeInZone(endTimeIso(booking), defaultTimeZone)}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold">{booking.name}</span>
                      {booking.eventTypeTitle && (
                        <span className="inline-flex h-6 items-center rounded-full bg-accent px-2.5 text-xs font-medium text-accent-foreground">
                          {booking.eventTypeTitle}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                        {booking.email}
                      </span>
                      {booking.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                          {booking.phone}
                        </span>
                      )}
                    </div>
                    {booking.comment && (
                      <div className="flex items-start gap-1.5 text-sm">
                        <MessageSquare
                          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        {booking.comment}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 border-destructive-border text-destructive hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => onCancel(booking)}
                  >
                    Отменить
                  </Button>
                </li>
              ) : (
                <li
                  key={booking.id}
                  className="flex flex-col gap-1.5 rounded-2xl border bg-card p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[17px] font-bold">
                      {formatTimeInZone(booking.startAt, defaultTimeZone)} –{' '}
                      {formatTimeInZone(endTimeIso(booking), defaultTimeZone)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {booking.durationMin} мин
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold">{booking.name}</div>
                  {booking.eventTypeTitle && (
                    <div className="text-[13px] text-muted-foreground">
                      {booking.eventTypeTitle}
                    </div>
                  )}
                  <div className="text-[13px] text-muted-foreground">{booking.email}</div>
                  {booking.phone && (
                    <div className="text-[13px] text-muted-foreground">{booking.phone}</div>
                  )}
                  {booking.comment && (
                    <div className="text-sm">«{booking.comment}»</div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-1.5 h-11 w-full rounded-xl border-destructive-border text-destructive hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => onCancel(booking)}
                  >
                    Отменить
                  </Button>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  )
}
