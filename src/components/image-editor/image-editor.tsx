"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { X, Zap, Hourglass, AlertTriangle, Download } from "lucide-react"
import { ReactCompareSliderImage } from "react-compare-slider"

import { UploadedFile, ProcessingStatus } from "@/types"
import {
  processImageAction,
  getProcessingStatusAction
} from "@/actions/image-processing-actions"
import { validateFileAction } from "@/actions/file-validation-actions"
import { cn, formatBytes } from "@/lib/utils"
import { posthog } from "@/lib/posthog"

import DragDropUpload from "@/components/file-upload/drag-drop-upload"
import { Button } from "@/components/ui/button"
import { BeforeAfterSlider } from "@/components/image-editor/before-after-slider"
import ProcessingProgress from "@/components/progress/processing-progress"

/**
 * @description
 * This is the core client component for the image editor, now with integrated
 * PostHog analytics tracking. It manages the entire user workflow and sends
 * events at key interaction points.
 *
 * Key features:
 * - Tracks page views, file uploads, validation errors, and edit requests with PostHog.
 * - Integrates server-side validation via `validateFileAction`.
 * - Manages state for the entire editing process.
 * - Renders the `ProcessingProgress` component during background job execution.
 * - Polls for job status updates.
 *
 * @dependencies
 * - @/lib/posthog: The initialized PostHog client for analytics.
 */

// Helper to convert file to base64, removing the data URL prefix.
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
  })

export default function ImageEditor() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [prompt, setPrompt] = useState("")
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<ProcessingStatus>("PENDING")
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollingRef = useRef<NodeJS.Timeout>()
  const processingStartRef = useRef<number | null>(null)

  // Track page view on component mount
  useEffect(() => {
    posthog.capture("page_view", { page: "image_editor" })
  }, [])

  const resetState = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    processingStartRef.current = null
    setUploadedFile(null)
    setPrompt("")
    setJobId(null)
    setStatus("PENDING")
    setProcessedImageUrl(null)
    setError(null)
  }

  const handleRemoveImage = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview)
    }
    resetState()
  }

  const handleFileSelect = async (file: File) => {
    resetState()
    setError(null)

    posthog.capture("file_upload_started", {
      file_size: file.size,
      file_type: file.type
    })

    const formData = new FormData()
    formData.append("file", file)

    const result = await validateFileAction(formData)

    if (!result.isSuccess) {
      setError(result.message)
      setUploadedFile(null)
      posthog.capture("validation_error", {
        error_type: result.message.includes("حجم") ? "file_size" : "file_type",
        error_message: result.message,
        file_size: file.size,
        file_type: file.type
      })
      return
    }

    posthog.capture("file_upload_completed", {
      file_size: result.data.fileSize,
      file_type: result.data.fileType,
      validation_status: "success"
    })

    setUploadedFile({
      file,
      preview: URL.createObjectURL(file),
      errors: []
    })
  }

  const handleProcessImage = async () => {
    if (!uploadedFile || !prompt) {
      toast.error("خطأ", {
        description: "يرجى تحميل صورة وإدخال طلب تعديل."
      })
      return
    }

    setStatus("PROCESSING")
    setError(null)
    processingStartRef.current = Date.now()

    posthog.capture("edit_request_initiated", {
      prompt_length: prompt.length,
      image_size: uploadedFile.file.size
    })

    toast.loading("جاري بدء المعالجة...", {
      description: "سيتم تحويل الصورة إلى الخادم الآن."
    })

    try {
      const imageData = await toBase64(uploadedFile.file)
      const result = await processImageAction({
        imageData,
        mimeType: uploadedFile.file.type,
        prompt
      })

      if (result.isSuccess) {
        setJobId(result.data.jobId)
        toast.success("بدأت المعالجة بنجاح!", {
          description: `جاري التحقق من حالة المعالجة...`
        })
      } else {
        setStatus("FAILED")
        setError(result.message)
        posthog.capture("edit_request_completed", {
          status: "failed",
          error_type: "dispatch_error",
          error_message: result.message
        })
        toast.error("فشل", { description: result.message })
      }
    } catch (e: any) {
      setStatus("FAILED")
      setError(e.message)
      posthog.capture("edit_request_completed", {
        status: "failed",
        error_type: "client_error",
        error_message: e.message
      })
      toast.error("حدث خطأ فادح", { description: e.message })
    }
  }

  useEffect(() => {
    if (jobId && status === "PROCESSING") {
      pollingRef.current = setInterval(async () => {
        const statusResult = await getProcessingStatusAction(jobId)
        const duration = Date.now() - (processingStartRef.current || Date.now())

        if (statusResult.isSuccess) {
          const {
            status: newStatus,
            result,
            error: jobError
          } = statusResult.data

          if (newStatus === "COMPLETED") {
            clearInterval(pollingRef.current)
            setStatus("COMPLETED")
            const { imageData, mimeType } = result
            setProcessedImageUrl(`data:${mimeType};base64,${imageData}`)
            posthog.capture("edit_request_completed", {
              status: "success",
              processing_duration_ms: duration,
              job_id: jobId
            })
            toast.success("اكتمل التعديل!", {
              description: "صورتك الجديدة جاهزة للمعاينة."
            })
          } else if (newStatus === "FAILED") {
            clearInterval(pollingRef.current)
            setStatus("FAILED")
            setError(jobError || "فشل غير معروف في المهمة.")
            posthog.capture("edit_request_completed", {
              status: "failed",
              error_type: "processing_error",
              error_message: jobError,
              processing_duration_ms: duration,
              job_id: jobId
            })
            toast.error("فشلت المعالجة", { description: jobError })
          }
        } else {
          clearInterval(pollingRef.current)
          setStatus("FAILED")
          setError(statusResult.message)
          posthog.capture("edit_request_completed", {
            status: "failed",
            error_type: "polling_error",
            error_message: statusResult.message,
            processing_duration_ms: duration,
            job_id: jobId
          })
          toast.error("خطأ في التحقق", { description: statusResult.message })
        }
      }, 5000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [jobId, status])

  const isLoading = status === "PROCESSING"
  const isFinished = status === "COMPLETED"
  const isFailed = status === "FAILED"

  if (isFinished && uploadedFile && processedImageUrl) {
    return (
      <div className="w-full max-w-4xl">
        <BeforeAfterSlider
          before={
            <ReactCompareSliderImage
              src={uploadedFile.preview}
              alt="Image before edit"
            />
          }
          after={
            <ReactCompareSliderImage
              src={processedImageUrl}
              alt="Image after edit"
            />
          }
        />
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button onClick={handleRemoveImage} variant="outline" size="lg">
            البدء من جديد
          </Button>
          <Button asChild size="lg">
            <a
              href={processedImageUrl}
              download={`edited-${uploadedFile.file.name}`}
            >
              <Download className="ml-2 h-4 w-4" />
              تحميل الصورة
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl rounded-xl bg-card p-4 shadow-lg md:p-8">
      {!uploadedFile ? (
        <DragDropUpload
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
            <Image
              src={uploadedFile.preview}
              alt="Preview"
              fill
              className="object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full"
              onClick={handleRemoveImage}
              aria-label="إزالة الصورة"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
            {isFailed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/80">
                <AlertTriangle className="h-10 w-10 text-destructive-foreground" />
                <p className="mt-4 text-center font-cairo text-lg text-destructive-foreground">
                  فشلت المعالجة
                </p>
                <Button
                  onClick={handleProcessImage}
                  className="mt-4"
                  variant="secondary"
                >
                  حاول مرة أخرى
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            {isLoading ? (
              <ProcessingProgress />
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-cairo text-xl font-bold">
                    صورتك جاهزة للتعديل
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile.file.name} (
                    {formatBytes(uploadedFile.file.size)})
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="prompt"
                    className="font-cairo text-base font-semibold"
                  >
                    أدخل طلب التعديل (باللغة الإنجليزية)
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., 'remove the person in the background' or 'make the sky look like a van gogh painting'"
                    className="w-full resize-none rounded-md border bg-transparent p-2 text-left"
                    rows={3}
                    dir="ltr"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleProcessImage}
                  disabled={isLoading || !prompt.trim()}
                  size="lg"
                >
                  <Zap className="ml-2 h-4 w-4" />
                  ابدأ التعديل
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}