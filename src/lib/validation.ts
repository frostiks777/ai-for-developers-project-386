import { z } from 'zod'

const phonePattern = /^\+?[\d\s()-]+$/

// Телефон (необязательный): только цифры и разделители, 10–15 цифр (E.164)
function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return phonePattern.test(value) && digits.length >= 10 && digits.length <= 15
}

// Зеркало серверной схемы (server/validation.ts) — менять только согласованно
export const createBookingSchema = z.object({
  slotId: z.int().positive('Некорректный слот'),
  name: z.string().trim().min(2, 'Имя от 2 символов'),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || isValidPhone(value), 'Неверный номер телефона'),
  email: z.string().trim().pipe(z.email('Неверный email')),
  comment: z
    .string()
    .trim()
    .max(500, 'Комментарий слишком длинный')
    .optional()
    .transform((value) => value || undefined),
})

// Правила доступности организатора (зеркало server/validation.ts)
export const availabilityRulesSchema = z
  .object({
    weekdays: z.array(z.int().min(0).max(6)).min(1, 'Выберите хотя бы один рабочий день'),
    windowStartHour: z.int().min(0, 'Начало не раньше 0:00').max(23, 'Начало не позже 23:00'),
    windowEndHour: z.int().min(1, 'Конец не раньше 1:00').max(24, 'Конец не позже 24:00'),
    slotDurationMin: z.int().min(5, 'Слот не короче 5 минут').max(480, 'Слот не длиннее 8 часов'),
    bufferMin: z.int().min(0, 'Буфер не может быть отрицательным').max(480, 'Буфер не длиннее 8 часов'),
    minNoticeMin: z.int().min(0).max(10080, 'Не больше недели'),
    horizonDays: z.int().min(1, 'Горизонт не меньше дня').max(90, 'Горизонт не больше 90 дней'),
  })
  .refine((rules) => rules.windowEndHour > rules.windowStartHour, {
    message: 'Конец окна должен быть позже начала',
    path: ['windowEndHour'],
  })

// Блокировка времени (зеркало server/validation.ts): интервал + причина
export const timeBlockFormSchema = z
  .object({
    startAt: z.string().trim().min(1, 'Укажите начало'),
    endAt: z.string().trim().min(1, 'Укажите конец'),
    reason: z.string().trim().max(500, 'Причина слишком длинная'),
  })
  .refine((block) => Date.parse(block.endAt) > Date.parse(block.startAt), {
    message: 'Конец должен быть позже начала',
    path: ['endAt'],
  })

export type TimeBlockFormValue = z.infer<typeof timeBlockFormSchema>
