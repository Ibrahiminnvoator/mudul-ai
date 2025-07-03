"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Ensure the API key is available
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.")
}

const genAI = new GoogleGenerativeAI(apiKey)

// The official model name for Gemini 1.5 Flash is "gemini-1.5-flash".
// We are using the correct model name as per the official documentation.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

/**
 * Processes an image with a text prompt using the Gemini API.
 * @param {string} imageData - The base64 encoded image data.
 * @param {string} mimeType - The MIME type of the image.
 * @param {string} prompt - The English text prompt for the edit.
 * @returns {Promise<{imageData: string, mimeType: string}>} - The processed image data.
 */
export async function processImageWithGemini(
  imageData: string,
  mimeType: string,
  prompt: string
) {
  try {
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType
      }
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = result.response

    // More robustly check for the returned image data
    const firstPart = response.candidates?.[0]?.content?.parts?.[0]

    if (
      firstPart &&
      "inlineData" in firstPart &&
      firstPart.inlineData &&
      typeof firstPart.inlineData.data === "string" &&
      typeof firstPart.inlineData.mimeType === "string"
    ) {
      // The check is successful, we can safely access the properties.
      return {
        imageData: firstPart.inlineData.data,
        mimeType: firstPart.inlineData.mimeType
      }
    } else {
      // Log the unexpected structure for debugging purposes
      console.error(
        "Invalid API response structure:",
        response.candidates?.[0]?.content
      )
      throw new Error(
        "No valid image was returned from the API, or the response format was unexpected."
      )
    }
  } catch (error) {
    console.error("Error processing image with Gemini:", error)
    // Handle specific API errors, e.g., rate limiting
    if (typeof error === "object" && error && "toString" in error && typeof (error as any).toString === "function" && (error as Error).toString().includes("429")) {
      throw new Error("تم تجاوز الحد المسموح. يرجى المحاولة بعد دقيقة")
    }
    // Re-throw as a more user-friendly error
    throw new Error("فشل في معالجة الصورة عبر Gemini API.")
  }
}