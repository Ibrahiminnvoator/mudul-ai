"use client"

import { useReducer, useEffect, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { X, Zap, Download, AlertTriangle } from "lucide-react"
import { ReactCompareSliderImage } from "react-compare-slider"

import {
  UploadedFile,
  ImageEditorState,
  ImageEditorAction
} from "@/types"
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
 * This is the core client component for the image editor, now refactored to use
 * a `useReducer` hook for robust state management. It handles the entire user
 * workflow from file upload to final image download and tracks key events
 * using PostHog for analytics.
 *
 * Key features:
 * - Centralized state management using a reducer for predictable state transitions.
 * - Tracks page views, file uploads, validation errors, and edit requests with PostHog.
 * - Integrates server-side validation via `validateFileAction`.
 * - Renders different UI views based on the current state (upload, ready, processing, success, error).
 * - Polls for background job status updates and updates the state accordingly.
 */

// Helper to convert file to base64, removing the data URL prefix.
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Return only the base64 part
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
  })

const initialState: ImageEditorState = {
  status: "IDLE",
  uploadedFile: null,
  prompt: "",
  jobId: null,
  processedImageUrl: null,
  error: null
}

function imageEditorReducer(
  state: ImageEditorState,
  action: ImageEditorAction
): ImageEditorState {
  switch (action.type) {
    case "VALIDATION_STARTED":
      return { ...initialState, status: "VALIDATING" }
    case "VALIDATION_SUCCESS":
      return {
        ...state,
        status: "READY",
        error: null,
        uploadedFile: {
          file: action.payload.file,
          preview: URL.createObjectURL(action.payload.file),
          errors: []
        }
      }
    case "VALIDATION_FAILURE":
      return {
        ...state,
        status: "IDLE",
        error: action.payload.error
      }
    case "SET_PROMPT":
      return {
        ...state,
        prompt: action.payload.prompt
      }
    case "PROCESS_IMAGE_STARTED":
      return {
        ...state,
        status: "PROCESSING",
        error: null,
        jobId: null
      }
    case "PROCESS_IMAGE_DISPATCH_SUCCESS":
      return {
        ...state,
        jobId: action.payload.jobId
      }
    case "PROCESS_IMAGE_POLLING_SUCCESS":
      return {
        ...state,
        status: "SUCCESS",
        processedImageUrl: action.payload.imageUrl,
        jobId: null
      }
    case "PROCESS_IMAGE_FAILURE":
      return {
        ...state,
        status: "ERROR",
        error: action.payload.error,
        jobId: null
      }
    case "RESET":
      // Clean up the object URL before resetting
      if (state.uploadedFile?.preview) {
        URL.revokeObjectURL(state.uploadedFile.preview)
      }
      return initialState
    default:
      return state
  }
}

export default function ImageEditor() {
  const [state, dispatch] = useReducer(imageEditorReducer, initialState)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const processingStartRef = useRef<number | null>(null)

  // Track page view on component mount
  useEffect(() => {
    posthog.capture("page_view", { page: "image_editor" })
  }, [])

  const handleFileSelect = async (file: File) => {
    dispatch({ type: "VALIDATION_STARTED" })
    posthog.capture("file_upload_started", {
      file_size: file.size,
      file_type: file.type
    })

    const formData = new FormData()
    formData.append("file", file)

    const result = await validateFileAction(formData)

    if (!result.isSuccess) {
      dispatch({ type: "VALIDATION_FAILURE", payload: { error: result.message } })
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
    dispatch({ type: "VALIDATION_SUCCESS", payload: { file } })
  }

  const handleProcessImage = async () => {
    if (!state.uploadedFile || !state.prompt) {
      toast.error("خطأ", {
        description: "يرجى تحميل صورة وإدخال طلب تعديل."
      })
      return
    }

    dispatch({ type: "PROCESS_IMAGE_STARTED" })
    processingStartRef.current = Date.now()
    posthog.capture("edit_request_initiated", {
      prompt_length: state.prompt.length,
      image_size: state.uploadedFile.file.size
    })
    toast.loading("جاري بدء المعالجة...", {
      description: "سيتم تحويل الصورة إلى الخادم الآن."
    })

    try {
      const imageData = await toBase64(state.uploadedFile.file)
      const result = await processImageAction({
        imageData,
        mimeType: state.uploadedFile.file.type,
        prompt: state.prompt
      })

      if (result.isSuccess) {
        dispatch({ type: "PROCESS_IMAGE_DISPATCH_SUCCESS", payload: { jobId: result.data.jobId } })
        toast.success("بدأت المعالجة بنجاح!", {
          description: `جاري التحقق من حالة المعالجة...`
        })
      } else {
        dispatch({ type: "PROCESS_IMAGE_FAILURE", payload: { error: result.message } })
        posthog.capture("edit_request_completed", {
          status: "failed",
          error_type: "dispatch_error",
          error_message: result.message
        })
        toast.error("فشل", { description: result.message })
      }
    } catch (e: any) {
      const error = "حدث خطأ فادح أثناء تحضير الصورة."
      dispatch({ type: "PROCESS_IMAGE_FAILURE", payload: { error } })
      posthog.capture("edit_request_completed", {
        status: "failed",
        error_type: "client_error",
        error_message: e.message
      })
      toast.error(error, { description: e.message })
    }
  }

  useEffect(() => {
    if (state.jobId && state.status === "PROCESSING") {
      pollingRef.current = setInterval(async () => {
        const statusResult = await getProcessingStatusAction(state.jobId as string)
        const duration = Date.now() - (processingStartRef.current || Date.now())

        if (statusResult.isSuccess) {
          const {
            status: newStatus,
            result,
            error: jobError
          } = statusResult.data

          if (newStatus === "COMPLETED") {
            if (pollingRef.current) clearInterval(pollingRef.current)
            const { imageData, mimeType } = result
            const imageUrl = `data:${mimeType};base64,${imageData}`
            dispatch({ type: "PROCESS_IMAGE_POLLING_SUCCESS", payload: { imageUrl } })
            posthog.capture("edit_request_completed", {
              status: "success",
              processing_duration_ms: duration,
              job_id: state.jobId
            })
            toast.success("اكتمل التعديل!", {
              description: "صورتك الجديدة جاهزة للمعاينة."
            })
          } else if (newStatus === "FAILED") {
            if (pollingRef.current) clearInterval(pollingRef.current)
            const error = jobError || "فشل غير معروف في المهمة."
            dispatch({ type: "PROCESS_IMAGE_FAILURE", payload: { error } })
            posthog.capture("edit_request_completed", {
              status: "failed",
              error_type: "processing_error",
              error_message: error,
              processing_duration_ms: duration,
              job_id: state.jobId
            })
            toast.error("فشلت المعالجة", { description: error })
          }
        } else {
          if (pollingRef.current) clearInterval(pollingRef.current)
          const error = statusResult.message
          dispatch({ type: "PROCESS_IMAGE_FAILURE", payload: { error } })
          posthog.capture("edit_request_completed", {
            status: "failed",
            error_type: "polling_error",
            error_message: error,
            processing_duration_ms: duration,
            job_id: state.jobId
          })
          toast.error("خطأ في التحقق", { description: error })
        }
      }, 5000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [state.jobId, state.status])

  const isLoading = state.status === "VALIDATING" || state.status === "PROCESSING"
  const { uploadedFile, processedImageUrl, status, prompt, error } = state

  if (status === "SUCCESS" && uploadedFile && processedImageUrl) {
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
          <Button onClick={() => dispatch({ type: 'RESET' })} variant="outline" size="lg">
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
      {status === "IDLE" || status === "VALIDATING" ? (
        <DragDropUpload
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {uploadedFile && (
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
                onClick={() => dispatch({ type: 'RESET' })}
                aria-label="إزالة الصورة"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
              {status === "ERROR" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/80 p-4">
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
          )}

          <div className="flex flex-col justify-center">
            {status === "PROCESSING" ? (
              <ProcessingProgress />
            ) : (
              uploadedFile && (
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
                      onChange={e =>
                        dispatch({
                          type: "SET_PROMPT",
                          payload: { prompt: e.target.value }
                        })
                      }
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
                  {error && status === "ERROR" && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}