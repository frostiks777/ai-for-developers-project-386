import { z } from 'zod'

// Зеркало серверной схемы (server/validation.ts) — менять только согласованно
export const createBookingSchema = z.object({
  slotId: z.int().positive('Некорректный слот'),
  name: z.string().trim().min(1, 'Укажите имя'),
  phone: z.string().trim().min(1, 'Укажите телефон'),
  email: z.string().trim().pipe(z.email('Неверный email')),
})