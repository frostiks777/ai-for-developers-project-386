import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { HostSettings } from '@/types/host'
import LandingPage from './landing-page'

const settings: HostSettings = {
  id: 'host-1',
  slug: 'default',
  name: 'Анна Петрова',
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

function mockFetch(status = 200, body: unknown = settings) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }))
}

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('рассказывает про сервис и ведёт на запись', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderLanding()

    expect(await screen.findByText('Анна Петрова')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Выбрать время/ })).toHaveAttribute(
      'href',
      '/book/default',
    )
    expect(screen.getByRole('heading', { name: 'Как это работает' })).toBeInTheDocument()
  })

  it('показывает данные из конфига, если API недоступно', async () => {
    vi.stubGlobal('fetch', mockFetch(500, { error: 'Внутренняя ошибка' }))
    renderLanding()

    expect(await screen.findAllByText('Организатор')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /Записаться на звонок/ })).toHaveAttribute(
      'href',
      '/book/default',
    )
  })
})
