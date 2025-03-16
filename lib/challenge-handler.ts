// This utility helps detect and handle Vercel security challenges

// Challenge detection constants
const VERCEL_CHALLENGE_HEADER = "x-vercel-protection"
const CHALLENGE_COOKIE_NAME = "vercel-challenge-resolved"

/**
 * Checks if a response is a Vercel security challenge
 */
export function isVercelChallenge(response: Response): boolean {
  const isChallenge =
    response.status === 403 &&
    (response.headers.get(VERCEL_CHALLENGE_HEADER) !== null || response.url.includes("_vercel/protection/challenge"))

  if (isChallenge) {
    console.log("[VERCEL CHALLENGE DETECTED] 🛡️", {
      url: response.url,
      status: response.status,
      hasProtectionHeader: response.headers.get(VERCEL_CHALLENGE_HEADER) !== null,
      timestamp: new Date().toISOString(),
    })
  }

  return isChallenge
}

/**
 * Handles a Vercel challenge by redirecting to a full-page navigation
 * that can properly resolve the challenge
 *
 * @param originalUrl The URL that was being requested when the challenge occurred
 * @param returnUrl The URL to return to after resolving the challenge
 */
export function handleVercelChallenge(originalUrl: string, returnUrl: string = window.location.href): void {
  console.log("[VERCEL CHALLENGE HANDLING] ⚙️", {
    originalUrl,
    returnUrl,
    timestamp: new Date().toISOString(),
    action: "Redirecting to challenge resolution page",
  })

  // Create a challenge resolution URL
  // We'll use a simple API endpoint that will trigger the challenge in a full page context
  const challengeResolutionUrl = `/api/resolve-challenge?originalUrl=${encodeURIComponent(
    originalUrl,
  )}&returnUrl=${encodeURIComponent(returnUrl)}`

  // Redirect to the challenge resolution page
  window.location.href = challengeResolutionUrl
}

/**
 * Wraps a fetch call with Vercel challenge detection and handling
 */
export async function fetchWithChallengeHandling(url: string, options?: RequestInit): Promise<Response> {
  console.log("[FETCH WITH CHALLENGE HANDLING] 🔄", {
    url,
    method: options?.method || "GET",
    timestamp: new Date().toISOString(),
    action: "Starting fetch request with challenge handling",
  })

  try {
    const response = await fetch(url, options)

    // Check if the response is a Vercel challenge
    if (isVercelChallenge(response)) {
      console.log("[VERCEL CHALLENGE REDIRECT] 🔀", {
        url,
        status: response.status,
        timestamp: new Date().toISOString(),
        action: "Redirecting to resolve challenge",
      })

      // Handle the challenge by redirecting
      handleVercelChallenge(url)

      // This will never be reached due to the redirect,
      // but we need to return something to satisfy TypeScript
      throw new Error("Handling Vercel challenge")
    }

    console.log("[FETCH COMPLETED] ✅", {
      url,
      status: response.status,
      timestamp: new Date().toISOString(),
    })

    return response
  } catch (error) {
    // If this is our special error for challenge handling, log it differently
    if (error instanceof Error && error.message === "Handling Vercel challenge") {
      console.log("[CHALLENGE HANDLING IN PROGRESS] ⏳", {
        url,
        timestamp: new Date().toISOString(),
      })
      throw error
    }

    // Log other errors
    console.error("[FETCH ERROR] ❌", {
      url,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    // Re-throw any other errors
    throw error
  }
}

