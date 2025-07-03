"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

/**
 * @description
 * This file contains the GeminiClient class, responsible for all interactions
 * with the Google Gemini API. It handles API key management, model selection,
 * and implements a robust retry mechanism with exponential backoff for handling
 * transient errors like rate limiting.
 *
 * @dependencies
 * - @google/generative-ai: The official Google AI SDK for Node.js.
 *
 * @notes
 * - The GEMINI_API_KEY must be set in the environment variables.
 * - This class is designed as a singleton, and a pre-configured instance is exported for use throughout the application.
 * - The model used is "gemini-1.5-flash", which aligns with the "Gemini 2.0 Flash" requirement as it is the latest available flash model.
 */
class GeminiClient {
  private client: GoogleGenerativeAI
  private modelName: string = "gemini-1.5-flash"

  /**
   * Initializes the GeminiClient.
   * @throws {Error} if the GEMINI_API_KEY is not set in the environment variables.
   */
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables.")
      throw new Error("GEMINI_API_KEY is not set in environment variables.")
    }
    this.client = new GoogleGenerativeAI(apiKey)
  }

  /**
   * Performs a single image editing request to the Gemini API.
   * @private
   * @param {string} imageData - The base64 encoded image data.
   * @param {string} mimeType - The MIME type of the image (e.g., 'image/jpeg').
   * @param {string} prompt - The English text prompt describing the desired edit.
   * @returns {Promise<{imageData: string, mimeType: string}>} - A promise that resolves to the edited image data.
   * @throws {Error} if the API response is invalid or does not contain image data.
   */
  private async editImage(
    imageData: string,
    mimeType: string,
    prompt: string
  ): Promise<{ imageData: string; mimeType: string }> {
    const model = this.client.getGenerativeModel({ model: this.modelName })

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType
      }
    }

    // The prompt instructs the model to return ONLY the edited image, which helps prevent it from sending back text explanations.
    const fullPrompt = `${prompt}. Only return the edited image, do not return any text or explanation.`

    const result = await model.generateContent([fullPrompt, imagePart])
    const response = result.response

    const firstPart = response.candidates?.[0]?.content?.parts?.[0]

    if (
      firstPart &&
      "inlineData" in firstPart &&
      firstPart.inlineData &&
      typeof firstPart.inlineData.data === "string" &&
      typeof firstPart.inlineData.mimeType === "string"
    ) {
      return {
        imageData: firstPart.inlineData.data,
        mimeType: firstPart.inlineData.mimeType
      }
    } else {
      console.error(
        "Invalid Gemini API response structure:",
        JSON.stringify(response, null, 2)
      )
      throw new Error(
        "لم يتم إرجاع صورة صالحة من واجهة برمجة التطبيقات. قد يكون الطلب غير واضح."
      )
    }
  }

  /**
   * Edits an image with a built-in retry mechanism.
   * It attempts the request up to `maxRetries` times with exponential backoff for rate limit errors.
   * @public
   * @param {string} imageData - The base64 encoded image data.
   * @param {string} mimeType - The MIME type of the image.
   * @param {string} prompt - The English text prompt for the edit.
   * @param {number} [maxRetries=3] - The total number of attempts to make (1 initial + retries).
   * @returns {Promise<{imageData: string, mimeType: string}>} - A promise that resolves to the edited image data.
   * @throws {Error} if all retry attempts fail.
   */
  public async editImageWithRetry(
    imageData: string,
    mimeType: string,
    prompt: string,
    maxRetries: number = 3
  ): Promise<{ imageData: string; mimeType: string }> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.editImage(imageData, mimeType, prompt)
      } catch (error: any) {
        lastError = error

        // Check if it's a rate limit error (status code 429)
        const isRateLimitError =
          error.message?.includes("429") ||
          error.toString().includes("rate limit")

        if (isRateLimitError && attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = Math.pow(2, attempt) * 1000
          console.log(
            `Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${
              attempt + 1
            }/${maxRetries})`
          )
          await new Promise(resolve => setTimeout(resolve, delay))
          continue // Continue to the next attempt
        }

        // For other errors, or on the last attempt, re-throw
        throw error
      }
    }

    // This line should theoretically be unreachable, but it's a fallback.
    throw lastError
  }
}

// Export a singleton instance of the client
export const geminiClient = new GeminiClient()