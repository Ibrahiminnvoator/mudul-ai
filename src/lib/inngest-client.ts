"use server"

import { Inngest } from "inngest"
import { geminiClient } from "@/lib/gemini-client"
/**
 * @description
 * This file configures the Inngest client and defines the background functions
 * that will be executed by the Inngest worker.
 *
 * @dependencies
 * - inngest: The Inngest SDK for creating and managing background jobs.
 * - @/lib/gemini-client: The custom client for interacting with the Google Gemini API.
 */

// Create an Inngest client to send and receive events.
// The ID should be unique to your application.
export const inngest = new Inngest({ id: "معدل-ai-editor" })

/**
 * @description
 * An Inngest background function that processes an image using the Gemini API.
 * This function is triggered by the "image.process" event.
 *
 * @param {object} context - The Inngest function context, containing the event and step utilities.
 * @property {object} context.event - The event that triggered the function. Contains the image data, prompt, and MIME type.
 * @property {object} context.step - The Inngest step utility for running idempotent operations.
 *
 * @returns {Promise<object>} - An object containing the event and the body of the response, which includes the processed image data.
 */
export const processImageFunction = inngest.createFunction(
  {
    id: "process-image-with-gemini",
    // Configure retries for infrastructure-level resilience (e.g., network issues).
    retries: 2, // Total 3 attempts (1 initial + 2 retries).
    name: "Process Image with Gemini"
  },
  { event: "image.process" },
  async ({ event, step }) => {
    const { imageData, prompt, mimeType } = event.data

    // Use step.run to make the API call idempotent. Inngest will not re-run this
    // step on a retry if it has already completed successfully.
    const result = await step.run("call-gemini-api-with-retry", async () => {
      // The geminiClient handles its own retry logic for API-specific errors like rate limits.
      return await geminiClient.editImageWithRetry(imageData, mimeType, prompt)
    })

    await step.sleep("wait-a-moment-before-completion", "1s")

    // The 'body' property of the return value becomes the output of the job.
    return { event, body: { ...result } }
  }
)