import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import CancelPage from './cancel-page'

function renderCancelPage(token = 'token-123') {
  return render(
    <MemoryRouter initialEntries={[`/cancel/${token}`]}>
      <Routes>
        <Route path="/cancel/:token" element={<CancelPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CancelPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('отменяет встречу по токену и показывает подтверждение', async () => {
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
            createdAt: '2099-09-23T07:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderCancelPage()

    await user.click(screen.getByRole('button', { name: 'Отменить встречу' }))

    expect(await screen.findByRole('heading', { name: 'Встреча отменена' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings/token-123/cancel'),
      expect.objectContaining({ method: 'POST' }),
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

    expect(await screen.findByText('Бронь не найдена')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча отменена' })).toBeNull()
  })
})
