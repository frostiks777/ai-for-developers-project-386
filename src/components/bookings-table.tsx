import { Button } from '@/components/ui/button'
import type { BookingWithSlot } from '@/types/booking'
import { defaultTimeZone, formatDateTimeInZone } from '@/utils/timezone'

interface BookingsTableProps {
  bookings: BookingWithSlot[]
  onCancel: (id: number) => void
}

export function BookingsTable({ bookings, onCancel }: BookingsTableProps) {
  if (bookings.length === 0) {
    return <p className="text-muted-foreground">Пока нет ни одной брони</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Когда</th>
            <th className="px-4 py-2 font-medium">Клиент</th>
            <th className="px-4 py-2 font-medium">Контакты</th>
            <th className="px-4 py-2 font-medium">Комментарий</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t">
              <td className="px-4 py-2 align-top">
                {formatDateTimeInZone(booking.startAt, defaultTimeZone)}
                <span className="block text-xs text-muted-foreground">
                  {booking.durationMin} мин
                </span>
              </td>
              <td className="px-4 py-2 align-top">{booking.name}</td>
              <td className="px-4 py-2 align-top">
                <span className="block">{booking.email}</span>
                {booking.phone && (
                  <span className="block text-xs text-muted-foreground">{booking.phone}</span>
                )}
              </td>
              <td className="px-4 py-2 align-top text-muted-foreground">
                {booking.comment || '—'}
              </td>
              <td className="px-4 py-2 align-top text-right">
                <Button variant="outline" size="sm" onClick={() => onCancel(booking.id)}>
                  Отменить
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
