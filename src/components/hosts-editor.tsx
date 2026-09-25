import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, api, call } from '@/api/sdk'
import { useActiveHost } from '@/hooks/use-active-host'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Список организаторов и создание нового (ADR-0021). Активный хост
// подсвечивается; создание сразу переключает панель на нового организатора.
export function HostsEditor() {
  const { hosts, activeSlug, setActiveSlug, reload } = useActiveHost()
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [timeZone, setTimeZone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const created = await call(
        api.hostsClient.createHost({
          slug: slug.trim(),
          name: name.trim(),
          timeZone: timeZone.trim() || undefined,
        }),
      )

      await reload()
      setActiveSlug(created.slug)
      setSlug('')
      setName('')
      setTimeZone('')
      setError(null)
      toast.success('Организатор создан')
    } catch (createError) {
      setError(
        createError instanceof ApiError ? createError.message : 'Не удалось создать организатора',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      <ul className="grid gap-2">
        {hosts.map((host) => {
          const isActive = host.slug === activeSlug || host.id === activeSlug

          return (
            <li
              key={host.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3',
                isActive && 'border-primary/60 bg-accent/40',
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{host.name}</p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {host.slug} · {host.timeZone}
                </p>
              </div>
              {isActive ? (
                <span className="flex items-center gap-1 text-[13px] font-medium text-primary">
                  <Check className="size-4" strokeWidth={2} aria-hidden="true" />
                  Активный
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSlug(host.slug)}
                >
                  Сделать активным
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleCreate} className="grid gap-3">
        <p className="flex items-center gap-2 font-medium">
          <Plus className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Новый организатор
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="host-name">Имя</Label>
            <Input
              id="host-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Анна"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="host-slug">Slug</Label>
            <Input
              id="host-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="anna"
              required
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="host-timezone">Часовой пояс (IANA)</Label>
            <Input
              id="host-timezone"
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
              placeholder="UTC"
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSaving || !slug.trim() || !name.trim()}>
          {isSaving ? 'Создание…' : 'Создать организатора'}
        </Button>
      </form>
    </div>
  )
}
