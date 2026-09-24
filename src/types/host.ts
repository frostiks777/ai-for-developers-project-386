import type { AvailabilityRules } from '@/types/availability'

// Хост и его правила доступности — зеркало server/types.ts (ответ /api/v1/hosts/:slug/settings)
export interface HostSettings {
  id: string
  slug: string
  name: string
  timezone: string
  createdAt: string
  availability: AvailabilityRules
}
