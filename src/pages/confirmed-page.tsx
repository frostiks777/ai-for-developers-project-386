import { useEffect, useState } from 'react'
import { Calendar, Download, MapPin, RotateCcw, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import type { Booking as ApiBooking, EventType } from '@/api/generated'
import { toCreatedBooking } from '@/api/mappers'
import { api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { host } from '@/config/host'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { TimeSlot } from '@/types/booking'
import { buildIcs, downloadIcs, googleCalendarUrl } from '@/utils/calendar'
import { defaultTimeZone, formatDateTimeInZone } from '@/utils/timezone'

const LOCATION_LABEL: Record<string, string> = {
  online: 'Онлайн-звонок',
  offline: 'Очная встреча',
  phone: 'Телефонный звонок',
}

function durationMinutes(startAt: string, endAt: string): number {
  return Math.max(1, Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60_000))
}

export default function ConfirmedPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const [hostName, setHostName] = useState(host.name)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uuid) {
      setError('Бронь не найдена')
      setIsLoading(false)
      return
    }

    let isActive = true

    Promise.all([
      call(api.bookingsClient.getBooking(uuid)),
      call(api.getHostSettings(host.slug)).catch(() => null),
      call(api.eventTypesClient.listEventTypes(host.slug)).catch(() => []),
    ])
      .then(([found, settings, types]) => {
        if (!isActive) {
          return
        }

        setBooking(found)
        if (settings) {
          setHostName(settings.name)
        }
        setEventTypes(types)
        setError(null)
      })
      .catch(() => {
        if (isActive) {
          setError('Бронь не найдена')
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
  }, [uuid])

  const eventType = booking
    ? (eventTypes.find((type) => type.id === booking.eventTypeId) ?? null)
    : null

  const tabs = [
    { to: `/book/${host.slug}`, label: 'Записаться', active: false },
    { to: '/events', label: 'Предстоящие события', active: false },
  ]

  if (isLoading || error || !booking) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader variant={isDesktop ? 'desktop' : 'mobile'} tabs={tabs} />
        <main className="mx-auto w-full max-w-[600px] flex-1 px-4 py-16 text-center">
          {isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
          {!isLoading && error && <p className="text-sm text-destructive">{error}</p>}
        </main>
      </div>
    )
  }

  const created = toCreatedBooking(booking)
  const slot: TimeSlot = {
    id: 0,
    startAt: booking.startAt,
    durationMin: durationMinutes(booking.startAt, booking.endAt),
    isBooked: true,
  }
  const title = eventType?.title ?? host.meetingTitle
  const calendarOptions = { title }
  const googleUrl = googleCalendarUrl(created, slot, calendarOptions)
  const handleDownload = () => {
    downloadIcs(`booking-${created.id}.ics`, buildIcs(created, slot, calendarOptions))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant={isDesktop ? 'desktop' : 'mobile'} tabs={tabs} />

      <main className="mx-auto w-full max-w-[600px] flex-1 px-4 py-10 lg:px-6 lg:py-14">
        <section className="rounded-card border bg-card p-6 text-card-foreground shadow-soft lg:p-8">
          <h2 className="font-serif text-[26px] font-semibold leading-tight">{title}</h2>

          <div className="mt-4 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
              {hostName.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Организатор</p>
              <p className="font-semibold">{hostName}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-[15px]">
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
              <dd className="font-semibold">
                {formatDateTimeInZone(booking.startAt, booking.timeZone)} ({booking.timeZone})
              </dd>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
              <dd>{LOCATION_LABEL[eventType?.locationType ?? 'online'] ?? host.format}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <Button variant="outline" asChild className="h-11">
              <a href={googleUrl} target="_blank" rel="noreferrer">
                <Calendar className="size-4" strokeWidth={1.8} aria-hidden="true" />
                Google Календарь
              </a>
            </Button>
            <Button variant="outline" onClick={handleDownload} className="h-11">
              <Download className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Скачать .ics
            </Button>
          </div>

          <div className="mt-8 grid gap-2.5">
            <Button variant="outline" asChild className="h-11">
              <Link to={`/reschedule/${created.cancelToken}`}>
                <RotateCcw className="size-4" strokeWidth={1.8} aria-hidden="true" />
                Перенести встречу
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-11">
              <Link to={`/cancel/${created.cancelToken}`}>
                <XCircle className="size-4" strokeWidth={1.8} aria-hidden="true" />
                Отменить встречу
              </Link>
            </Button>
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Время указано в поясе {booking.timeZone ?? defaultTimeZone}.
        </p>
      </main>
    </div>
  )
}
