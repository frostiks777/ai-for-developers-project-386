import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ApiError, cancelBooking, fetchAvailability, fetchBookings, updateAvailability } from '@/api/client'
import { AvailabilityForm } from '@/components/availability-form'
import { BookingsTable } from '@/components/bookings-table'
import { ThemeToggle } from '@/components/theme-toggle'
import type { AvailabilityRules } from '@/types/availability'
import type { BookingWithSlot } from '@/types/booking'

export default function DashboardPage() {
  const [bookings, setBookings] = useState<BookingWithSlot[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  const [rules, setRules] = useState<AvailabilityRules | null>(null)
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [rulesError, setRulesError] = useState<string | null>(null)

  const loadBookings = useCallback(async () => {
    setIsLoadingBookings(true)

    try {
      setBookings(await fetchBookings())
      setBookingsError(null)
    } catch {
      setBookingsError('Не удалось загрузить брони')
    } finally {
      setIsLoadingBookings(false)
    }
  }, [])

  useEffect(() => {
    void loadBookings()
    void (async () => {
      try {
        setRules(await fetchAvailability())
        setRulesError(null)
      } catch {
        setRulesError('Не удалось загрузить настройки доступности')
      }
    })()
  }, [loadBookings])

  const handleCancel = async (id: number) => {
    try {
      await cancelBooking(id)
      toast.success('Бронь отменена')
      await loadBookings()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось отменить бронь')
    }
  }

  const handleSaveRules = async (next: AvailabilityRules): Promise<boolean> => {
    setIsSavingRules(true)

    try {
      const saved = await updateAvailability(next)
      setRules(saved)
      toast.success('Настройки сохранены')
      return true
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить настройки')
      return false
    } finally {
      setIsSavingRules(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Панель организатора</h1>
          <p className="mt-2 text-muted-foreground">
            Запланированные встречи и настройки доступности.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
            К странице бронирования
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Календарь встреч</h2>

        {isLoadingBookings && <p>Загрузка броней…</p>}
        {bookingsError && <p className="text-destructive">{bookingsError}</p>}
        {!isLoadingBookings && !bookingsError && (
          <BookingsTable bookings={bookings} onCancel={handleCancel} />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Настройки доступности</h2>

        {rulesError && <p className="text-destructive">{rulesError}</p>}
        {!rulesError && !rules && <p>Загрузка настроек…</p>}
        {rules && (
          <AvailabilityForm rules={rules} isSaving={isSavingRules} onSave={handleSaveRules} />
        )}
      </section>
    </div>
  )
}
