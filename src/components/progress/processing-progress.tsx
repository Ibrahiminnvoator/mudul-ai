"use client"

import { Hourglass } from "lucide-react"

/**
 * @description
 * A client component that displays an animated progress indicator and a message
 * to inform the user that their image is being processed. This component is
 * intended to be shown during long-running background tasks.
 *
 * Key features:
 * - Displays a clear, animated loading state.
 * - Uses Arabic text for user-facing messages.
 * - Provides visual feedback that the application is busy and not frozen.
 * - Accessible, with `role="status"` and `aria-live="polite"` to announce updates to screen readers.
 *
 * @dependencies
 * - lucide-react: For the hourglass icon.
 *
 * @notes
 * - This component currently shows an indeterminate progress state. It does not
 *   yet support a percentage-based progress bar, as the backend does not provide
 *   granular progress updates.
 */
export default function ProcessingProgress() {
  return (
    <div
      className="flex w-full flex-col items-center justify-center space-y-4 rounded-xl border bg-card p-8 shadow-sm"
      aria-live="polite"
      role="status"
    >
      <Hourglass className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <h3 className="font-cairo text-xl font-bold text-foreground">
          جاري معالجة الصورة...
        </h3>
        <p className="mt-2 text-muted-foreground">
          قد يستغرق هذا الأمر ما يصل إلى دقيقة. من فضلك لا تغلق هذه الصفحة.
        </p>
      </div>
    </div>
  )
}