import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError, cancelBookingV1 } from '@/api/client'
import { Button } from '@/components/ui/button'
import { host } from '@/config/host'

type Status = 'idle' | 'cancelling' | 'done' | 'error'

export default function CancelPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    if (!token) {
      setStatus('error')
      setError('Некорректная ссылка отмены')
      return
    }

    setStatus('cancelling')

    try {
      await cancelBookingV1(token)
      setStatus('done')
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

            {status === 'error' && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-6 flex gap-3">
              <Button onClick={handleCancel} disabled={status === 'cancelling'}>
                {status === 'cancelling' ? 'Отмена…' : 'Отменить встречу'}
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/book/${host.slug}`}>Не отменять</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
