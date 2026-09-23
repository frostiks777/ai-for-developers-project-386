import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import { BookingDialog } from './booking-dialog'
import type { TimeSlot } from '@/types/booking'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const slot: TimeSlot = {
  id: 1,
  startAt: '2026-09-22T07:00:00.000Z',
  durationMin: 30,
  isBooked: false,
}

const onOpenChange = vi.fn()
const onBooked = vi.fn()

function renderDialog() {
  return render(
    <BookingDialog slot={slot} open onOpenChange={onOpenChange} onBooked={onBooked} />,
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Имя'), 'Иван')
  await user.type(screen.getByLabelText('Телефон'), '+79000000000')
  await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
}

describe('BookingDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('показывает форму с данными слота', () => {
    renderDialog()

    expect(screen.getByRole('heading', { name: 'Бронирование звонка' })).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByLabelText('Телефон')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled()
  })

  it('включает кнопку отправки только после заполнения всех полей', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled()

    await user.type(screen.getByLabelText('Телефон'), '+7 900 000-00-00')
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled()

    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeEnabled()
  })

  it('не даёт отправить форму с невалидным email', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Телефон'), '+79000000000')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')

    expect(screen.getByText('Неверный email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled()
  })

  it('не даёт отправить форму с невалидным телефоном', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Телефон'), 'abcdef')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')

    expect(screen.getByText('Неверный номер телефона')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled()
  })

  it('бронирует слот, показывает уведомление и закрывает диалог', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: 1,
            slotId: 1,
            name: 'Иван',
            phone: '+79000000000',
            email: 'ivan@example.com',
            createdAt: '2026-09-22T07:00:00.000Z',
          }),
          { status: 201 },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDialog()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(toast.success).toHaveBeenCalledWith('Звонок забронирован')
    expect(onBooked).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('отправляет комментарий, если он заполнен', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: 1,
            slotId: 1,
            name: 'Иван',
            phone: '+79000000000',
            email: 'ivan@example.com',
            comment: 'Хочу обсудить проект',
            createdAt: '2026-09-22T07:00:00.000Z',
          }),
          { status: 201 },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDialog()

    await fillValidForm(user)
    await user.type(screen.getByLabelText('Комментарий'), 'Хочу обсудить проект')
    await user.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"comment":"Хочу обсудить проект"'),
      }),
    )
  })

  it('показывает ошибку, если слот уже занят', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ error: 'Слот уже занят' }), { status: 409 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDialog()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(toast.error).toHaveBeenCalledWith('Слот уже занят')
    expect(onBooked).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
