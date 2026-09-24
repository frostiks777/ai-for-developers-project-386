import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Calendar, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useBooking } from '@/hooks/use-booking'
import { useMediaQuery } from '@/hooks/use-media-query'
import { createBookingSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { formatDialogDate, formatTimeRange, toDateKeyInZone } from '@/utils/timezone'

interface BookingDialogProps {
  slot: TimeSlot | null
  hostSlug: string
  eventTypeId: string | null
  timeZone: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onBooked: (booking: CreatedBooking) => void
  onFailed?: () => void
}

export function BookingDialog({
  slot,
  hostSlug,
  eventTypeId,
  timeZone,
  open,
  onOpenChange,
  onBooked,
  onFailed,
}: BookingDialogProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const { isSubmitting, bookSlot } = useBooking()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const nameInputRef = useRef<HTMLInputElement>(null)

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

    if (!slot || !eventTypeId || !isFormValid) {
      return
    }

    const booking = await bookSlot(hostSlug, {
      eventTypeId,
      startAt: slot.startAt,
      clientName: name,
      clientEmail: email,
      clientPhone: phone.trim() || undefined,
      clientNotes: comment.trim() || undefined,
    })

    if (booking) {
      onBooked(booking)
      onOpenChange(false)
    } else {
      onFailed?.()
    }
  }

  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault()
    nameInputRef.current?.focus()
  }

  const dateKey = slot ? toDateKeyInZone(new Date(slot.startAt), timeZone) : null
  const dialogDate = dateKey ? formatDialogDate(dateKey) : ''
  const timeRange = slot ? formatTimeRange(slot, timeZone) : ''
  const desktopSummary = slot ? `${dialogDate}, ${timeRange} · ${slot.durationMin} мин` : ''
  const mobileSummaryLine2 = slot ? `${timeRange} · ${slot.durationMin} мин · ${timeZone}` : ''
  const inputClass = isDesktop ? 'h-11' : 'h-[52px] text-base'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        sheet={!isDesktop}
        className={isDesktop ? 'max-w-[480px] rounded-card p-7' : ''}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        {!isDesktop && (
          <span aria-hidden="true" className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border" />
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <DialogTitle
              className={
                isDesktop
                  ? 'font-serif text-2xl font-semibold leading-tight'
                  : 'font-serif text-[22px] font-semibold leading-tight'
              }
            >
              Бронирование звонка
            </DialogTitle>
            {slot &&
              (isDesktop ? (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                  <span>{desktopSummary}</span>
                </p>
              ) : null)}
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Закрыть"
              className={cn(
                'shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isDesktop ? 'size-9' : 'size-11',
              )}
            >
              <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>

        {slot && !isDesktop && (
          <div className="flex items-center gap-2.5 rounded-xl bg-accent p-3 text-accent-foreground">
            <Calendar className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{dialogDate}</p>
              <p className="text-[13px] text-muted-foreground">{mobileSummaryLine2}</p>
            </div>
          </div>
        )}

        <form
          className={isDesktop ? 'grid gap-4' : 'flex min-h-0 flex-1 flex-col gap-3'}
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor="booking-name">Имя</Label>
            <Input
              ref={nameInputRef}
              id="booking-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как к вам обращаться"
              autoComplete="name"
              className={inputClass}
            />
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
              className={cn(inputClass, emailError && 'border-destructive')}
            />
            {emailError && (
              <p id="booking-email-error" className="text-[13px] text-destructive">
                {emailError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-phone">Телефон</Label>
              <span className="text-xs text-muted-foreground">необязательно</span>
            </div>
            <Input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 900 000-00-00"
              autoComplete="tel"
              aria-invalid={phoneError !== null}
              aria-describedby={phoneError ? 'booking-phone-error' : undefined}
              className={cn(inputClass, phoneError && 'border-destructive')}
            />
            {phoneError && (
              <p id="booking-phone-error" className="text-[13px] text-destructive">
                {phoneError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-comment">Комментарий</Label>
              <span className="text-xs text-muted-foreground">необязательно</span>
            </div>
            <Textarea
              id="booking-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Вопрос или тема встречи (необязательно)"
              rows={3}
              maxLength={1000}
              aria-describedby="booking-comment-counter"
              className={cn(inputClass, 'min-h-[80px] py-2.5')}
            />
            <div className="flex justify-end">
              <span id="booking-comment-counter" className="text-xs text-muted-foreground">
                {comment.length} / 1000
              </span>
            </div>
          </div>

          {isDesktop ? (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="h-11"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting} className="h-11">
                {isSubmitting ? 'Отправка…' : 'Забронировать'}
              </Button>
            </DialogFooter>
          ) : (
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="mt-auto h-14 w-full rounded-xl text-base"
            >
              {isSubmitting ? 'Отправка…' : 'Забронировать'}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
