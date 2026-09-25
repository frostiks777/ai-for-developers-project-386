import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { jsonResponse, requestPath } from '@/test/http'
import LandingPage from './landing-page'

const availability = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
  ranges: [],
}

const settings = { slug: 'default', name: 'Анна Петрова', timeZone: 'UTC' }

function mockFetch(status = 200) {
  return vi.fn(async (input: RequestInfo | URL) => {
    if (status !== 200) {
      return jsonResponse({ error: 'Внутренняя ошибка' }, status)
    }

    const url = requestPath(input)

    if (url === '/api/v1/hosts/default/availability') {
      return jsonResponse(availability)
    }

    return jsonResponse(settings)
  })
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
    vi.stubGlobal('fetch', mockFetch(500))
    renderLanding()

    expect(await screen.findAllByText('Организатор')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /Записаться на звонок/ })).toHaveAttribute(
      'href',
      '/book/default',
    )
  })
})
