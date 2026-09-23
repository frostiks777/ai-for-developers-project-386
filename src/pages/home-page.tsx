import { useEffect, useMemo, useState } from 'react'

import { fetchAvailability } from '@/api/client'
import { AppHeader } from '@/components/app-header'
import { BookingDialog } from '@/components/booking-dialog'
import { BookingSuccess } from '@/components/booking-success'
import { HostInfo } from '@/components/host-info'
import { MonthCalendar } from '@/components/month-calendar'
import { SlotGrid } from '@/components/slot-grid'
import { Button } from '@/components/ui/button'
import { useAvailability } from '@/hooks/use-availability'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { pluralRu } from '@/utils/plural'
import { defaultTimeZone, formatDayTitle, toDateKeyInZone } from '@/utils/timezone'

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
  const { slots, isLoading, error, refetch } = useAvailability()
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bookedBooking, setBookedBooking] = useState<CreatedBooking | null>(null)
  const [bookedSlot, setBookedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timeZone, setTimeZone] = useState(defaultTimeZone)
  const [minNoticeMin, setMinNoticeMin] = useState<number | null>(null)

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

    fetchAvailability()
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
  }, [])

  const selectedSlot = visibleSlots.find((slot) => slot.id === selectedSlotId) ?? null
  const freeCount = visibleSlots.filter((slot) => !slot.isBooked).length

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

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader linkTo="/dashboard" linkLabel="Панель организатора" />

      <main className="mx-auto w-full max-w-[1140px] px-4 py-6 lg:px-6 lg:py-8">
        {bookedBooking && bookedSlot ? (
          <BookingSuccess
            booking={bookedBooking}
            slot={bookedSlot}
            timeZone={timeZone}
            onReset={handleReset}
          />
        ) : (
          <div className="grid overflow-hidden rounded-card border bg-card text-card-foreground shadow-soft lg:grid-cols-[300px_460px_minmax(0,1fr)]">
            <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
              <HostInfo
                durationMin={slots[0]?.durationMin ?? null}
                minNoticeMin={minNoticeMin}
                timeZone={timeZone}
                onTimeZoneChange={setTimeZone}
              />
            </div>

            <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
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

            <div className="flex flex-col p-6">
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
                  <div className="mt-5 flex-1 overflow-y-auto">
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

      <BookingDialog
        slot={selectedSlot}
        timeZone={timeZone}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onBooked={handleBooked}
      />
    </div>
  )
}
