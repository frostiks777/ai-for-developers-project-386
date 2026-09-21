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
})
