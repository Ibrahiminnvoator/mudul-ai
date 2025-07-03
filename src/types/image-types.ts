export interface UploadedFile {
    file: File
    preview: string
    errors: {
      code: string
      message: string
    }[]
  }
  
  export interface ProcessImageRequest {
    imageData: string // base64
    mimeType: string
    prompt: string
  }
  
  export interface ProcessImageResponse {
    jobId: string
    estimatedTime: number
  }
  
  export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  
  export interface ProcessingStatusResponse {
    status: ProcessingStatus
    result?: any // Contains the processed image data on success
    error?: string
  }