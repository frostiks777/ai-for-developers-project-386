import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { HostSettings } from '@/api/generated'
import { jsonResponse, requestPath } from '@/test/http'
import { App } from './App'

const settings: HostSettings = {
  slug: 'default',
  name: 'Организатор',
  timeZone: 'UTC',
}

const slot = {
  id: 1,
  startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  isBooked: false,
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = requestPath(input)

    if (url === '/api/v1/hosts/default/settings') {
      return jsonResponse(settings)
    }

    if (url === '/api/v1/hosts/default/slots') {
      return jsonResponse({
        timeZone: 'UTC',
        date: null,
        slots: [
          {
            id: slot.id,
            startAt: slot.startAt,
            durationMin: slot.durationMin,
            available: true,
          },
        ],
      })
    }

    return jsonResponse([])
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
