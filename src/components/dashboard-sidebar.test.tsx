import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { DashboardSidebar } from './dashboard-sidebar'

function renderSidebar() {
  return render(
    <MemoryRouter>
      <DashboardSidebar bookingCount={2} />
      <section id="availability">Доступность</section>
      <section id="blocks">Блокировки</section>
    </MemoryRouter>,
  )
}

describe('DashboardSidebar', () => {
  it('скроллит к секции доступности по клику на ссылку', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const user = userEvent.setup()
    renderSidebar()

    await user.click(screen.getByRole('link', { name: 'Доступность' }))

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.instances[0]).toBe(screen.getByText('Доступность', { selector: 'section' }))
    expect(window.location.hash).toBe('#availability')

    scrollIntoView.mockRestore()
  })

  it('скроллит к секции блокировок по клику на ссылку', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const user = userEvent.setup()
    renderSidebar()

    await user.click(screen.getByRole('link', { name: 'Блокировки' }))

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.instances[0]).toBe(screen.getByText('Блокировки', { selector: 'section' }))
    expect(window.location.hash).toBe('#blocks')

    scrollIntoView.mockRestore()
  })

  it('не ломается, если целевой секции нет', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <DashboardSidebar bookingCount={0} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('link', { name: 'Типы встреч' }))

    expect(scrollIntoView).not.toHaveBeenCalled()
    scrollIntoView.mockRestore()
  })
})
