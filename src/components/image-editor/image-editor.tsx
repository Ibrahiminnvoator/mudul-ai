"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { X, Zap, Hourglass, AlertTriangle, Download } from "lucide-react"

import { UploadedFile, ProcessingStatus } from "@/types"
import {
  processImageAction,
  getJobStatusAction
} from "@/actions/image-processing-actions"
import { cn, formatBytes } from "@/lib/utils"

import FileUploadZone from "@/components/file-upload/file-upload-zone"
import { Button } from "@/components/ui/button"
import { BeforeAfterSlider } from "@/components/image-editor/before-after-slider"


// Helper to convert file to base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // remove "data:mime/type;base64," prefix
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

  const resetState = () => {
    setUploadedFile(null)
    setPrompt("")
    setJobId(null)
    setStatus("PENDING")
    setProcessedImageUrl(null)
    setError(null)
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
  }
  
  const handleRemoveImage = () => {
      if (uploadedFile?.preview) {
        URL.revokeObjectURL(uploadedFile.preview)
      }
      resetState()
  }

  const handleFileAccepted = (file: File) => {
    resetState()
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
    toast.loading("جاري بدء المعالجة...", {
        description: "سيتم تحويل الصورة إلى الخادم الآن."
    });

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
          description: `مهمتك هي ${result.data.jobId}. سنقوم بالتحقق من الحالة.`
        })
      } else {
        setStatus("FAILED")
        setError(result.message)
        toast.error("فشل", { description: result.message })
      }
    } catch (e: any) {
      setStatus("FAILED")
      setError(e.message)
      toast.error("حدث خطأ فادح", { description: e.message })
    }
  }

  useEffect(() => {
    if (jobId && status === "PROCESSING") {
      pollingRef.current = setInterval(async () => {
        const statusResult = await getJobStatusAction(jobId)

        if (statusResult.isSuccess) {
          const { status: newStatus, result, error: jobError } = statusResult.data;
          
          if (newStatus === 'COMPLETED') {
            clearInterval(pollingRef.current)
            setStatus('COMPLETED')
            const { imageData, mimeType } = result.body;
            setProcessedImageUrl(`data:${mimeType};base64,${imageData}`);
            toast.success("اكتمل التعديل!", { description: "صورتك الجديدة جاهزة للمعاينة."});
          } else if (newStatus === 'FAILED') {
            clearInterval(pollingRef.current)
            setStatus('FAILED')
            setError(jobError || 'فشل غير معروف في المهمة.')
            toast.error("فشلت المعالجة", { description: jobError });
          }
          // if still processing, do nothing and wait for next poll
        } else {
          // Polling failed
          clearInterval(pollingRef.current)
          setStatus('FAILED')
          setError(statusResult.message)
          toast.error("خطأ في التحقق", { description: statusResult.message });
        }
      }, 5000) // Poll every 5 seconds
    }

    // Cleanup on unmount
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
                  before={uploadedFile.preview}
                  after={processedImageUrl}
              />
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Button onClick={handleRemoveImage} variant="outline" size="lg">
                    البدء من جديد
                  </Button>
                  <Button asChild size="lg">
                    <a href={processedImageUrl} download={`edited-${uploadedFile.file.name}`}>
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
        <FileUploadZone
          onFileAccepted={handleFileAccepted}
          disabled={isLoading}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
            <Image
              src={uploadedFile.preview}
              alt="Preview"
              fill
              objectFit="contain"
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
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <Hourglass className="h-10 w-10 animate-spin text-white" />
                <p className="mt-4 font-cairo text-lg text-white">جاري المعالجة...</p>
              </div>
            )}
             {isFailed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/80">
                <AlertTriangle className="h-10 w-10 text-destructive-foreground" />
                <p className="mt-4 font-cairo text-lg text-destructive-foreground">فشلت المعالجة</p>
                <Button onClick={handleRemoveImage} className="mt-4" variant="secondary">
                  حاول مرة أخرى
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h3 className="font-cairo text-xl font-bold">صورتك جاهزة للتعديل</h3>
              <p className="text-sm text-muted-foreground">
                {uploadedFile.file.name} ({formatBytes(uploadedFile.file.size)})
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="prompt" className="font-cairo text-base font-semibold">
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
              {isLoading ? (
                <>
                  <Hourglass className="ml-2 h-4 w-4 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Zap className="ml-2 h-4 w-4" />
                  ابدأ التعديل
                </>
              )}
            </Button>
             {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}