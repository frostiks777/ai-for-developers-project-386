import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import type { AvailabilityRules } from '@/types/availability'
import type { BookingWithSlot } from '@/types/booking'
import {
  defaultTimeZone,
  formatDayTitle,
  toDateKeyInZone,
} from '@/utils/timezone'
import DashboardPage from './dashboard-page'

const booking: BookingWithSlot = {
  id: 1,
  slotId: 10,
  name: 'Иван',
  phone: '+79000000000',
  email: 'ivan@example.com',
  comment: 'Обсудить архитектуру',
  createdAt: '2026-09-23T10:00:00.000Z',
  startAt: '2099-09-24T07:00:00.000Z',
  durationMin: 30,
}

const defaultRules: AvailabilityRules = {
  weekdays: [1, 2, 3, 4, 5],
  windowStartHour: 10,
  windowEndHour: 18,
  slotDurationMin: 30,
  bufferMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
}

function mockFetch(initialBookings: BookingWithSlot[] = [booking]) {
  let bookings = [...initialBookings]

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'

    if (url === '/api/bookings' && method === 'GET') {
      return new Response(JSON.stringify(bookings), { status: 200 })
    }

    if (url.startsWith('/api/bookings/') && method === 'DELETE') {
      const id = Number(url.split('/').pop())
      bookings = bookings.filter((item) => item.id !== id)
      return new Response(null, { status: 204 })
    }

    if (url === '/api/availability' && method === 'GET') {
      return new Response(JSON.stringify(defaultRules), { status: 200 })
    }

    if (url === '/api/availability' && method === 'PUT') {
      return new Response(String(init?.body), { status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Не найдено' }), { status: 404 })
  })
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает список броней и настройки доступности', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderDashboard()

    expect(await screen.findByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('Обсудить архитектуру')).toBeInTheDocument()

    expect(await screen.findByRole('button', { name: 'Сохранить' })).toBeEnabled()
    expect(screen.getByLabelText('Пн')).toBeChecked()
    expect(screen.getByLabelText('Сб')).not.toBeChecked()
  })

  it('отменяет бронь и убирает её из списка', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDashboard()

    const cancel = await screen.findByRole('button', { name: 'Отменить' })
    await user.click(cancel)

    await waitFor(() => expect(screen.queryByText('Иван')).toBeNull())

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings/1',
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(screen.getByText('Пока нет ни одной брони')).toBeInTheDocument()
  })

  it('сохраняет изменённые настройки доступности', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDashboard()

    await screen.findByRole('button', { name: 'Сохранить' })

    const saturday = screen.getByLabelText('Сб')
    await user.click(saturday)
    expect(saturday).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(
        ([url, init]) => String(url) === '/api/availability' && init?.method === 'PUT',
      )
      expect(putCall).toBeDefined()
      const body = JSON.parse(String(putCall?.[1]?.body)) as AvailabilityRules
      expect(body.weekdays).toContain(6)
    })
  })

  it('блокирует сохранение, если не выбран ни один рабочий день', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderDashboard()

    await screen.findByRole('button', { name: 'Сохранить' })

    for (const label of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']) {
      await user.click(screen.getByLabelText(label))
    }

    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    expect(screen.getByText('Выберите хотя бы один рабочий день')).toBeInTheDocument()
  })

  it('показывает пустой список, если броней нет', async () => {
    vi.stubGlobal('fetch', mockFetch([]))
    renderDashboard()

    expect(await screen.findByText('Пока нет ни одной брони')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Отменить' })).toBeNull()
  })
})

describe('BookingsTable', () => {
  it('не показывает телефон, если он не указан', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ...booking, phone: null }]))
    renderDashboard()

    const row = (await screen.findByText('Иван')).closest('li')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).queryByText('+79000000000')).toBeNull()
  })
})

describe('DashboardPage grouping and filter', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('группирует брони по дням', async () => {
    const second: BookingWithSlot = {
      ...booking,
      id: 2,
      slotId: 11,
      name: 'Мария',
      email: 'maria@example.com',
      comment: null,
      startAt: '2099-09-25T07:00:00.000Z',
    }
    vi.stubGlobal('fetch', mockFetch([booking, second]))
    renderDashboard()

    expect(await screen.findByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('Мария')).toBeInTheDocument()

    const firstHeading = formatDayTitle(
      toDateKeyInZone(new Date(booking.startAt), defaultTimeZone),
    )
    const secondHeading = formatDayTitle(
      toDateKeyInZone(new Date(second.startAt), defaultTimeZone),
    )
    expect(screen.getByRole('heading', { name: firstHeading })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: secondHeading })).toBeInTheDocument()
  })

  it('фильтр «Сегодня» скрывает завтрашнюю бронь', async () => {
    const now = new Date()
    const todayBooking: BookingWithSlot = {
      ...booking,
      id: 3,
      slotId: 12,
      name: 'Сегодняшний',
      startAt: now.toISOString(),
    }
    const tomorrowBooking: BookingWithSlot = {
      ...booking,
      id: 4,
      slotId: 13,
      name: 'Завтрашний',
      startAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }
    vi.stubGlobal('fetch', mockFetch([todayBooking, tomorrowBooking]))
    renderDashboard()

    const user = userEvent.setup()
    expect(await screen.findByText('Сегодняшний')).toBeInTheDocument()
    expect(screen.getByText('Завтрашний')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Сегодня' }))

    await waitFor(() => expect(screen.queryByText('Завтрашний')).toBeNull())
    expect(screen.getByText('Сегодняшний')).toBeInTheDocument()
  })

  it('показывает подсказку о числе слотов', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderDashboard()

    expect(await screen.findByText('≈ 12 слотов в рабочий день')).toBeInTheDocument()
  })
})
