"use server"

import { inngest } from "@/lib/inngest-client"
import { ActionState } from "@/types"
import {
  ProcessImageRequest,
  ProcessImageResponse,
  ProcessingStatusResponse
} from "@/types/image-types"

/**
 * @description
 * This file contains server actions related to the image processing workflow.
 * It provides functions to initiate a processing job via Inngest and to check
 * the status of an ongoing job.
 */

/**
 * Initiates a background job via Inngest to process an image.
 * This action does not perform the editing itself but offloads it to a background worker.
 *
 * @param {ProcessImageRequest} request - The request containing the base64 image data, MIME type, and user prompt.
 * @returns {Promise<ActionState<ProcessImageResponse>>} - An ActionState object containing the job ID if successful.
 */
export async function processImageAction(
  request: ProcessImageRequest
): Promise<ActionState<ProcessImageResponse>> {
  try {
    // Basic validation to ensure all required data is present.
    if (!request.imageData || !request.prompt || !request.mimeType) {
      return { isSuccess: false, message: "بيانات الطلب غير كاملة." }
    }

    // Dispatch the 'image.process' event to Inngest.
    // Inngest will pick this up and execute the corresponding background function.
    const { ids } = await inngest.send({
      name: "image.process",
      data: {
        imageData: request.imageData,
        prompt: request.prompt,
        mimeType: request.mimeType
      }
    })

    const jobId = ids[0]
    if (!jobId) {
      throw new Error("Failed to dispatch job to Inngest.")
    }

    return {
      isSuccess: true,
      message: "تم بدء معالجة الصورة بنجاح.",
      data: {
        jobId: jobId,
        estimatedTime: 60 // Provide a static estimate in seconds.
      }
    }
  } catch (error) {
    console.error("Error dispatching image processing job:", error)
    return {
      isSuccess: false,
      message: "فشل في بدء معالجة الصورة. يرجى المحاولة مرة أخرى."
    }
  }
}

/**
 * Retrieves the status of a specific image processing job from Inngest.
 * This is used for polling from the client to update the UI.
 *
 * @param {string} jobId - The ID of the job to check.
 * @returns {Promise<ActionState<ProcessingStatusResponse>>} - The current status of the job, including the result or error if completed/failed.
 */
export async function getProcessingStatusAction(
  jobId: string
): Promise<ActionState<ProcessingStatusResponse>> {
  try {
    const job = await inngest.jobs.get(jobId)

    if (!job) {
      return { isSuccess: false, message: "لم يتم العثور على المهمة." }
    }

    // Map Inngest's internal status to our application-specific status enum.
    let status: ProcessingStatusResponse["status"] = "PENDING"
    if (job.status === "completed") status = "COMPLETED"
    else if (job.status === "failed") status = "FAILED"
    else if (job.status === "running") status = "PROCESSING"

    const jobError =
      job.status === "failed"
        ? (job.data.event.data as any)?.error?.message ||
          "فشل غير معروف في المهمة."
        : undefined

    return {
      isSuccess: true,
      message: "تم استرداد حالة المهمة بنجاح.",
      data: {
        status,
        // The result of a successful job is in the `output` property.
        // Our Inngest function returns { event, body }, so we need job.output.body
        result: job.output?.body,
        error: jobError
      }
    }
  } catch (error) {
    console.error(`Error getting job status for job ID ${jobId}:`, error)
    return { isSuccess: false, message: "فشل في الحصول على حالة المعالجة." }
  }
}