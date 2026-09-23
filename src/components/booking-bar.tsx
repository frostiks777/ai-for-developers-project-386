import { Button } from '@/components/ui/button'

interface BookingBarProps {
  dateTitle: string
  timeRange: string
  onConfirm: () => void
}

export function BookingBar({ dateTitle, timeRange, onConfirm }: BookingBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 pt-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{dateTitle}</p>
          <p className="text-[17px] font-bold">{timeRange}</p>
        </div>
        <Button
          type="button"
          onClick={onConfirm}
          className="h-[52px] shrink-0 rounded-xl px-5 text-base font-bold"
        >
          Забронировать
        </Button>
      </div>
    </div>
  )
}
