/*
 * ThemeToggle
 * ----------------------
 * Simple dark ↔ light toggle that works without external libraries.
 * Stores preference in localStorage and toggles the `dark` class on <html>.
 */

"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "./button"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false)

  // Hydrate initial state
  useEffect(() => {
    const root = window.document.documentElement
    const stored = window.localStorage.getItem("theme")
    const prefersDark =
      stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)

    root.classList.toggle("dark", prefersDark)
    setIsDark(prefersDark)
  }, [])

  function toggleTheme() {
    const root = window.document.documentElement
    const newIsDark = !isDark
    root.classList.toggle("dark", newIsDark)
    window.localStorage.setItem("theme", newIsDark ? "dark" : "light")
    setIsDark(newIsDark)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="text-foreground hover:bg-accent"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
