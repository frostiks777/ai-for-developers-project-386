import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TimeZoneSelect } from './timezone-select'

const onChange = vi.fn()

describe('TimeZoneSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('показывает список поясов и текущее значение', () => {
    render(<TimeZoneSelect value="UTC" onChange={onChange} />)

    expect(screen.getByLabelText('Часовой пояс')).toHaveValue('UTC')
    expect(screen.getByRole('option', { name: /Europe\/Moscow/ })).toBeInTheDocument()
  })

  it('вызывает onChange при выборе другого пояса', async () => {
    const user = userEvent.setup()
    render(<TimeZoneSelect value="UTC" onChange={onChange} />)

    await user.selectOptions(screen.getByLabelText('Часовой пояс'), 'Europe/Berlin')

    expect(onChange).toHaveBeenCalledWith('Europe/Berlin')
  })
})