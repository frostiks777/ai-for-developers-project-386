import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Clock, Globe, Video } from 'lucide-react'
import { useParams } from 'react-router-dom'

import type { EventType } from '@/api/generated'
import { api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { BookingBar } from '@/components/booking-bar'
import { BookingDialog } from '@/components/booking-dialog'
import { BookingSuccess } from '@/components/booking-success'
import { DateStrip } from '@/components/date-strip'
import { HostInfo } from '@/components/host-info'
import { MonthCalendar } from '@/components/month-calendar'
import { SlotGrid } from '@/components/slot-grid'
import { TimeZoneSelect } from '@/components/timezone-select'
import { Button } from '@/components/ui/button'
import { host } from '@/config/host'
import { useAvailability } from '@/hooks/use-availability'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { parseDateKey } from '@/utils/dates'
import { pluralRu } from '@/utils/plural'
import {
  defaultTimeZone,
  formatDayShortTitle,
  formatDayTitle,
  formatTimeRange,
  toDateKeyInZone,
} from '@/utils/timezone'
import { cn } from '@/lib/utils'

function CalendarSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="size-11 animate-pulse rounded-full bg-muted" />
          <div className="size-11 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 justify-items-center gap-y-1">
        {Array.from({ length: 35 }, (_, index) => (
          <div key={index} className="size-[52px] animate-pulse rounded-full bg-muted" />
        ))}
      </div>
    </div>
  )
}

function SlotsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { slug } = useParams<{ slug: string }>()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const { slots, isLoading, error, refetch } = useAvailability(
    slug ?? '',
    selectedTypeId ?? undefined,
  )
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bookedBooking, setBookedBooking] = useState<CreatedBooking | null>(null)
  const [bookedSlot, setBookedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timeZone, setTimeZone] = useState(defaultTimeZone)
  const [minNoticeMin, setMinNoticeMin] = useState<number | null>(null)
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const slotDates = useMemo(
    () => slots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone)),
    [slots, timeZone],
  )
  const activeDate =
    selectedDate !== null && slotDates.includes(selectedDate) ? selectedDate : (slotDates[0] ?? null)
  const visibleSlots = useMemo(
    () =>
      activeDate
        ? slots.filter((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone) === activeDate)
        : slots,
    [slots, activeDate, timeZone],
  )

  useEffect(() => {
    const firstFreeSlot = visibleSlots.find((slot) => !slot.isBooked)
    setSelectedSlotId(firstFreeSlot?.id ?? null)
  }, [visibleSlots, slots, activeDate, timeZone])

  useEffect(() => {
    let isActive = true

    call(api.availabilityClient.getAvailability(slug ?? ''))
      .then((rules) => {
        if (isActive) {
          setMinNoticeMin(typeof rules?.minNoticeMin === 'number' ? rules.minNoticeMin : null)
        }
      })
      .catch(() => {
        if (isActive) {
          setMinNoticeMin(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [slug])

  useEffect(() => {
    let isActive = true

    call(api.eventTypesClient.listEventTypes(slug ?? ''))
      .then((types) => {
        if (!isActive) {
          return
        }

        setEventTypes(types)
        setSelectedTypeId((current) => current ?? types.find((type) => type.isActive)?.id ?? null)
      })
      .catch(() => {
        if (isActive) {
          setEventTypes([])
        }
      })

    return () => {
      isActive = false
    }
  }, [slug])

  const handleSelectType = (type: EventType) => {
    setSelectedTypeId(type.id)
    setSelectedSlotId(null)
    setSelectedDate(null)
  }

  const selectedType = eventTypes.find((type) => type.id === selectedTypeId) ?? null
  const selectedSlot = visibleSlots.find((slot) => slot.id === selectedSlotId) ?? null
  const freeCount = visibleSlots.filter((slot) => !slot.isBooked).length
  const durationMin = slots[0]?.durationMin ?? null
  const monthTitle = activeDate
    ? (() => {
        const raw = new Intl.DateTimeFormat('ru-RU', {
          month: 'long',
          year: 'numeric',
        }).format(parseDateKey(activeDate))

        return raw.charAt(0).toUpperCase() + raw.slice(1)
      })()
    : ''

  const handleBooked = (booking: CreatedBooking) => {
    setBookedSlot(selectedSlot)
    setBookedBooking(booking)
    refetch()
  }

  const handleReset = () => {
    setBookedBooking(null)
    setBookedSlot(null)
    refetch()
  }

  const activeTypes = eventTypes.filter((type) => type.isActive)

  const typePicker = activeTypes.length > 0 && (
    <div role="radiogroup" aria-label="Тип встречи" className="mb-4 flex flex-wrap gap-2">
      {activeTypes.map((type) => (
        <button
          key={type.id}
          type="button"
          role="radio"
          aria-checked={selectedTypeId === type.id}
          onClick={() => handleSelectType(type)}
          className={cn(
            'h-11 rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            selectedTypeId === type.id
              ? 'border-primary bg-accent font-semibold text-accent-foreground'
              : 'border-input bg-card text-muted-foreground hover:bg-accent/60',
          )}
        >
          {type.title} · {type.durationMin} мин
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader
        variant={isDesktop ? 'desktop' : 'mobile'}
        tabs={[
          { to: `/book/${slug ?? host.slug}`, label: 'Записаться', active: true },
          { to: '/events', label: 'Предстоящие события', active: false },
        ]}
      />

      {isDesktop ? (
        <main className="mx-auto flex w-full max-w-[1140px] flex-1 min-h-0 flex-col px-4 py-6 lg:px-6 lg:py-8">
          {!bookedBooking && typePicker}
          {bookedBooking && bookedSlot ? (
            <BookingSuccess
              booking={bookedBooking}
              slot={bookedSlot}
              timeZone={timeZone}
              eventTypeTitle={selectedType?.title ?? null}
              onReset={handleReset}
            />
          ) : (
            <div className="grid min-h-0 flex-1 overflow-hidden rounded-card border bg-card text-card-foreground shadow-soft lg:grid-cols-[300px_460px_minmax(0,1fr)]">
              <div className="scrollbar-none min-h-0 overflow-y-auto border-b border-border p-6 lg:border-b-0 lg:border-r">
                <HostInfo
                  eventType={selectedType}
                  durationMin={slots[0]?.durationMin ?? null}
                  minNoticeMin={minNoticeMin}
                  timeZone={timeZone}
                  onTimeZoneChange={setTimeZone}
                />
              </div>

              <div className="scrollbar-none min-h-0 overflow-y-auto border-b border-border p-6 lg:border-b-0 lg:border-r">
                {isLoading ? (
                  <CalendarSkeleton />
                ) : (
                  activeDate && (
                    <MonthCalendar
                      slots={slots}
                      selectedDate={activeDate}
                      timeZone={timeZone}
                      onSelectDate={setSelectedDate}
                    />
                  )
                )}
              </div>

              <div className="flex min-h-0 flex-col p-6">
                {isLoading && <SlotsSkeleton />}

                <span className="sr-only" aria-live="polite">
                  Загрузка слотов…
                </span>

                {!isLoading && error && (
                  <div className="rounded-xl border bg-background p-6 text-center">
                    <p className="font-medium">Не удалось загрузить слоты</p>
                    <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                      Повторить
                    </Button>
                  </div>
                )}

                {!isLoading && !error && slots.length === 0 && (
                  <div className="rounded-xl border bg-background p-6 text-center">
                    <p className="font-medium">Нет доступных слотов</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Загляните позже — организатор ещё не открыл время.
                    </p>
                  </div>
                )}

                {!isLoading && !error && activeDate && (
                  <>
                    <h2 className="font-semibold">{formatDayTitle(activeDate)}</h2>
                    <p className="mt-1 text-[13px] text-muted-foreground" aria-live="polite">
                      {freeCount} {pluralRu(freeCount, ['свободное окно', 'свободных окна', 'свободных окон'])} ·
                      время по {timeZone}
                    </p>
                    <div className="scrollbar-none mt-5 flex-1 overflow-y-auto">
                      <SlotGrid
                        slots={visibleSlots}
                        selectedSlotId={selectedSlotId}
                        timeZone={timeZone}
                        onSelect={(slot) => setSelectedSlotId(slot.id)}
                        onConfirm={() => setIsDialogOpen(true)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      ) : (
        <main className="mx-auto w-full max-w-md px-4 py-4 pb-32">
          {!bookedBooking && typePicker}
          {bookedBooking && bookedSlot ? (
            <BookingSuccess
              booking={bookedBooking}
              slot={bookedSlot}
              timeZone={timeZone}
              eventTypeTitle={selectedType?.title ?? null}
              onReset={handleReset}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <section>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
                    {host.initials}
                  </div>
                  <p className="text-sm text-muted-foreground">{host.name}</p>
                </div>
                <h2 className="mt-3 font-serif text-[28px] font-semibold leading-tight">
                  {selectedType?.title ?? host.meetingTitle}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {durationMin !== null && (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px]">
                      <Clock className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
                      {durationMin} мин
                    </span>
                  )}
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px]">
                    <Video className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
                    Онлайн
                  </span>
                  <TimeZoneSelect
                    value={timeZone}
                    onChange={setTimeZone}
                    hideLabel
                    labelIcon={
                      <Globe className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
                    }
                    className="inline-flex h-8 flex-row items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] [&>select]:h-6 [&>select]:w-auto [&>select]:border-0 [&>select]:bg-transparent [&>select]:p-0 [&>select]:text-[13px]"
                  />
                </div>
              </section>

              <section>
                {isLoading ? (
                  <CalendarSkeleton />
                ) : (
                  activeDate && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-semibold">{monthTitle}</p>
                        <button
                          type="button"
                          aria-expanded={isMonthOpen}
                          onClick={() => setIsMonthOpen((open) => !open)}
                          className="inline-flex h-11 items-center gap-1 text-sm font-semibold text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          Весь месяц
                          <ChevronDown
                            className={cn('size-4 transition-transform', isMonthOpen && 'rotate-180')}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                      <div className="mt-2">
                        <DateStrip
                          slots={slots}
                          selectedDate={activeDate}
                          timeZone={timeZone}
                          onSelectDate={setSelectedDate}
                        />
                      </div>
                      {isMonthOpen && (
                        <div className="mt-4">
                          <MonthCalendar
                            slots={slots}
                            selectedDate={activeDate}
                            timeZone={timeZone}
                            onSelectDate={setSelectedDate}
                          />
                        </div>
                      )}
                    </>
                  )
                )}
              </section>

              <section>
                {isLoading && <SlotsSkeleton />}

                <span className="sr-only" aria-live="polite">
                  Загрузка слотов…
                </span>

                {!isLoading && error && (
                  <div className="rounded-xl border bg-background p-6 text-center">
                    <p className="font-medium">Не удалось загрузить слоты</p>
                    <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                      Повторить
                    </Button>
                  </div>
                )}

                {!isLoading && !error && slots.length === 0 && (
                  <div className="rounded-xl border bg-background p-6 text-center">
                    <p className="font-medium">Нет доступных слотов</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Загляните позже — организатор ещё не открыл время.
                    </p>
                  </div>
                )}

                {!isLoading && !error && activeDate && (
                  <>
                    <h2 className="text-[15px] font-semibold">{formatDayTitle(activeDate)}</h2>
                    <p className="mt-1 text-[13px] text-muted-foreground" aria-live="polite">
                      {freeCount} {pluralRu(freeCount, ['свободное окно', 'свободных окна', 'свободных окон'])} ·
                      время по {timeZone}
                    </p>
                    <div className="mt-3">
                      <SlotGrid
                        slots={visibleSlots}
                        selectedSlotId={selectedSlotId}
                        timeZone={timeZone}
                        columns={3}
                        onSelect={(slot) => setSelectedSlotId(slot.id)}
                        onConfirm={() => setIsDialogOpen(true)}
                      />
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </main>
      )}

      {!isDesktop && !bookedBooking && selectedSlot && activeDate && (
        <BookingBar
          dateTitle={formatDayShortTitle(activeDate)}
          timeRange={formatTimeRange(selectedSlot, timeZone)}
          onConfirm={() => setIsDialogOpen(true)}
        />
      )}

      <BookingDialog
        slot={selectedSlot}
        hostSlug={slug ?? ''}
        eventTypeId={selectedTypeId}
        timeZone={timeZone}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onBooked={handleBooked}
        onFailed={() => {
          setIsDialogOpen(false)
          setSelectedSlotId(null)
          refetch()
        }}
      />
    </div>
  )
}
