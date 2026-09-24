import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { toBookingWithSlot } from '@/api/mappers'
import { ApiError, api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { AvailabilitySettingsForm } from '@/components/availability-settings-form'
import { BookingFilter, type BookingFilterValue } from '@/components/booking-filter'
import { BookingsList } from '@/components/bookings-list'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { EventTypesEditor } from '@/components/event-types-editor'
import { host } from '@/config/host'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { AvailabilitySettings } from '@/types/availability-settings'
import type { BookingWithSlot } from '@/types/booking'
import { defaultTimeZone, toDateKeyInZone } from '@/utils/timezone'
import { cn } from '@/lib/utils'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function applyFilter(
  bookings: BookingWithSlot[],
  filter: BookingFilterValue,
  now: Date,
): BookingWithSlot[] {
  if (filter === 'today') {
    const todayKey = toDateKeyInZone(now, defaultTimeZone)

    return bookings.filter(
      (booking) => toDateKeyInZone(new Date(booking.startAt), defaultTimeZone) === todayKey,
    )
  }

  if (filter === 'week') {
    const from = now.getTime()
    const to = from + WEEK_MS

    return bookings.filter((booking) => {
      const start = new Date(booking.startAt).getTime()
      return start >= from && start <= to
    })
  }

  return bookings
}

export default function DashboardPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [bookings, setBookings] = useState<BookingWithSlot[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  const [settings, setSettings] = useState<AvailabilitySettings | null>(null)
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [rulesError, setRulesError] = useState<string | null>(null)

  const [filter, setFilter] = useState<BookingFilterValue>('all')
  const [mobileTab, setMobileTab] = useState<'bookings' | 'availability' | 'event-types'>(
    'bookings',
  )

  const loadBookings = useCallback(async () => {
    setIsLoadingBookings(true)

    try {
      const [rows, types] = await Promise.all([
        call(api.hostBookingsClient.listHostBookings(host.slug)),
        call(api.eventTypesClient.listEventTypes(host.slug)).catch(() => []),
      ])
      const titleById = new Map(types.map((type) => [type.id, type.title]))

      setBookings(rows.map((row) => toBookingWithSlot(row, titleById.get(row.eventTypeId) ?? null)))
      setBookingsError(null)
    } catch {
      setBookingsError('Не удалось загрузить брони')
    } finally {
      setIsLoadingBookings(false)
    }
  }, [])

  useEffect(() => {
    void loadBookings()
    void (async () => {
      try {
        setSettings(await call(api.availabilityClient.getAvailability(host.slug)))
        setRulesError(null)
      } catch {
        setRulesError('Не удалось загрузить настройки доступности')
      }
    })()
  }, [loadBookings])

  const handleCancel = async (booking: BookingWithSlot) => {
    try {
      await call(api.bookingsClient.cancelBooking(booking.id))
      toast.success('Бронь отменена')
      await loadBookings()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось отменить бронь')
    }
  }

  const handleSaveRules = async (next: AvailabilitySettings): Promise<boolean> => {
    setIsSavingRules(true)

    try {
      const saved = await call(api.availabilityClient.updateAvailability(host.slug, next))
      setSettings(saved)
      toast.success('Настройки сохранены')
      return true
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить настройки')
      return false
    } finally {
      setIsSavingRules(false)
    }
  }

  const activeBookings = bookings.filter((booking) => booking.status === 'confirmed')
  const filteredBookings = applyFilter(activeBookings, filter, new Date())

  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar bookingCount={activeBookings.length} />
        <main className="flex min-w-0 flex-1 gap-8 p-10">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-[32px] font-semibold leading-tight">Встречи</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Предстоящие брони по дням</p>
              </div>
              <BookingFilter value={filter} onChange={setFilter} />
            </div>

            {isLoadingBookings && <p>Загрузка броней…</p>}
            {bookingsError && <p className="text-destructive">{bookingsError}</p>}
            {!isLoadingBookings && !bookingsError && (
              <BookingsList bookings={filteredBookings} onCancel={handleCancel} />
            )}

            <section id="event-types" className="rounded-[18px] border bg-card p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Типы встреч</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Что может выбрать гость при записи
                </p>
              </div>
              <EventTypesEditor slug={host.slug} />
            </section>
          </div>

          <section
            id="availability"
            className="sticky top-10 w-[360px] shrink-0 self-start rounded-[18px] border bg-card p-6"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Доступность</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Из этих правил собираются свободные слоты
              </p>
            </div>

            {rulesError && <p className="text-destructive">{rulesError}</p>}
            {!rulesError && !settings && <p>Загрузка настроек…</p>}
            {settings && (
              <AvailabilitySettingsForm settings={settings} isSaving={isSavingRules} onSave={handleSaveRules} />
            )}
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader linkTo={`/book/${host.slug}`} linkLabel="Бронирование" variant="mobile" />
      <main className="mx-auto w-full max-w-md px-4 py-4">
        <h2 className="font-serif text-[28px] font-semibold leading-tight">
          Панель организатора
        </h2>

        <div role="tablist" aria-label="Разделы панели" className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-0.5">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'bookings'}
            onClick={() => setMobileTab('bookings')}
            className={cn(
              'h-11 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              mobileTab === 'bookings'
                ? 'bg-segment-active font-semibold shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            Встречи · {activeBookings.length}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'event-types'}
            onClick={() => setMobileTab('event-types')}
            className={cn(
              'h-11 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              mobileTab === 'event-types'
                ? 'bg-segment-active font-semibold shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            Типы
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'availability'}
            onClick={() => setMobileTab('availability')}
            className={cn(
              'h-11 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              mobileTab === 'availability'
                ? 'bg-segment-active font-semibold shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            Доступность
          </button>
        </div>

        {mobileTab === 'bookings' && (
          <div className="mt-4 flex flex-col gap-4">
            <BookingFilter value={filter} onChange={setFilter} />
            {isLoadingBookings && <p>Загрузка броней…</p>}
            {bookingsError && <p className="text-destructive">{bookingsError}</p>}
            {!isLoadingBookings && !bookingsError && (
              <BookingsList bookings={filteredBookings} onCancel={handleCancel} />
            )}
          </div>
        )}

        {mobileTab === 'event-types' && (
          <section className="mt-4 rounded-[18px] border bg-card p-5">
            <EventTypesEditor slug={host.slug} />
          </section>
        )}

        {mobileTab === 'availability' && (
          <div className="mt-4 rounded-[18px] border bg-card p-5">
            {rulesError && <p className="text-destructive">{rulesError}</p>}
            {!rulesError && !settings && <p>Загрузка настроек…</p>}
            {settings && (
              <AvailabilitySettingsForm settings={settings} isSaving={isSavingRules} onSave={handleSaveRules} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
