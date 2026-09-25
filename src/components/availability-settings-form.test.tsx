import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { AvailabilitySettings } from '@/types/availability-settings'
import { AvailabilitySettingsForm } from './availability-settings-form'

const settings: AvailabilitySettings = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
  ranges: [
    { weekday: 1, startMinute: 540, endMinute: 780 },
    { weekday: 1, startMinute: 840, endMinute: 1080 },
  ],
}

describe('AvailabilitySettingsForm', () => {
  it('показывает по кнопке удаления на каждый интервал дня', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    expect(screen.getByLabelText('Убрать интервал: Пн 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Убрать интервал: Пн 2')).toBeInTheDocument()
  })

  it('удаляет выбранный интервал, не трогая остальные', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByLabelText('Убрать интервал: Пн 1'))

    expect(screen.queryByRole('button', { name: /Убрать интервал/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Пн: начало 1')).toHaveValue('14:00')
  })

  it('показывает часовой пояс в шапке карточки', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    expect(screen.getByText('Часовой пояс: UTC')).toBeInTheDocument()
  })

  it('переключает день тогглом, убирая и возвращая интервалы', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    const toggle = screen.getByRole('switch', { name: 'Пн: доступность' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByLabelText('Пн: начало 1')).not.toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Пн: начало 1')).toBeInTheDocument()
  })

  it('добавляет интервал иконкой +', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Добавить интервал: Пн' }))

    expect(screen.getByLabelText('Пн: начало 3')).toBeInTheDocument()
  })

  it('применяет пресет ко всем рабочим дням', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Пн–Пт, 09:00–18:00' }))

    expect(screen.getByLabelText('Вт: начало 1')).toHaveValue('09:00')
    expect(screen.getByLabelText('Пт: конец 1')).toHaveValue('18:00')
    expect(screen.queryByRole('switch', { name: 'Сб: доступность' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('копирует интервалы дня на выбранные дни', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Скопировать интервал: Пн' }))
    await user.click(screen.getByLabelText('Вт'))
    await user.click(screen.getByRole('button', { name: 'Скопировать' }))

    expect(screen.getByLabelText('Вт: начало 1')).toHaveValue('09:00')
    expect(screen.getByLabelText('Вт: начало 2')).toHaveValue('14:00')
  })

  it('подсвечивает ошибку хронологии и блокирует сохранение', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Пн: конец 1'), { target: { value: '08:00' } })

    expect(screen.getByText('Время окончания должно быть позже времени начала')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('подсвечивает пересечение интервалов одного дня', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Пн: начало 2'), { target: { value: '12:00' } })

    expect(screen.getAllByText('Интервалы пересекаются')).toHaveLength(2)
  })
})
