import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { V1Booking } from '@/types/booking'
import ReschedulePage from './reschedule-page'

const currentStart = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
const newStart = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()

const booking: V1Booking = {
  id: 'token-123',
  hostSlug: 'default',
  eventTypeId: 'type-1',
  startAt: currentStart,
  endAt: new Date(new Date(currentStart).getTime() + 30 * 60 * 1000).toISOString(),
  status: 'confirmed',
  clientName: 'Иван',
  clientEmail: 'ivan@example.com',
  clientPhone: null,
  clientNotes: null,
  createdAt: '2099-09-23T07:00:00.000Z',
}

const slotRows = [
  {
    id: 1,
    startAt: currentStart,
    durationMin: 30,
    available: false,
  },
  {
    id: 2,
    startAt: newStart,
    durationMin: 30,
    available: true,
  },
]

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'

    if (url === '/api/v1/bookings/token-123' && method === 'GET') {
      return new Response(JSON.stringify(booking), { status: 200 })
    }

    if (url.startsWith('/api/v1/hosts/default/slots') && method === 'GET') {
      return new Response(JSON.stringify({ timeZone: 'UTC', date: null, slots: slotRows }), {
        status: 200,
      })
    }

    if (url === '/api/v1/bookings/token-123/reschedule' && method === 'POST') {
      return new Response(JSON.stringify({ ...booking, startAt: newStart }), { status: 200 })
    }

    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Не найдено' } }), {
      status: 404,
    })
  })
}

function renderPage(token = 'token-123') {
  return render(
    <MemoryRouter initialEntries={[`/reschedule/${token}`]}>
      <Routes>
        <Route path="/reschedule/:token" element={<ReschedulePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReschedulePage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает текущее время и переносит на выбранный слот', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText(/Текущее время:/)).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Перенести сюда' }))

    expect(await screen.findByRole('heading', { name: 'Встреча перенесена' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/bookings/token-123/reschedule',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('показывает ошибку для недействительной ссылки', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Бронь не найдена' } }),
            { status: 404 },
          ),
      ),
    )

    renderPage('broken')

    expect(
      await screen.findByText('Бронь не найдена или ссылка недействительна'),
    ).toBeInTheDocument()
  })
})
