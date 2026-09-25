import { ArrowRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  linkTo?: string
  linkLabel?: string
  variant?: 'desktop' | 'mobile'
  tabs?: { to: string; label: string; active: boolean }[]
}

export function AppHeader({
  linkTo,
  linkLabel,
  variant = 'desktop',
  tabs,
}: AppHeaderProps) {
  const isMobile = variant === 'mobile'

  return (
    <header className={cn('border-b bg-surface', isMobile ? 'h-[60px]' : 'h-16')}>
      <div
        className={cn(
          'mx-auto flex h-full items-center justify-between gap-3',
          isMobile ? 'w-full max-w-md px-4' : 'max-w-[1140px] px-6',
        )}
      >
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
                isMobile ? 'size-7' : 'size-8',
              )}
            >
              <Calendar className={isMobile ? 'size-4' : 'size-[18px]'} strokeWidth={1.8} />
            </span>
            <h1 className={cn('font-semibold', isMobile ? 'text-[15px]' : 'text-base')}>
              Календарь звонков
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          {tabs ? (
            <nav aria-label="Основная навигация" className="flex items-center gap-1 rounded-full bg-secondary p-0.5">
              {tabs.map((tab) => (
                <Link
                  key={tab.to}
                  to={tab.to}
                  aria-current={tab.active ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                    tab.active
                      ? 'bg-card font-semibold text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          ) : (
            linkTo &&
            linkLabel && (
              <Link
                to={linkTo}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {linkLabel}
                {!isMobile && <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden="true" />}
              </Link>
            )
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
