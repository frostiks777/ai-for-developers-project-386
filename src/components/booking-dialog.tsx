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
import { Textarea } from '@/components/ui/textarea'
import { useBooking } from '@/hooks/use-booking'
import { createBookingSchema } from '@/lib/validation'
import type { Booking, TimeSlot } from '@/types/booking'
import { formatDateTimeInZone } from '@/utils/timezone'

interface BookingDialogProps {
  slot: TimeSlot | null
  timeZone: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onBooked: (booking: Booking) => void
}

export function BookingDialog({
  slot,
  timeZone,
  open,
  onOpenChange,
  onBooked,
}: BookingDialogProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const { isSubmitting, bookSlot } = useBooking()

  useEffect(() => {
    if (!open) {
      setName('')
      setPhone('')
      setEmail('')
      setComment('')
    }
  }, [open])

  const parseResult = createBookingSchema.safeParse({
    slotId: slot?.id ?? 0,
    name,
    phone,
    email,
    comment,
  })
  const isFormValid = parseResult.success
  const issues = parseResult.success ? [] : parseResult.error.issues
  const phoneError =
    phone.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'phone')?.message ?? null) : null
  const emailError =
    email.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'email')?.message ?? null) : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!slot || !isFormValid) {
      return
    }

    const booking = await bookSlot(parseResult.data)

    if (booking) {
      onBooked(booking)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Бронирование звонка</DialogTitle>
          <DialogDescription>
            {slot ? `${formatDateTimeInZone(slot.startAt, timeZone)}, ${slot.durationMin} мин` : ''}
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
              aria-invalid={phoneError !== null}
              aria-describedby={phoneError ? 'booking-phone-error' : undefined}
            />
            {phoneError && (
              <p id="booking-phone-error" className="text-sm text-destructive">
                {phoneError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-email">Email</Label>
            <Input
              id="booking-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={emailError !== null}
              aria-describedby={emailError ? 'booking-email-error' : undefined}
            />
            {emailError && (
              <p id="booking-email-error" className="text-sm text-destructive">
                {emailError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-comment">Комментарий</Label>
            <Textarea
              id="booking-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Вопрос или тема встречи (необязательно)"
              rows={3}
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
