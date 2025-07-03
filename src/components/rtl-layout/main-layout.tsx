"use client"

import React from "react"
import ThemeToggle from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

/**
 * @description
 * MainLayout provides a consistent RTL-first page structure for the application.
 * It includes a sticky header with the application title, a main content area,
 * and a simple footer. This component ensures that all pages share a common
 * look and feel, adhering to the RTL design principles.
 *
 * Key features:
 * - Full RTL support.
 * - Sticky, responsive header with the application title.
 * - A flexible main content area for page-specific components.
 * - A simple, clean footer.
 * - Uses custom Arabic fonts (`font-cairo`) defined in the root layout.
 *
 * @dependencies
 * - React: For component rendering.
 * - cn (from lib/utils): For conditional class name merging.
 *
 * @notes
 * - The navigation `<nav>` element is a placeholder for future additions.
 * - The footer text is a placeholder and can be updated as needed.
 */
export default function MainLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card text-foreground">
        <div className="container flex h-16 items-center">
          <div className="flex flex-1 items-center justify-between">
            <h1
              className={cn(
                "font-cairo text-2xl font-bold tracking-tight", // text-foreground is inherited from header
                "md:text-3xl"
              )}
            >
              مُعَدِّل
            </h1>
            <nav className="flex items-center space-x-4 rtl:space-x-reverse">
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-right">
            صُنع بحب بواسطة الذكاء الاصطناعي ❤️
          </p>
        </div>
      </footer>
    </div>
  )
}