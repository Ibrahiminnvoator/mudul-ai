/**
 * @description
 * This file contains all the type definitions related to image handling,
 * processing, and validation for the application.
 */

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
  
  /**
   * @description
   * Represents the result of a successful file validation.
   * This data is returned by the `validateFileAction` server action.
   *
   * @property {true} isValid - A literal type indicating the validation was successful.
   * @property {string} fileName - The original name of the validated file.
   * @property {number} fileSize - The size of the file in bytes.
   * @property {string} fileType - The MIME type of the file (e.g., 'image/png').
   */
  export interface FileValidationResult {
    isValid: true
    fileName: string
    fileSize: number
    fileType: string
  }