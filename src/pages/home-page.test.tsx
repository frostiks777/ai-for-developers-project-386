import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import type { TimeSlot } from '@/types/booking'
import HomePage from './home-page'

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

const slot: TimeSlot = {
  id: 1,
  startAt: '2099-09-24T07:00:00.000Z',
  durationMin: 30,
  isBooked: false,
}

function mockFetch(slots: TimeSlot[] = [slot]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)

    if (url === '/api/slots') {
      return new Response(JSON.stringify(slots), { status: 200 })
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
    renderHomePage()

    await bookSlot(user)

    expect(
      await screen.findByRole('heading', { name: 'Встреча успешно запланирована!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
  })

  it('на экране успеха есть экспорт в календарь', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)

    expect(await screen.findByRole('button', { name: 'Скачать .ics' })).toBeInTheDocument()
    const googleLink = screen.getByRole('link', { name: 'Добавить в Google Календарь' })
    expect(googleLink).toHaveAttribute('href', expect.stringContaining('calendar.google.com'))
  })

  it('кнопка «Выбрать другое время» возвращает к списку слотов', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)
    await user.click(await screen.findByRole('button', { name: 'Выбрать другое время' }))

    expect(await screen.findByRole('button', { name: 'Забронировать' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча успешно запланирована!' })).toBeNull()
  })

  it('кнопка «Назад» на экране успеха возвращает к списку слотов', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)
    await user.click(await screen.findByRole('button', { name: 'Назад' }))

    expect(await screen.findByRole('button', { name: 'Забронировать' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Встреча успешно запланирована!' })).toBeNull()
  })

  it('пересчитывает время слотов при смене часового пояса', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        { id: 1, startAt: '2099-09-24T07:00:00.000Z', durationMin: 30, isBooked: false },
      ]),
    )

    const user = userEvent.setup()
    renderHomePage()

    await screen.findByRole('button', { name: 'Забронировать' })

    await user.selectOptions(screen.getByLabelText('Часовой пояс'), 'UTC')

    expect(screen.getByText(/07:00/)).toBeInTheDocument()
  })

  it('фильтрует слоты по выбранной в календаре дате', async () => {
    const firstDay = new Date(2099, 8, 24, 10, 0)
    const secondDay = new Date(2099, 8, 25, 15, 0)
    const twoSlots: TimeSlot[] = [
      { id: 1, startAt: firstDay.toISOString(), durationMin: 30, isBooked: false },
      { id: 2, startAt: secondDay.toISOString(), durationMin: 30, isBooked: false },
    ]
    vi.stubGlobal('fetch', mockFetch(twoSlots))

    const user = userEvent.setup()
    renderHomePage()

    expect(await screen.findAllByRole('button', { name: 'Забронировать' })).toHaveLength(1)
    expect(screen.getByText(/10:00/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2099-09-25' }))

    expect(screen.getAllByRole('button', { name: 'Забронировать' })).toHaveLength(1)
    expect(screen.getByText(/15:00/)).toBeInTheDocument()
    expect(screen.queryByText(/10:00/)).toBeNull()
  })
})
