"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 px-0"
        onClick={() => {
          if (theme === "light") {
            setTheme("dark")
          } else if (theme === "dark") {
            setTheme("system")
          } else {
            setTheme("light")
          }
        }}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <Monitor className="absolute h-4 w-4 rotate-90 scale-0 transition-all system:rotate-0 system:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  )
}
