import { render, screen } from '@testing-library/react'
import { App } from './App'

vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
)

describe('App', () => {
  it('показывает заголовок страницы', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Календарь звонков' })).toBeInTheDocument()
  })

  it('показывает слоты, полученные от API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 1, startAt: '2026-09-22T07:00:00.000Z', durationMin: 30, isBooked: false },
        ]),
        { status: 200 },
      ),
    )

    render(<App />)

    expect(await screen.findByRole('button', { name: 'Забронировать' })).toBeInTheDocument()
  })
})
