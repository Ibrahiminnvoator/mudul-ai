"use server"

import { Suspense } from "react"
import ImageEditor from "@/components/image-editor/image-editor"

export default async function EditorPage() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-6 p-4 md:p-8">
      <div className="text-center">
        <h1 className="font-cairo text-4xl font-bold tracking-tight lg:text-5xl">
          معدل
        </h1>
        <p className="mt-3 text-lg text-muted-foreground md:text-xl">
          أداة تعديل الصور بالذكاء الاصطناعي للناطقين باللغة العربية
        </p>
      </div>

      <Suspense fallback={<div className="h-64 w-full max-w-4xl animate-pulse rounded-xl bg-card"></div>}>
        <ImageEditor />
      </Suspense>
    </main>
  )
}