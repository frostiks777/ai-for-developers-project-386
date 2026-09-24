import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { HostSettings } from '@/types/host'
import { App } from './App'

const settings: HostSettings = {
  id: 'host-1',
  slug: 'default',
  name: 'Организатор',
  timezone: 'UTC',
  createdAt: '2026-09-01T00:00:00.000Z',
  availability: {
    weekdays: [1, 2, 3, 4, 5],
    windowStartHour: 10,
    windowEndHour: 18,
    slotDurationMin: 30,
    bufferMin: 10,
    minNoticeMin: 120,
    horizonDays: 14,
  },
}

const slot = {
  id: 1,
  startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  isBooked: false,
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)

    if (url === '/api/v1/hosts/default/settings') {
      return new Response(JSON.stringify(settings), { status: 200 })
    }

    if (url === '/api/v1/hosts/default/slots') {
      return new Response(JSON.stringify([slot]), { status: 200 })
    }

    return new Response(JSON.stringify([]), { status: 200 })
  })
}

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('на главной показывает лендинг со ссылкой на запись', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Календарь звонков' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Выбрать время/ })).toHaveAttribute(
      'href',
      '/book/default',
    )
  })

  it('на /book/:slug показывает слоты, полученные от API', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderApp('/book/default')

    expect(await screen.findByRole('button', { name: 'Забронировать' })).toBeInTheDocument()
  })

  it('на неизвестном хосте показывает «Страница не найдена»', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderApp('/book/unknown')

    expect(await screen.findByRole('heading', { name: 'Страница не найдена' })).toBeInTheDocument()
  })
})
