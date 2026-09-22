import { useState } from 'react'

import { BookingDialog } from '@/components/booking-dialog'
import { Button } from '@/components/ui/button'
import { useAvailability } from '@/hooks/use-availability'
import type { TimeSlot } from '@/types/booking'

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatStartAt(startAt: string): string {
  return dateTimeFormatter.format(new Date(startAt))
}

export default function HomePage() {
  const { slots, isLoading, error, refetch } = useAvailability()
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleBookingClick = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setIsDialogOpen(true)
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Календарь звонков</h1>
        <p className="mt-2 text-muted-foreground">
          Выберите свободное время и забронируйте звонок в один клик.
        </p>
      </header>

      {isLoading && <p>Загрузка слотов…</p>}

      {error && <p className="text-destructive">{error}</p>}

      {!isLoading && !error && slots.length === 0 && <p>Нет доступных слотов</p>}

      {!isLoading && !error && slots.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
            >
              <p className="font-medium">{formatStartAt(slot.startAt)}</p>
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
      )}

      <BookingDialog
        slot={selectedSlot}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onBooked={refetch}
      />
    </div>
  )
}
