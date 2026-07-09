import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon = "🌸", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="text-5xl mb-4 select-none">{icon}</div>
      <h3 className="text-lg font-bold text-rust mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">{description}</p>}
      {action && (
        <Button
          onClick={action.onClick}
          className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
