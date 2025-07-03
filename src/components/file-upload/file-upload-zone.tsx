"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFileAccepted: (file: File) => void
  disabled?: boolean
}

const MAX_SIZE_MB = 7
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const ACCEPTED_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"]
}

export default function FileUploadZone({
  onFileAccepted,
  disabled = false
}: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        const firstError = fileRejections[0].errors[0]
        let message = "حدث خطأ غير معروف."
        if (firstError.code === "file-too-large") {
          message = `حجم الملف يتجاوز ${MAX_SIZE_MB} ميجابايت المسموح.`
        } else if (firstError.code === "file-invalid-type") {
          message = "صيغة الملف غير مدعومة. يرجى استخدام PNG, JPEG, أو WebP."
        }
        toast.error("فشل التحميل", {
          description: message
        })
        return
      }

      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0])
      }
    },
    [onFileAccepted]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border p-8 text-center transition-colors duration-200 ease-in-out", // Removed border-2, border-dashed, border-muted-foreground/30, bg-background/20
        { "border-primary bg-accent": isDragActive }, // Replaced bg-primary/10 with bg-accent
        { "pointer-events-none opacity-50": disabled }
      )}
    >
      <input {...getInputProps()} />

      <div className="space-y-4">
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground transition-transform group-hover:scale-110" />
        {isDragActive ? (
          <p className="font-cairo text-lg font-semibold text-primary">
            أفلت الصورة هنا لبدء المعالجة
          </p>
        ) : (
          <div>
            <p className="font-cairo text-lg font-semibold">
              اسحب وأفلت صورتك هنا، أو انقر للاختيار
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              الحد الأقصى للحجم 7 ميجابايت (PNG, JPEG, WebP)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}