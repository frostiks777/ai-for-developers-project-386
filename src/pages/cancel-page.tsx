import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError, api, call } from '@/api/sdk'
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
import { host } from '@/config/host'

type Status = 'idle' | 'cancelling' | 'done' | 'error'

export default function CancelPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reason, setReason] = useState('')

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
              <Link to={`/book/${host.slug}`}>К списку слотов</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Отмена встречи</h1>
            <p className="mt-2 text-muted-foreground">
              Подтвердите отмену брони. Действие необратимо — слот снова станет доступным для
              других.
            </p>

            {status === 'error' && !isDialogOpen && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <Button onClick={openDialog} disabled={status === 'cancelling'}>
                Отменить встречу
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/book/${host.slug}`}>Не отменять</Link>
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
