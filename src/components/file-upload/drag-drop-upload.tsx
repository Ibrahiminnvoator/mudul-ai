"use client"

import { useCallback, useState } from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import { Upload, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * @description
 * A reusable drag-and-drop file upload component with full RTL support and
 * client-side validation. It's designed to handle image uploads and provide
 * immediate, user-friendly feedback in Arabic.
 *
 * Key features:
 * - Implements drag-and-drop functionality using 'react-dropzone'.
 * - Validates file size (max 7MB) and type (PNG, JPEG, WebP) on the client side.
 * - Displays different UI states for idle, active drag, loading, and error conditions.
 * - Is fully accessible with ARIA attributes and focus management.
 * - All user-facing messages are in Arabic.
 *
 * @dependencies
 * - react (useCallback, useState): For component logic and state.
 * - react-dropzone: For core drag-and-drop functionality.
 * - lucide-react: For icons.
 * - @/lib/utils (cn): For conditional class name merging.
 *
 * @props
 * - onFileSelect: A callback function that receives the valid, accepted file.
 * - error: An optional error message string from the parent component to display.
 * - isLoading: A boolean to indicate if a process (like validation or upload) is running.
 */
interface DragDropUploadProps {
  onFileSelect: (file: File) => void
  error?: string | null
  isLoading?: boolean
}

const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7MB
const ACCEPTED_MIME_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpeg", ".jpg"],
  "image/webp": [".webp"]
}

export default function DragDropUpload({
  onFileSelect,
  error,
  isLoading
}: DragDropUploadProps) {
  const [dropzoneError, setDropzoneError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setDropzoneError(null) // Clear previous dropzone-specific errors

      if (fileRejections.length > 0) {
        const firstError = fileRejections[0].errors[0]
        if (firstError.code === "file-too-large") {
          setDropzoneError(`حجم الملف يتجاوز 7 ميجابايت المسموح`)
        } else if (firstError.code === "file-invalid-type") {
          setDropzoneError(
            `صيغة الملف غير مدعومة. يرجى استخدام PNG أو JPEG أو WebP`
          )
        } else {
          setDropzoneError(`حدث خطأ غير متوقع: ${firstError.message}`)
        }
        return
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isLoading,
    onDragEnter: () => setDropzoneError(null) // Clear errors when user retries
  })

  // Prioritize showing errors from the parent (e.g., server validation)
  const displayError = error || dropzoneError

  return (
    <div
      {...getRootProps()}
      role="button"
      aria-label="منطقة رفع الملفات، انقر أو اسحب ملفًا هنا"
      className={cn(
        "relative w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isDragActive && "border-primary bg-primary/10",
        displayError && "border-destructive bg-destructive/10",
        isLoading && "cursor-not-allowed opacity-50"
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center space-y-4">
        {isLoading ? (
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground" />
        )}

        <div className="text-center">
          <p className="font-cairo text-lg font-semibold text-foreground">
            {isLoading
              ? "جاري المعالجة..."
              : isDragActive
              ? "أفلت الصورة هنا"
              : "اسحب الصورة هنا أو انقر للاختيار"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PNG، JPEG، WebP - حتى 7 ميجابايت
          </p>
        </div>
      </div>

      {displayError && (
        <div className="mt-4 flex items-center justify-center text-sm text-destructive">
          <AlertCircle className="ml-2 h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  )
}