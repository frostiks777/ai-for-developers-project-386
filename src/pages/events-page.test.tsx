import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { Booking } from '@/api/generated'
import { BookingStatus } from '@/api/generated'
import { jsonResponse, requestPath } from '@/test/http'
import EventsPage from './events-page'

const futureBooking: Booking = {
  id: 'token-future',
  hostSlug: 'default',
  eventTypeId: 'default-consultation',
  startAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 26.5 * 60 * 60 * 1000).toISOString(),
  timeZone: 'UTC',
  status: BookingStatus.Confirmed,
  clientName: 'Иван',
  clientEmail: 'ivan@example.com',
  consentAccepted: true,
  createdAt: '2026-03-27T14:40:00.000Z',
}

const pastBooking: Booking = {
  ...futureBooking,
  id: 'token-past',
  clientName: 'Прошлый',
  startAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
}

const cancelledBooking: Booking = {
  ...futureBooking,
  id: 'token-cancelled',
  clientName: 'Отменённый',
  status: BookingStatus.Cancelled,
}

function mockFetch(bookings: Booking[]) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = requestPath(input)

    if (url === '/api/v1/hosts/default/bookings') {
      return jsonResponse(bookings)
    }

    return jsonResponse([])
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/events']}>
      <EventsPage />
    </MemoryRouter>,
  )
}

describe('EventsPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает только предстоящие активные брони', async () => {
    vi.stubGlobal('fetch', mockFetch([futureBooking, pastBooking, cancelledBooking]))
    renderPage()

    expect(await screen.findByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Прошлый')).toBeNull()
    expect(screen.queryByText('Отменённый')).toBeNull()
  })

  it('показывает пустое состояние без предстоящих событий', async () => {
    vi.stubGlobal('fetch', mockFetch([pastBooking]))
    renderPage()

    expect(await screen.findByText('Пока нет предстоящих встреч')).toBeInTheDocument()
  })
})
