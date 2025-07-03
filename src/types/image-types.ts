/**
 * @description
 * This file contains all the type definitions related to image handling,
 * processing, and validation for the application. It now includes the state
 * and action types for the ImageEditor component's reducer.
 */

// --- Existing Types ---

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
  
  export type ProcessingStatus = "IDLE" | "VALIDATING" | "READY" | "PROCESSING" | "SUCCESS" | "ERROR"
  
  
  export interface ProcessingStatusResponse {
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
    result?: any // Contains the processed image data on success
    error?: string
  }
  
  export interface FileValidationResult {
    isValid: true
    fileName: string
    fileSize: number
    fileType: string
  }
  
  
  // --- Reducer State and Action Types for ImageEditor ---
  
  /**
   * @description
   * Defines the complete state shape for the ImageEditor component's reducer.
   * This centralizes all component state into a single object.
   *
   * @property {ProcessingStatus} status - The current stage of the editor workflow.
   * @property {UploadedFile | null} uploadedFile - The file uploaded by the user.
   * @property {string} prompt - The English text prompt entered by the user.
   * @property {string | null} jobId - The ID of the background processing job from Inngest.
   * @property {string | null} processedImageUrl - The data URL of the successfully edited image.
   * @property {string | null} error - Any error message to be displayed to the user.
   */
  export interface ImageEditorState {
    status: Processing_Status
    uploadedFile: UploadedFile | null
    prompt: string
    jobId: string | null
    processedImageUrl: string | null
    error: string | null
  }
  
  
  /**
   * @description
   * A discriminated union of all possible actions that can be dispatched to the
   * ImageEditor's reducer. Each action type corresponds to a specific state transition.
   */
  export type ImageEditorAction =
    | { type: "VALIDATION_STARTED" }
    | { type: "VALIDATION_SUCCESS"; payload: { file: File } }
    | { type: "VALIDATION_FAILURE"; payload: { error: string } }
    | { type: "SET_PROMPT"; payload: { prompt: string } }
    | { type: "PROCESS_IMAGE_STARTED" }
    | { type: "PROCESS_IMAGE_DISPATCH_SUCCESS"; payload: { jobId: string } }
    | { type: "PROCESS_IMAGE_POLLING_SUCCESS"; payload: { imageUrl: string } }
    | { type: "PROCESS_IMAGE_FAILURE"; payload: { error: string } }
    | { type: "RESET" }
  
  // Renaming for clarity and to avoid conflict with existing ProcessingStatus
  export type Processing_Status = "IDLE" | "VALIDATING" | "READY" | "PROCESSING" | "SUCCESS" | "ERROR";