import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { toBookingWithSlot } from '@/api/mappers'
import { ApiError, api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { AvailabilitySettingsForm } from '@/components/availability-settings-form'
import { BlocksEditor } from '@/components/blocks-editor'
import { BookingFilter, type BookingFilterValue } from '@/components/booking-filter'
import { BookingsList } from '@/components/bookings-list'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { EventTypesEditor } from '@/components/event-types-editor'
import { Input } from '@/components/ui/input'
import { host } from '@/config/host'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { AvailabilitySettings } from '@/types/availability-settings'
import type { BookingWithSlot } from '@/types/booking'
import { cn } from '@/lib/utils'

function applySelection(
  bookings: BookingWithSlot[],
  filter: BookingFilterValue,
  search: string,
  now: number,
): BookingWithSlot[] {
  const matchesTab = (booking: BookingWithSlot) => {
    if (filter === 'canceled') {
      return booking.status === 'cancelled'
    }

    if (booking.status !== 'confirmed') {
      return false
    }

    const start = Date.parse(booking.startAt)
    return filter === 'past' ? start < now : start >= now
  }

  const normalized = search.trim().toLowerCase()
  const matchesSearch = (booking: BookingWithSlot) =>
    normalized === '' ||
    booking.name.toLowerCase().includes(normalized) ||
    booking.email.toLowerCase().includes(normalized)

  return bookings.filter((booking) => matchesTab(booking) && matchesSearch(booking))
}

export type DashboardSection = 'bookings' | 'event-types' | 'availability' | 'blocks'

interface DashboardPageProps {
  initialSection?: DashboardSection
}

export default function DashboardPage({ initialSection }: DashboardPageProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [bookings, setBookings] = useState<BookingWithSlot[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  const [settings, setSettings] = useState<AvailabilitySettings | null>(null)
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [rulesError, setRulesError] = useState<string | null>(null)

  const [filter, setFilter] = useState<BookingFilterValue>('upcoming')
  const [search, setSearch] = useState('')
  const [mobileTab, setMobileTab] = useState<DashboardSection>(initialSection ?? 'bookings')

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

  useEffect(() => {
    if (!initialSection) {
      return
    }

    document
      .getElementById(initialSection)
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [initialSection])

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

  const now = Date.now()
  const upcomingCount = bookings.filter(
    (booking) => booking.status === 'confirmed' && Date.parse(booking.startAt) >= now,
  ).length
  const filteredBookings = applySelection(bookings, filter, search, now)

  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar bookingCount={upcomingCount} />
        <main className="flex min-w-0 flex-1 gap-8 p-10">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div id="bookings" className="flex scroll-mt-4 flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-[32px] font-semibold leading-tight">Встречи</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Брони по статусу и дню</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по имени и email"
                  aria-label="Поиск по имени и email"
                  className="h-9 w-[240px]"
                />
                <BookingFilter value={filter} onChange={setFilter} />
              </div>
            </div>

            {isLoadingBookings && <p>Загрузка броней…</p>}
            {bookingsError && <p className="text-destructive">{bookingsError}</p>}
            {!isLoadingBookings && !bookingsError && (
              <BookingsList
                bookings={filteredBookings}
                onCancel={handleCancel}
                showCancel={filter === 'upcoming'}
              />
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

            <section id="blocks" className="rounded-[18px] border bg-card p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Блокировки времени</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Отпуск и личные дела — гости не увидят эти слоты
                </p>
              </div>
              <BlocksEditor slug={host.slug} />
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

        <div role="tablist" aria-label="Разделы панели" className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-secondary p-0.5">
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
            Встречи · {upcomingCount}
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
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'blocks'}
            onClick={() => setMobileTab('blocks')}
            className={cn(
              'h-11 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              mobileTab === 'blocks'
                ? 'bg-segment-active font-semibold shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            Блокировки
          </button>
        </div>

        {mobileTab === 'bookings' && (
          <div className="mt-4 flex flex-col gap-4">
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по имени и email"
              aria-label="Поиск по имени и email"
              className="h-11"
            />
            <BookingFilter value={filter} onChange={setFilter} />
            {isLoadingBookings && <p>Загрузка броней…</p>}
            {bookingsError && <p className="text-destructive">{bookingsError}</p>}
            {!isLoadingBookings && !bookingsError && (
              <BookingsList
                bookings={filteredBookings}
                onCancel={handleCancel}
                showCancel={filter === 'upcoming'}
              />
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

        {mobileTab === 'blocks' && (
          <section className="mt-4 rounded-[18px] border bg-card p-5">
            <BlocksEditor slug={host.slug} />
          </section>
        )}
      </main>
    </div>
  )
}
