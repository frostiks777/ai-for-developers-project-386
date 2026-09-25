import { useState } from 'react'
import { CalendarClock, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { host } from '@/config/host'
import { useMediaQuery } from '@/hooks/use-media-query'
import { defaultTimeZone, formatDateTimeInZone } from '@/utils/timezone'
import { listMyBookings, removeMyBooking, type SavedBooking } from '@/utils/my-bookings'

export default function MyBookingsPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [bookings, setBookings] = useState<SavedBooking[]>(() => listMyBookings())

  const handleRemove = (id: string) => {
    removeMyBooking(id)
    setBookings((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        variant={isDesktop ? 'desktop' : 'mobile'}
        tabs={[
          { to: `/book/${host.slug}`, label: 'Записаться', active: false },
          { to: '/events', label: 'Предстоящие события', active: false },
          { to: '/my', label: 'Мои встречи', active: true },
        ]}
      />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10 lg:px-6 lg:py-14">
        <h2 className="font-serif text-[28px] font-semibold leading-tight lg:text-[32px]">
          Мои встречи
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Брони, созданные в этом браузере. Если ссылку не сохранили — отменить и перенести
          встречу можно здесь.
        </p>

        {bookings.length === 0 && (
          <div className="mt-8 rounded-card border bg-card p-8 text-center">
            <CalendarClock
              className="mx-auto size-8 text-muted-foreground"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <p className="mt-3 font-medium">Здесь пока пусто</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Запишитесь на звонок в этом браузере — встреча появится в списке.
            </p>
            <Button className="mt-4" asChild>
              <Link to={`/book/${host.slug}`}>Записаться</Link>
            </Button>
          </div>
        )}

        <ul className="mt-8 grid gap-3">
          {bookings.map((booking) => {
            const isPast = Date.parse(booking.startAt) < Date.now()

            return (
              <li
                key={booking.id}
                className="rounded-card border bg-card p-5 text-card-foreground shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{booking.eventTypeTitle ?? host.meetingTitle}</p>
                  {isPast && (
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                      Прошла
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTimeInZone(booking.startAt, defaultTimeZone)} · {booking.durationMin} мин
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/reschedule/${booking.id}`}>Перенести</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/cancel/${booking.id}`}>Отменить</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(booking.id)}
                    aria-label={`Убрать из списка: ${booking.eventTypeTitle ?? 'встреча'}`}
                  >
                    <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    Убрать
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
