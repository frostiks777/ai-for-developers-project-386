import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import type { Booking as ApiBooking } from '@/api/generated'
import { ApiError, api, call } from '@/api/sdk'
import { useActiveHost } from '@/hooks/use-active-host'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultTimeZone, formatDateTimeInZone } from '@/utils/timezone'

type Status = 'idle' | 'cancelling' | 'done' | 'error'

export default function CancelPage() {
  const params = useParams<{ token?: string; uuid?: string }>()
  const token = params.token ?? params.uuid
  const { activeSlug } = useActiveHost()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const bookSlug = booking?.hostSlug ?? activeSlug

  useEffect(() => {
    if (!token) {
      return
    }

    let isActive = true

    call(api.bookingsClient.getBooking(token))
      .then((found) => {
        if (isActive) {
          setBooking(found)
        }
      })
      .catch(() => {
        // Детали необязательны: отмена всё равно доступна
      })

    return () => {
      isActive = false
    }
  }, [token])

  const openDialog = () => {
    if (!token) {
      setStatus('error')
      setError('Некорректная ссылка отмены')
      return
    }

    setError(null)
    setIsDialogOpen(true)
  }

  const handleCancel = async () => {
    if (!token) {
      setStatus('error')
      setError('Некорректная ссылка отмены')
      return
    }

    setStatus('cancelling')

    try {
      const trimmed = reason.trim()
      await call(
        api.bookingsClient.cancelBooking(token, {
          body: trimmed ? { reason: trimmed } : undefined,
        }),
      )
      setStatus('done')
      setIsDialogOpen(false)
    } catch (caught) {
      setStatus('error')
      setError(
        caught instanceof ApiError ? caught.message : 'Не удалось отменить встречу. Попробуйте позже.',
      )
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-16">
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        {status === 'done' ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Встреча отменена</h1>
            <p className="mt-2 text-muted-foreground">
              Слот снова свободен. Вы можете записаться на другое время.
            </p>
            <Button className="mt-6" asChild>
              <Link to={`/book/${bookSlug}`}>К списку слотов</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Отмена встречи</h1>
            <p className="mt-2 text-muted-foreground">
              Подтвердите отмену брони. Действие необратимо — слот снова станет доступным для
              других.
            </p>

            {booking && (
              <dl className="mt-5 grid gap-2 rounded-lg border bg-background p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Когда</dt>
                  <dd className="text-right font-medium">
                    {formatDateTimeInZone(
                      booking.startAt,
                      booking.timeZone ?? defaultTimeZone,
                    )}{' '}
                    ({booking.timeZone ?? defaultTimeZone})
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Длительность</dt>
                  <dd className="font-medium">
                    {Math.max(
                      1,
                      Math.round((Date.parse(booking.endAt) - Date.parse(booking.startAt)) / 60_000),
                    )}{' '}
                    мин
                  </dd>
                </div>
              </dl>
            )}

            {status === 'error' && !isDialogOpen && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <Button onClick={openDialog} disabled={status === 'cancelling'}>
                Отменить встречу
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/book/${bookSlug}`}>Не отменять</Link>
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вы уверены, что хотите отменить бронирование?</DialogTitle>
            <DialogDescription>
              Слот снова станет доступен для других гостей. Отменить действие нельзя.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancellation-reason">Причина отмены (необязательно)</Label>
            <Textarea
              id="cancellation-reason"
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Например: не смогу присутствовать"
            />
          </div>

          {status === 'error' && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Не отменять
            </Button>
            <Button onClick={handleCancel} disabled={status === 'cancelling'}>
              {status === 'cancelling' ? 'Отмена…' : 'Да, отменить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
