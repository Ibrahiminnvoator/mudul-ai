"use server"

import type { Metadata } from "next"
import { Inter, Amiri, Cairo } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri"
})
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-cairo"
})

export const metadata: Metadata = {
  title: "معدل (AI-Powered Arabic Image Editor)",
  description: "Edit photos using simple English text prompts with full RTL support."
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          amiri.variable,
          cairo.variable
        )}
      >
        {children}
        <Toaster richColors dir="rtl" />
      </body>
    </html>
  )
}