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
import { useTimeFormat } from '@/hooks/use-time-format'
import { createBookingSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { formatPhoneInput } from '@/utils/phone'
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

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`
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
  const [guests, setGuests] = useState<string[]>([])
  const [guestInput, setGuestInput] = useState('')
  const [guestError, setGuestError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [conflict, setConflict] = useState(false)
  const { isSubmitting, bookSlot } = useBooking()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { hour12 } = useTimeFormat()
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setIdempotencyKey(createIdempotencyKey())
      return
    }

    setName('')
    setPhone('')
    setEmail('')
    setComment('')
    setGuests([])
    setGuestInput('')
    setGuestError(null)
    setConsent(false)
    setConflict(false)
  }, [open])

  const addGuest = () => {
    const value = guestInput.trim()

    if (value === '') {
      return
    }

    if (!EMAIL_PATTERN.test(value)) {
      setGuestError('Неверный email гостя')
      return
    }

    if (!guests.includes(value)) {
      setGuests((prev) => [...prev, value])
    }

    setGuestInput('')
    setGuestError(null)
  }

  const parseResult = createBookingSchema.safeParse({
    slotId: slot?.id ?? 0,
    name,
    phone,
    email,
    comment,
    guests,
    consentAccepted: consent,
  })
  const isFormValid = parseResult.success
  const canSubmit = isFormValid && slot !== null && eventTypeId !== null
  const issues = parseResult.success ? [] : parseResult.error.issues
  const nameError =
    name.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'name')?.message ?? null) : null
  const phoneError =
    phone.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'phone')?.message ?? null) : null
  const emailError =
    email.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'email')?.message ?? null) : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!slot || !eventTypeId || !isFormValid) {
      return
    }

    setConflict(false)

    const result = await bookSlot(
      hostSlug,
      {
        eventTypeId,
        startAt: slot.startAt,
        clientName: name,
        clientEmail: email,
        clientPhone: phone.trim() || undefined,
        clientNotes: comment.trim() || undefined,
        guests: guests.length > 0 ? guests : undefined,
        consentAccepted: consent,
      },
      { idempotencyKey },
    )

    if (result.ok) {
      onBooked(result.booking)
      onOpenChange(false)
      return
    }

    if (result.error.status === 409) {
      setConflict(true)
      return
    }

    onFailed?.()
  }

  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault()
    nameInputRef.current?.focus()
  }

  const dateKey = slot ? toDateKeyInZone(new Date(slot.startAt), timeZone) : null
  const dialogDate = dateKey ? formatDialogDate(dateKey) : ''
  const timeRange = slot ? formatTimeRange(slot, timeZone, hour12) : ''
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
              aria-invalid={nameError !== null}
              aria-describedby={nameError ? 'booking-name-error' : undefined}
              className={cn(inputClass, nameError && 'border-destructive')}
            />
            {nameError && (
              <p id="booking-name-error" className="text-[13px] text-destructive">
                {nameError}
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
              onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
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
              maxLength={500}
              aria-describedby="booking-comment-counter"
              className={cn(inputClass, 'min-h-[80px] py-2.5')}
            />
            <div className="flex justify-end">
              <span id="booking-comment-counter" className="text-xs text-muted-foreground">
                {comment.length} / 500
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-guests">Гости</Label>
              <span className="text-xs text-muted-foreground">необязательно</span>
            </div>
            {guests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {guests.map((guest) => (
                  <span
                    key={guest}
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[13px] text-accent-foreground"
                  >
                    {guest}
                    <button
                      type="button"
                      aria-label={`Убрать гостя: ${guest}`}
                      onClick={() => setGuests((prev) => prev.filter((item) => item !== guest))}
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Input
              id="booking-guests"
              type="email"
              value={guestInput}
              onChange={(event) => setGuestInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addGuest()
                }
              }}
              onBlur={addGuest}
              placeholder="Email гостя и Enter"
              aria-invalid={guestError !== null}
              aria-describedby={guestError ? 'booking-guests-error' : undefined}
              className={cn(inputClass, guestError && 'border-destructive')}
            />
            {guestError && (
              <p id="booking-guests-error" className="text-[13px] text-destructive">
                {guestError}
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-label="Согласие на обработку персональных данных"
              className="mt-0.5 size-4 shrink-0 rounded border-input"
            />
            <span>Я согласен с обработкой персональных данных</span>
          </label>

          {!eventTypeId && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
              Для этого организатора не настроены типы встреч — бронирование недоступно.
            </p>
          )}

          {conflict && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
              Этот слот только что заняли. Выберите другое время.
            </p>
          )}

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
              <Button type="submit" disabled={!canSubmit || isSubmitting} className="h-11">
                {isSubmitting ? 'Отправка…' : 'Забронировать'}
              </Button>
            </DialogFooter>
          ) : (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
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
