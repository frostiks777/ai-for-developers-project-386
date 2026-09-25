import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { jsonResponse, requestPath } from '@/test/http'
import CancelPage from './cancel-page'

const apiBooking = {
  id: 'token-123',
  hostSlug: 'default',
  eventTypeId: 'type-1',
  startAt: '2099-09-24T07:00:00.000Z',
  endAt: '2099-09-24T07:30:00.000Z',
  timeZone: 'UTC',
  status: 'confirmed',
  clientName: 'Иван',
  clientEmail: 'ivan@example.com',
  clientPhone: null,
  clientNotes: null,
  consentAccepted: true,
  createdAt: '2099-09-23T07:00:00.000Z',
}

function renderCancelPage(token = 'token-123') {
  return render(
    <MemoryRouter initialEntries={[`/cancel/${token}`]}>
      <Routes>
        <Route path="/cancel/:token" element={<CancelPage />} />
        <Route path="/booking/:uuid/cancel" element={<CancelPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CancelPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('отменяет встречу по токену после подтверждения в модалке', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: 'token-123',
            hostSlug: 'default',
            eventTypeId: 'type-1',
            startAt: '2099-09-24T07:00:00.000Z',
            endAt: '2099-09-24T07:30:00.000Z',
            status: 'cancelled',
            clientName: 'Иван',
            clientEmail: 'ivan@example.com',
            clientPhone: null,
            clientNotes: null,
            cancellationReason: 'Передумал',
            createdAt: '2099-09-23T07:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderCancelPage()

    await user.click(screen.getByRole('button', { name: 'Отменить встречу' }))

    expect(
      await screen.findByText('Вы уверены, что хотите отменить бронирование?'),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Причина отмены (необязательно)'), 'Передумал')
    await user.click(screen.getByRole('button', { name: 'Да, отменить' }))

    expect(await screen.findByRole('heading', { name: 'Встреча отменена' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings/token-123/cancel'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Передумал'),
      }),
    )
  })

  it('показывает ошибку, если бронь не найдена', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Бронь не найдена' } }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    )

    const user = userEvent.setup()
    renderCancelPage()

    await user.click(screen.getByRole('button', { name: 'Отменить встречу' }))
    await user.click(await screen.findByRole('button', { name: 'Да, отменить' }))

    expect(await screen.findByText('Бронь не найдена')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча отменена' })).toBeNull()
  })

  it('показывает детали встречи и работает по маршруту /booking/:uuid/cancel', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (requestPath(input) === '/api/v1/bookings/token-123' && (init?.method ?? 'GET') === 'GET') {
        return jsonResponse(apiBooking)
      }

      return jsonResponse({ ...apiBooking, status: 'cancelled' })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/booking/token-123/cancel']}>
        <Routes>
          <Route path="/booking/:uuid/cancel" element={<CancelPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Когда')).toBeInTheDocument()
    expect(screen.getByText(/30 мин/)).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Отменить встречу' }))
    await user.click(await screen.findByRole('button', { name: 'Да, отменить' }))

    expect(await screen.findByRole('heading', { name: 'Встреча отменена' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings/token-123/cancel'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
