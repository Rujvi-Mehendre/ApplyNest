"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", danger = false, loading, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-sand rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-rust font-extrabold">{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-muted-foreground -mt-2">{description}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border-sand text-sienna">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl font-bold border-0 ${danger ? "bg-red-600 hover:bg-red-700 text-white" : "gradient-copper text-white shadow-warm hover:opacity-90"}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
