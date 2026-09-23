import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimeSlot } from '@/types/booking'
import HomePage from './home-page'

const slot: TimeSlot = {
  id: 1,
  startAt: '2099-09-24T07:00:00.000Z',
  durationMin: 30,
  isBooked: false,
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)

    if (url === '/api/slots') {
      return new Response(JSON.stringify([slot]), { status: 200 })
    }

    if (url === '/api/bookings' && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          id: 1,
          slotId: slot.id,
          name: 'Иван',
          phone: '+79000000000',
          email: 'ivan@example.com',
          createdAt: '2099-09-23T07:00:00.000Z',
        }),
        { status: 201 },
      )
    }

    return new Response(JSON.stringify({ error: 'Не найдено' }), { status: 404 })
  })
}

async function bookSlot(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Забронировать' }))

  const dialog = screen.getByRole('dialog')

  await user.type(within(dialog).getByLabelText('Имя'), 'Иван')
  await user.type(within(dialog).getByLabelText('Телефон'), '+79000000000')
  await user.type(within(dialog).getByLabelText('Email'), 'ivan@example.com')
  await user.click(within(dialog).getByRole('button', { name: 'Забронировать' }))
}

describe('HomePage: экран успеха', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('после брони показывает экран успеха со сводкой', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    render(<HomePage />)

    await bookSlot(user)

    expect(
      await screen.findByRole('heading', { name: 'Встреча успешно запланирована!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
  })

  it('кнопка «Выбрать другое время» возвращает к списку слотов', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    render(<HomePage />)

    await bookSlot(user)
    await user.click(await screen.findByRole('button', { name: 'Выбрать другое время' }))

    expect(await screen.findByRole('button', { name: 'Забронировать' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча успешно запланирована!' })).toBeNull()
  })
})