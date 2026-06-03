"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  title?: string
  backHref?: string
}

export function Header({ title = "APC Honors Checker", backHref }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-secondary active:scale-[0.98] transition-transform">
                <ArrowLeft className="h-4 w-4 text-primary" />
              </Button>
            </Link>
          )}
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
