"use server"

import { ActionState, FileValidationResult } from "@/types"

const MAX_FILE_SIZE_MB = 7
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"]

/**
 * @description
 * Server action to validate an uploaded file. It checks the file for size and
 * MIME type constraints before it is processed further. This provides a secure,
 * server-side validation layer in addition to client-side checks.
 *
 * @param {FormData} formData - The form data containing the file to validate. The file should be appended with the key "file".
 * @returns {Promise<ActionState<FileValidationResult>>} - An ActionState object. On success, it contains validation data. On failure, it contains an error message.
 *
 * @dependencies
 * - @/types (ActionState, FileValidationResult)
 *
 * @notes
 * - This action expects the file to be passed within a FormData object.
 * - Error messages are in Arabic, as per the project's requirements.
 * - This action provides an additional layer of security beyond client-side validation, which can be bypassed.
 */
export async function validateFileAction(
  formData: FormData
): Promise<ActionState<FileValidationResult>> {
  try {
    const file = formData.get("file") as File | null

    if (!file) {
      return {
        isSuccess: false,
        message: "لم يتم العثور على ملف."
      }
    }

    // Rule 1: Validate file size (must be <= 7MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        isSuccess: false,
        message: `حجم الملف يتجاوز ${MAX_FILE_SIZE_MB} ميجابايت المسموح`
      }
    }

    // Rule 2: Validate file type (must be PNG, JPEG, or WebP)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isSuccess: false,
        message: "صيغة الملف غير مدعومة. يرجى استخدام PNG أو JPEG أو WebP"
      }
    }

    // If all checks pass, return a success state with file metadata
    return {
      isSuccess: true,
      message: "تم التحقق من الملف بنجاح",
      data: {
        isValid: true,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name
      }
    }
  } catch (error) {
    console.error("File validation error:", error)
    return {
      isSuccess: false,
      message: "فشل في التحقق من الملف بسبب خطأ غير متوقع."
    }
  }
}