import posthog from "posthog-js"

/**
 * @description
 * This file initializes the PostHog client for browser-side analytics.
 * It ensures that PostHog is only initialized in a client environment.
 * The configuration is set for manual event tracking to provide granular
 * control over the analytics data being captured.
 *
 * Key features:
 * - Safe initialization that only runs in the browser.
 * - Disables autocapture and automatic pageview tracking for manual control.
 * - Uses environment variables for the PostHog key and API host.
 *
 * @dependencies
 * - posthog-js: The official PostHog library for client-side tracking.
 *
 * @notes
 * - NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST must be set in
 *   the .env.local file for this to work.
 * - This module exports the initialized 'posthog' instance for use in other
 *   parts of the application.
 */
if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      // We manually capture page views and events for more control
      capture_pageview: false,
      autocapture: false
    })
  } else {
    console.warn("PostHog key is not configured. Analytics will be disabled.")
  }
}

// Export the posthog instance for use in components
export { posthog }