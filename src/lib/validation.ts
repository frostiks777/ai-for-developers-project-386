import { z } from 'zod'

const phonePattern = /^\+?[\d\s()-]+$/

// Телефон: только цифры и разделители, 10–15 цифр (E.164)
function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return phonePattern.test(value) && digits.length >= 10 && digits.length <= 15
}

// Зеркало серверной схемы (server/validation.ts) — менять только согласованно
export const createBookingSchema = z.object({
  slotId: z.int().positive('Некорректный слот'),
  name: z.string().trim().min(1, 'Укажите имя'),
  phone: z.string().trim().min(1, 'Укажите телефон').refine(isValidPhone, 'Неверный номер телефона'),
  email: z.string().trim().pipe(z.email('Неверный email')),
})