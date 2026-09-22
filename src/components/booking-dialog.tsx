import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBooking } from '@/hooks/use-booking'
import type { TimeSlot } from '@/types/booking'

interface BookingDialogProps {
  slot: TimeSlot | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onBooked: () => void
}

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatStartAt(startAt: string): string {
  return dateTimeFormatter.format(new Date(startAt))
}

export function BookingDialog({ slot, open, onOpenChange, onBooked }: BookingDialogProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const { isSubmitting, bookSlot } = useBooking()

  useEffect(() => {
    if (!open) {
      setName('')
      setPhone('')
    }
  }, [open])

  const isFormValid = name.trim() !== '' && phone.trim() !== ''

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!slot || !isFormValid) {
      return
    }

    const isBooked = await bookSlot({ slotId: slot.id, name, phone })

    if (isBooked) {
      onBooked()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Бронирование звонка</DialogTitle>
          <DialogDescription>
            {slot ? `${formatStartAt(slot.startAt)}, ${slot.durationMin} мин` : ''}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="booking-name">Имя</Label>
            <Input
              id="booking-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как к вам обращаться"
              autoComplete="name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-phone">Телефон</Label>
            <Input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 900 000-00-00"
              autoComplete="tel"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Отправка…' : 'Забронировать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
