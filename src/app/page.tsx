"use server"

import { Suspense } from "react"
import ImageEditor from "@/components/image-editor/image-editor"
import MainLayout from "@/components/rtl-layout/main-layout"

/**
 * @description
 * This is the main page for the AI-Powered Arabic Image Editor.
 * It sets up the main layout and renders the core ImageEditor component.
 *
 * Key features:
 * - Uses a server component (`"use server"`) for initial rendering.
 * - Wraps the main content with the `MainLayout` component for a consistent look and feel.
 * - Includes a `<Suspense>` boundary to show a loading state while the `ImageEditor` component is being loaded.
 *
 * @dependencies
 * - React (Suspense): For handling loading states.
 * - ImageEditor: The primary client component for all image editing functionality.
 * - MainLayout: The shared layout component for the application.
 */
export default async function EditorPage() {
  return (
    <MainLayout>
      <div className="container mx-auto flex flex-col items-center justify-center gap-6 p-4 py-10 md:p-8 md:py-12">
        <div className="text-center">
          <p className="text-lg text-muted-foreground md:text-xl">
            أداة تعديل الصور بالذكاء الاصطناعي للناطقين باللغة العربية
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-64 w-full max-w-4xl animate-pulse rounded-xl bg-card"></div>
          }
        >
          <ImageEditor />
        </Suspense>
      </div>
    </MainLayout>
  )
}