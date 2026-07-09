"use client"
import { Toaster } from "sonner"

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-sand/60 text-foreground rounded-2xl shadow-warm-lg font-sans font-semibold",
          success: "border-olive/30",
          error: "border-red-300",
          description: "text-muted-foreground font-normal",
        },
      }}
    />
  )
}
