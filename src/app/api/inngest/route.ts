import { serve } from "inngest/next"
import { inngest, processImageFunction } from "@/lib/inngest-client"

/**
 * @description
 * This file serves as the API endpoint for Inngest in a Next.js application.
 * It uses the `serve` utility from the `inngest/next` package to create the
 * necessary HTTP endpoints (GET, POST, PUT) that the Inngest platform uses to
 * communicate with your application. This includes triggering functions,
 * managing events, and handling other platform-level operations.
 *
 * @dependencies
 * - inngest/next: Provides the `serve` function for Next.js integration.
 * - @/lib/inngest-client: Imports the configured Inngest client and the defined functions.
 *
 * @notes
 * - Any new Inngest function must be added to the `functions` array to be registered
 *   and made available for execution.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processImageFunction // This registers our image processing function with Inngest.
  ]
})