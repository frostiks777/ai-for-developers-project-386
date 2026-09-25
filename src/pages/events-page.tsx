import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'

import type { Booking } from '@/api/generated'
import { api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { useActiveHost } from '@/hooks/use-active-host'
import { useMediaQuery } from '@/hooks/use-media-query'
import { defaultTimeZone, formatTimeInZone, toDateKeyInZone } from '@/utils/timezone'

function slotLabel(booking: Booking): string {
  const dateKey = toDateKeyInZone(new Date(booking.startAt), defaultTimeZone)
  const time = formatTimeInZone(booking.startAt, defaultTimeZone)
  return `${dateKey}-${time}`
}

function createdLabel(booking: Booking): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: defaultTimeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(booking.createdAt))
}

export default function EventsPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { activeSlug } = useActiveHost()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    call(api.hostBookingsClient.listHostBookings(activeSlug))
      .then((rows) => {
        if (!isActive) {
          return
        }

        const now = Date.now()
        setBookings(
          rows
            .filter((row) => row.status === 'confirmed' && Date.parse(row.startAt) >= now)
            .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)),
        )
        setError(null)
      })
      .catch(() => {
        if (isActive) {
          setError('Не удалось загрузить предстоящие события')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeSlug])

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        variant={isDesktop ? 'desktop' : 'mobile'}
        tabs={[
          { to: `/book/${activeSlug}`, label: 'Записаться', active: false },
          { to: '/events', label: 'Предстоящие события', active: true },
          { to: '/my', label: 'Мои встречи', active: false },
        ]}
      />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10 lg:px-6 lg:py-14">
        <h2 className="font-serif text-[28px] font-semibold leading-tight lg:text-[32px]">
          Предстоящие события
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Запланированные встречи с организатором.
        </p>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Загрузка…</p>}
        {!isLoading && error && <p className="mt-8 text-sm text-destructive">{error}</p>}

        {!isLoading && !error && bookings.length === 0 && (
          <div className="mt-8 rounded-card border bg-card p-8 text-center">
            <CalendarClock
              className="mx-auto size-8 text-muted-foreground"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <p className="mt-3 font-medium">Пока нет предстоящих встреч</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Запишитесь на звонок — он появится здесь.
            </p>
          </div>
        )}

        <ul className="mt-8 grid gap-3">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="rounded-card border bg-card p-5 text-card-foreground shadow-soft"
            >
              <p className="font-semibold">{booking.clientName}</p>
              <p className="text-sm text-muted-foreground">{booking.clientEmail}</p>
              <dl className="mt-3 grid gap-1 text-[13px] text-muted-foreground">
                <div className="flex gap-1.5">
                  <dt>Слот:</dt>
                  <dd className="font-medium text-foreground">{slotLabel(booking)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Создано:</dt>
                  <dd>{createdLabel(booking)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
