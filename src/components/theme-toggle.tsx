"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { flushSync } from "react-dom"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = (e: React.MouseEvent) => {
    const x = e.clientX
    const y = e.clientY
    const nextTheme = theme === "dark" ? "light" : "dark"

    if (!document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    document.documentElement.style.setProperty("--ripple-x", `${x}px`)
    document.documentElement.style.setProperty("--ripple-y", `${y}px`)

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
