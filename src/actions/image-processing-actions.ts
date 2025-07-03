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
 * @returns {Promise<ActionState<ProcessImageResponse>>} - An ActionState object containing the job ID (run ID) if successful.
 */
export async function processImageAction(
  request: ProcessImageRequest
): Promise<ActionState<ProcessImageResponse>> {
  try {
    if (!request.imageData || !request.prompt || !request.mimeType) {
      return { isSuccess: false, message: "بيانات الطلب غير كاملة." }
    }

    // The 'ids' array contains the unique run ID for this specific event trigger.
    // This is the ID we will use for polling the job's status.
    const { ids } = await inngest.send({
      name: "image.process",
      data: {
        imageData: request.imageData,
        prompt: request.prompt,
        mimeType: request.mimeType
      }
    })

    const runId = ids[0]
    if (!runId) {
      throw new Error("Failed to dispatch job to Inngest or received no run ID.")
    }

    return {
      isSuccess: true,
      message: "تم بدء معالجة الصورة بنجاح.",
      data: {
        jobId: runId, // We use the runId as the jobId for polling
        estimatedTime: 60
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
 * Retrieves the status of a specific image processing job run from Inngest's Platform API.
 * This function now makes a direct, authenticated GET request to the Inngest API.
 *
 * @param {string} runId - The ID of the job run to check.
 * @returns {Promise<ActionState<ProcessingStatusResponse>>} - The current status of the job.
 */
export async function getProcessingStatusAction(
  runId: string
): Promise<ActionState<ProcessingStatusResponse>> {
  try {
    const apiKey = process.env.INNGEST_API_KEY
    if (!apiKey) {
      throw new Error("INNGEST_API_KEY is not configured on the server.")
    }

    // Fetch the job run status directly from the Inngest Platform API.
    const response = await fetch(`https://api.inngest.com/v1/runs/${runId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(
        `Failed to fetch job status from Inngest API. Status: ${response.status}`,
        errorBody
      )
      return {
        isSuccess: false,
        message: `فشل في الحصول على حالة المهمة من Inngest (Code: ${response.status}).`
      }
    }

    const jobRun = await response.json()

    // Map Inngest API status to our application's status enum.
    let status: ProcessingStatusResponse["status"] = "PENDING"
    if (jobRun.status === "completed") status = "COMPLETED"
    else if (jobRun.status === "failed") status = "FAILED"
    else if (jobRun.status === "running") status = "PROCESSING"

    return {
      isSuccess: true,
      message: "تم استرداد حالة المهمة بنجاح.",
      data: {
        status,
        // For completed jobs, the result is in the `output` property.
        result: jobRun.output,
        // For failed jobs, the error message is in the `error` property.
        error: jobRun.error?.message || undefined
      }
    }
  } catch (error) {
    console.error(`Error getting job status for run ID ${runId}:`, error)
    return { isSuccess: false, message: "فشل في الحصول على حالة المعالجة." }
  }
}