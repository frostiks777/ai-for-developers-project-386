import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { jsonResponse, requestPath } from '@/test/http'
import type { TimeSlot } from '@/types/booking'
import { toDateKeyInZone } from '@/utils/timezone'
import HomePage from './home-page'

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/book/default']}>
      <Routes>
        <Route path="/book/:slug" element={<HomePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const slot: TimeSlot = {
  id: 1,
  startAt: '2099-09-24T07:00:00.000Z',
  durationMin: 30,
  isBooked: false,
}

const eventType = {
  id: 'type-1',
  hostId: 'host-1',
  slug: 'consultation',
  title: 'Консультация',
  description: null,
  durationMin: 30,
  locationType: 'online' as const,
  isActive: true,
  createdAt: '2026-09-24 10:00:00',
}

function mockFetch(slots: TimeSlot[] = [slot]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestPath(input)

    if (url.startsWith('/api/v1/hosts/default/slots')) {
      return jsonResponse({
        timeZone: 'UTC',
        date: null,
        slots: slots.map((item) => ({
          id: item.id,
          startAt: item.startAt,
          durationMin: item.durationMin,
          available: !item.isBooked,
        })),
      })
    }

    if (url === '/api/v1/hosts/default/event-types') {
      return jsonResponse([eventType])
    }

    if (url === '/api/v1/hosts/default/bookings' && init?.method === 'POST') {
      return jsonResponse(
        {
          id: 'booking-token',
          hostSlug: 'default',
          eventTypeId: 'type-1',
          startAt: slot.startAt,
          endAt: slot.startAt,
          status: 'confirmed',
          clientName: 'Иван',
          clientEmail: 'ivan@example.com',
          clientPhone: '+79000000000',
          clientNotes: null,
          createdAt: '2099-09-23T07:00:00.000Z',
        },
        201,
      )
    }

    if (url === '/api/v1/hosts/default/availability') {
      return jsonResponse({
        timeZone: 'UTC',
        slotDurationMin: 30,
        bufferMin: 10,
        minNoticeMin: 120,
        horizonDays: 14,
        ranges: [],
      })
    }

    return jsonResponse({ error: 'Не найдено' }, 404)
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

  it('на экране успеха есть ссылка для отмены', async () => {
    vi.stubGlobal('fetch', mockFetch())

    const user = userEvent.setup()
    renderHomePage()

    await bookSlot(user)

    const cancelLink = await screen.findByLabelText('Ссылка для отмены')
    expect((cancelLink as HTMLInputElement).value).toContain('/cancel/booking-token')
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

  it('автоматически выбирает первый свободный слот и переносит выбор по клику', async () => {
    const slots: TimeSlot[] = [
      { id: 1, startAt: new Date(2099, 8, 24, 7, 0).toISOString(), durationMin: 30, isBooked: true },
      { id: 2, startAt: new Date(2099, 8, 24, 8, 0).toISOString(), durationMin: 30, isBooked: false },
      { id: 3, startAt: new Date(2099, 8, 24, 9, 0).toISOString(), durationMin: 30, isBooked: false },
    ]
    vi.stubGlobal('fetch', mockFetch(slots))

    const user = userEvent.setup()
    renderHomePage()

    const confirm = await screen.findByRole('button', { name: 'Забронировать' })
    expect(confirm).toHaveAttribute('aria-pressed', 'true')
    expect(confirm).toHaveTextContent('08:00')

    await user.click(screen.getByRole('button', { name: '09:00' }))

    expect(screen.getByRole('button', { name: 'Забронировать' })).toHaveTextContent('09:00')
  })
})

describe('HomePage: мобильная раскладка', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.unstubAllGlobals()
    window.matchMedia = (() =>
      ({
        matches: false,
        media: '(min-width: 1024px)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList) as typeof window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('показывает ленту дат, раскрывает календарь по «Весь месяц» и одну кнопку «Забронировать»', async () => {
    const mobileSlot: TimeSlot = {
      id: 1,
      startAt: new Date(2099, 8, 24, 10, 0).toISOString(),
      durationMin: 30,
      isBooked: false,
    }
    vi.stubGlobal('fetch', mockFetch([mobileSlot]))

    const user = userEvent.setup()
    renderHomePage()

    const dateKey = toDateKeyInZone(
      new Date(mobileSlot.startAt),
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    )

    expect(await screen.findByRole('button', { name: dateKey })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Следующий месяц' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Весь месяц' }))

    expect(screen.getByRole('button', { name: 'Следующий месяц' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Забронировать' })).toHaveLength(1)
  })
})

describe('HomePage: выбор типа встречи', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('показывает типы и перезапрашивает слоты с выбранным типом', async () => {
    const types = [
      {
        id: 'type-1',
        hostId: 'host-1',
        slug: 'consultation',
        title: 'Консультация',
        description: null,
        durationMin: 30,
        locationType: 'online',
        isActive: true,
        createdAt: '2026-09-24 10:00:00',
      },
      {
        id: 'type-2',
        hostId: 'host-1',
        slug: 'deep-dive',
        title: 'Глубокая сессия',
        description: null,
        durationMin: 60,
        locationType: 'online',
        isActive: true,
        createdAt: '2026-09-24 10:00:00',
      },
    ]

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestPath(input)

      if (url === '/api/v1/hosts/default/event-types') {
        return jsonResponse(types)
      }

      if (url.startsWith('/api/v1/hosts/default/slots')) {
        return jsonResponse({
          timeZone: 'UTC',
          date: null,
          slots: [
            {
              id: 1,
              startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              durationMin: 30,
              available: true,
            },
          ],
        })
      }

      return jsonResponse({ error: 'Не найдено' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderHomePage()

    const radios = await screen.findAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Консультация/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await user.click(screen.getByRole('radio', { name: /Глубокая сессия/ }))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes('eventTypeId=type-2')),
      ).toBe(true),
    )
  })
})

