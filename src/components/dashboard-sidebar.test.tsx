import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { DashboardSidebar } from './dashboard-sidebar'

function renderSidebar() {
  return render(
    <MemoryRouter>
      <DashboardSidebar bookingCount={2} />
      <section id="availability">Доступность</section>
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
})
