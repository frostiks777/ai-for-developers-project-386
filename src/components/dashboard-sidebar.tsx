import { Calendar, CalendarOff, ExternalLink, List, ListChecks, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme-toggle'
import { host } from '@/config/host'
import { defaultTimeZone } from '@/utils/timezone'

interface DashboardSidebarProps {
  bookingCount: number
}

const AVAILABILITY_SECTION_ID = 'availability'
const EVENT_TYPES_SECTION_ID = 'event-types'
const BLOCKS_SECTION_ID = 'blocks'

function scrollToSection(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const section = document.getElementById(id)

  if (!section) {
    return
  }

  event.preventDefault()
  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

export function DashboardSidebar({ bookingCount }: DashboardSidebarProps) {

  return (
    <nav
      aria-label="Панель организатора"
      className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-1.5 self-start border-r bg-surface p-4"
    >
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Calendar className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <h1 className="text-[15px] font-semibold">Календарь звонков</h1>
      </div>

      <span
        aria-current="page"
        className="flex h-11 items-center gap-2.5 rounded-lg bg-accent px-3 text-[15px] font-semibold text-accent-foreground"
      >
        <List className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        Встречи
        <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs font-semibold">
          {bookingCount}
        </span>
      </span>
      <a
        href={`#${EVENT_TYPES_SECTION_ID}`}
        onClick={(event) => scrollToSection(event, EVENT_TYPES_SECTION_ID)}
        className="flex h-11 items-center gap-2.5 rounded-lg px-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ListChecks className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        Типы встреч
      </a>
      <a
        href={`#${AVAILABILITY_SECTION_ID}`}
        onClick={(event) => scrollToSection(event, AVAILABILITY_SECTION_ID)}
        className="flex h-11 items-center gap-2.5 rounded-lg px-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <SlidersHorizontal className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        Доступность
      </a>
      <a
        href={`#${BLOCKS_SECTION_ID}`}
        onClick={(event) => scrollToSection(event, BLOCKS_SECTION_ID)}
        className="flex h-11 items-center gap-2.5 rounded-lg px-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <CalendarOff className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        Блокировки
      </a>

      <div className="mt-auto flex flex-col gap-3 border-t pt-4">
        <Link
          to={`/book/${host.slug}`}
          className="flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ExternalLink className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Страница бронирования
        </Link>
        <div className="flex items-center justify-between gap-2 pl-3 pr-1">
          <span className="text-xs text-muted-foreground">Время: {defaultTimeZone}</span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
