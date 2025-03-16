// Simple utility for handling Vercel security challenges

// Challenge detection constants
const VERCEL_CHALLENGE_HEADER = "x-vercel-protection"

/**
 * Checks if a response is a Vercel security challenge
 */
export function isVercelChallenge(response: Response): boolean {
  return (
    response.status === 403 &&
    (response.headers.get(VERCEL_CHALLENGE_HEADER) !== null || 
     response.url.includes("_vercel/protection/challenge"))
  )
}

/**
 * Handles a Vercel challenge by redirecting to the challenge resolution page
 */
export function handleVercelChallenge(originalUrl: string, returnUrl: string = window.location.href): void {
  // Create a challenge resolution URL
  const challengeResolutionUrl = `/api/resolve-challenge?originalUrl=${encodeURIComponent(
    originalUrl,
  )}&returnUrl=${encodeURIComponent(returnUrl)}`

  // Show a notification if possible
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Security Verification Required", {
      body: "Please complete the security verification to continue.",
      icon: "/favicon.ico"
    })
  }

  // Redirect to the challenge resolution page
  window.location.href = challengeResolutionUrl
}

/**
 * Wraps a fetch call with Vercel challenge handling
 */
export async function fetchWithChallengeHandling(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Always include credentials
    })

    // Check if the response is a Vercel challenge
    if (isVercelChallenge(response)) {
      // Handle the challenge by redirecting
      handleVercelChallenge(url)
      throw new Error("Handling Vercel challenge")
    }

    return response
  } catch {
    throw new Error("Failed to fetch")
  }
}

