import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-2xl gradient-copper flex items-center justify-center shadow-warm text-lg flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-rust leading-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
    </div>
  )
}
