import { serve } from "inngest/next"
import { inngest, processImageFunction } from "@/lib/inngest-client"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processImageFunction, // The function that processes images
  ],
})