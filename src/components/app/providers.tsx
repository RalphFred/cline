"use client"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Toaster richColors closeButton position="top-right" />
      {children}
    </TooltipProvider>
  )
}
