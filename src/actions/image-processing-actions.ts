"use server"

import { inngest } from "@/lib/inngest-client"
import { ActionState } from "@/types"
import {
  ProcessImageRequest,
  ProcessImageResponse,
  ProcessingStatusResponse
} from "@/types/image-types"

/**
 * Initiates a background job to process an image.
 * @param {ProcessImageRequest} request - The request containing image data and prompt.
 * @returns {Promise<ActionState<ProcessImageResponse>>} - The state of the action with the job ID.
 */
export async function processImageAction(
  request: ProcessImageRequest
): Promise<ActionState<ProcessImageResponse>> {
  try {
    // Basic validation
    if (!request.imageData || !request.prompt || !request.mimeType) {
      return { isSuccess: false, message: "بيانات غير كاملة." }
    }

    // Trigger the Inngest background function
    const { ids } = await inngest.send({
      name: "image.process",
      data: {
        imageData: request.imageData,
        prompt: request.prompt,
        mimeType: request.mimeType
      }
    })
    
    const jobId = ids[0];

    return {
      isSuccess: true,
      message: "تم بدء معالجة الصورة بنجاح.",
      data: {
        jobId: jobId,
        estimatedTime: 60 // Estimated time in seconds
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
 * Retrieves the status of a specific processing job.
 * @param {string} jobId - The ID of the job to check.
 * @returns {Promise<ActionState<ProcessingStatusResponse>>} - The status of the job.
 */
export async function getJobStatusAction(
  jobId: string
): Promise<ActionState<ProcessingStatusResponse>> {
  try {
    const job = await inngest.jobs.get(jobId);

    if (!job) {
        return { isSuccess: false, message: "لم يتم العثور على المهمة." };
    }

    // Map Inngest status to our application status
    let status: ProcessingStatusResponse['status'] = 'PENDING';
    if(job.status === 'completed') status = 'COMPLETED';
    else if(job.status === 'failed') status = 'FAILED';
    else if (job.status === 'running') status = 'PROCESSING';


    return {
        isSuccess: true,
        message: "تم استرداد حالة المهمة بنجاح.",
        data: {
            status,
            result: job.output,
            error: job.status === 'failed' ? job.data.event.data?.error?.message || "فشل غير معروف" : undefined,
        }
    };

  } catch (error) {
    console.error("Error getting job status:", error)
    return { isSuccess: false, message: "فشل في الحصول على حالة المعالجة." }
  }
}