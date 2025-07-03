"use server"

import { Inngest } from "inngest"
import { processImageWithGemini } from "./gemini-client"

// Create a client to send and receive events
export const inngest = new Inngest({ id: "معدل-ai-editor" })

// Define the background function for image processing
export const processImageFunction = inngest.createFunction(
  {
    id: "process-image-with-gemini",
    // Configure retries for resilience
    retries: 2, // Total 3 attempts (1 initial + 2 retries)
    name: "Process Image with Gemini"
  },
  { event: "image.process" },
  async ({ event, step }) => {
    const { imageData, prompt, mimeType } = event.data

    const result = await step.run("call-gemini-api", async () => {
      return await processImageWithGemini(imageData, mimeType, prompt)
    })

    await step.sleep("wait-a-moment", "1s")

    return { event, body: { ...result } }
  }
)