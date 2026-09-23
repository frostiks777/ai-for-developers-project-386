import { useState } from 'react'
import { Link } from 'react-router-dom'

import { BookingDialog } from '@/components/booking-dialog'
import { BookingSuccess } from '@/components/booking-success'
import { MonthCalendar } from '@/components/month-calendar'
import { TimeZoneSelect } from '@/components/timezone-select'
import { Button } from '@/components/ui/button'
import { useAvailability } from '@/hooks/use-availability'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { formatDateTimeInZone, defaultTimeZone, toDateKeyInZone } from '@/utils/timezone'

export default function HomePage() {
  const { slots, isLoading, error, refetch } = useAvailability()
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bookedBooking, setBookedBooking] = useState<CreatedBooking | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timeZone, setTimeZone] = useState(defaultTimeZone)

  const slotDates = slots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone))
  const activeDate =
    selectedDate !== null && slotDates.includes(selectedDate)
      ? selectedDate
      : (slotDates[0] ?? null)
  const visibleSlots = activeDate
    ? slots.filter((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone) === activeDate)
    : slots

  const handleBookingClick = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setIsDialogOpen(true)
  }

  const handleBooked = (booking: CreatedBooking) => {
    setBookedBooking(booking)
    refetch()
  }

  const handleReset = () => {
    setBookedBooking(null)
    refetch()
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Календарь звонков</h1>
          <Link to="/dashboard" className="text-sm text-primary underline-offset-4 hover:underline">
            Панель организатора
          </Link>
        </div>
        <p className="mt-2 text-muted-foreground">
          Выберите свободное время и забронируйте звонок в один клик.
        </p>
      </header>

      <div className="mb-6 sm:max-w-xs">
        <TimeZoneSelect value={timeZone} onChange={setTimeZone} />
      </div>

      {bookedBooking && selectedSlot ? (
        <BookingSuccess
          booking={bookedBooking}
          slot={selectedSlot}
          timeZone={timeZone}
          onReset={handleReset}
        />
      ) : (
        <>
          {isLoading && <p>Загрузка слотов…</p>}

          {error && <p className="text-destructive">{error}</p>}

          {!isLoading && !error && slots.length === 0 && <p>Нет доступных слотов</p>}

          {!isLoading && !error && slots.length > 0 && (
            <div className="grid gap-6">
              <MonthCalendar
                slots={slots}
                selectedDate={activeDate ?? ''}
                timeZone={timeZone}
                onSelectDate={setSelectedDate}
              />
              <ul className="grid gap-4 sm:grid-cols-2">
                {visibleSlots.map((slot) => (
                  <li
                    key={slot.id}
                    className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
                  >
                    <p className="font-medium">
                      {formatDateTimeInZone(slot.startAt, timeZone)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Длительность: {slot.durationMin} мин
                    </p>
                    <Button
                      className="mt-4"
                      disabled={slot.isBooked}
                      onClick={() => handleBookingClick(slot)}
                    >
                      {slot.isBooked ? 'Занято' : 'Забронировать'}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

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
