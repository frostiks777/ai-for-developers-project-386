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
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderCancelPage()

    await user.click(screen.getByRole('button', { name: 'Отменить встречу' }))

    expect(await screen.findByRole('heading', { name: 'Встреча отменена' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings/cancel',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('показывает ошибку, если бронь не найдена', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'Бронь не найдена' }), { status: 404 }),
      ),
    )

    const user = userEvent.setup()
    renderCancelPage()

    await user.click(screen.getByRole('button', { name: 'Отменить встречу' }))

    expect(await screen.findByText('Бронь не найдена')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча отменена' })).toBeNull()
  })
})
