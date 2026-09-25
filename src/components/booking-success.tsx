import { ArrowLeft, Calendar, Check, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { buildIcs, downloadIcs, googleCalendarUrl } from '@/utils/calendar'
import { formatDateTimeInZone } from '@/utils/timezone'

interface BookingSuccessProps {
  booking: CreatedBooking
  slot: TimeSlot
  timeZone: string
  eventTypeTitle?: string | null
  onReset: () => void
}

const endTimeFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('ru-RU', { timeZone, hour: '2-digit', minute: '2-digit' })

function formatTimeRange(slot: TimeSlot, timeZone: string): string {
  const start = new Date(slot.startAt)
  const end = new Date(start.getTime() + slot.durationMin * 60 * 1000)
  const startLabel = formatDateTimeInZone(slot.startAt, timeZone)
  const endLabel = endTimeFormatter(timeZone).format(end)

  return `${startLabel} — ${endLabel}`
}

export function BookingSuccess({
  booking,
  slot,
  timeZone,
  eventTypeTitle,
  onReset,
}: BookingSuccessProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const cancelUrl = `${window.location.origin}/cancel/${booking.cancelToken}`
  const calendarOptions = eventTypeTitle ? { title: eventTypeTitle } : undefined
  const googleUrl = googleCalendarUrl(booking, slot, calendarOptions)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cancelUrl)
      toast.success('Ссылка скопирована')
    } catch {
      toast.error('Не удалось скопировать ссылку')
    }
  }

  const handleDownload = () => {
    downloadIcs(`booking-${booking.id}.ics`, buildIcs(booking, slot, calendarOptions))
  }

  return (
    <section
      className={cn(
        'flex w-full flex-col',
        isDesktop
          ? 'mx-auto max-w-[600px] gap-4 rounded-card border bg-card p-8 pb-9 shadow-soft'
          : 'min-h-[60dvh] gap-3.5',
      )}
    >
      <Button
        variant="ghost"
        onClick={onReset}
        className="-ml-2 min-h-[44px] self-start px-2.5 text-sm font-medium shadow-none"
      >
        <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" />
        Назад
      </Button>

      <div
        className={cn(
          'flex flex-col',
          isDesktop ? 'items-start gap-4' : 'items-center gap-3.5 text-center',
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-full bg-success-soft text-success',
            isDesktop ? 'size-16' : 'size-20',
          )}
        >
          <Check
            className={isDesktop ? 'size-8' : 'size-10'}
            strokeWidth={isDesktop ? 2.4 : 2.6}
            aria-hidden="true"
          />
        </div>
        <h2
          className={cn(
            'font-serif font-semibold',
            isDesktop ? 'text-[30px]' : 'text-center text-[26px] leading-tight',
          )}
        >
          Встреча успешно запланирована!
        </h2>
        <p className="text-[15px] text-muted-foreground">
          {isDesktop
            ? 'Добавьте встречу в свой календарь, чтобы не пропустить звонок.'
            : 'Добавьте её в календарь, чтобы не пропустить.'}
        </p>
      </div>

      <dl
        className={cn(
          'text-[15px]',
          !isDesktop && 'rounded-2xl border border-border bg-card px-4',
        )}
      >
        <div
          className={cn(
            'flex justify-between gap-4 border-t py-3',
            isDesktop ? 'border-border' : 'border-transparent',
          )}
        >
          <dt className="text-muted-foreground">Когда</dt>
          <dd className="text-right font-semibold">{formatTimeRange(slot, timeZone)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border py-3">
          <dt className="text-muted-foreground">Длительность</dt>
          <dd className="text-right font-semibold">{slot.durationMin} мин</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border py-3">
          <dt className="text-muted-foreground">Имя</dt>
          <dd className="text-right font-semibold">{booking.name}</dd>
        </div>
        {booking.phone && (
          <div className="flex justify-between gap-4 border-t border-border py-3">
            <dt className="text-muted-foreground">Телефон</dt>
            <dd className="text-right font-semibold">{booking.phone}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-border py-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="text-right font-semibold">{booking.email}</dd>
        </div>
      </dl>

      <div className={cn('flex flex-col', isDesktop ? 'gap-2.5' : 'mt-auto gap-2.5 pt-2')}>
        {isDesktop ? (
          <div className="flex gap-2.5">
            <Button variant="outline" asChild className="h-11 flex-1">
              <a href={googleUrl} target="_blank" rel="noreferrer">
                <Calendar className="size-4" strokeWidth={1.8} aria-hidden="true" />
                Добавить в Google Календарь
              </a>
            </Button>
            <Button variant="outline" onClick={handleDownload} className="h-11 flex-1">
              <Download className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Скачать .ics
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="h-12 rounded-xl">
              <a href={googleUrl} target="_blank" rel="noreferrer" aria-label="Добавить в Google Календарь">
                <Calendar className="size-4" strokeWidth={1.8} aria-hidden="true" />
                Google
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="h-12 rounded-xl"
              aria-label="Скачать .ics"
            >
              <Download className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Файл .ics
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          asChild
          className={cn('w-full', isDesktop ? 'h-11' : 'h-12 rounded-xl')}
        >
          <Link to={`/reschedule/${booking.cancelToken}`}>Перенести</Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className={cn('w-full', isDesktop ? 'h-11' : 'h-12 rounded-xl')}
        >
          <Link to={`/cancel/${booking.cancelToken}`}>Отменить встречу</Link>
        </Button>

        <Button
          onClick={onReset}
          className={cn('w-full', isDesktop ? 'h-12' : 'h-14 rounded-2xl text-base font-bold')}
        >
          Выбрать другое время
        </Button>

        <div className="grid gap-2 pt-1">
          <p className="text-[13px] text-muted-foreground">
            Ссылка для отмены (сохраните её — по ней можно отменить встречу):
          </p>
          <div className={cn('flex gap-2', isDesktop ? 'flex-row' : 'flex-col')}>
            <Input
              readOnly
              value={cancelUrl}
              aria-label="Ссылка для отмены"
              className={cn(!isDesktop && 'h-12 rounded-xl text-base')}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className={cn('min-h-[44px] shrink-0', !isDesktop && 'h-12 rounded-xl')}
            >
              Скопировать
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
