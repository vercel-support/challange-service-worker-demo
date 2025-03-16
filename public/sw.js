// Simple service worker for handling Vercel challenges

// Constants for challenge detection
const VERCEL_CHALLENGE_HEADER = "x-vercel-protection"
const CHALLENGE_PATH_INDICATOR = "_vercel/protection/challenge"

/**
 * Detects if a response is a Vercel security challenge
 */
function isVercelChallenge(response) {
  // Check status code and headers
  if (response.status === 403) {
    // Check for Vercel challenge header
    if (response.headers.get(VERCEL_CHALLENGE_HEADER) !== null) {
      return true
    }

    // Check URL for challenge indicators
    if (response.url.includes(CHALLENGE_PATH_INDICATOR)) {
      return true
    }
  }

  return false
}

/**
 * Main fetch event handler
 */
self.addEventListener("fetch", (event) => {
  const request = event.request

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  event.respondWith(
    fetch(request)
      .then(async (response) => {
        // Check if the response is a Vercel challenge
        if (isVercelChallenge(response)) {
          // Clone the response before checking it
          const responseClone = response.clone()

          // Notify the main thread about the challenge
          self.clients.matchAll().then((clients) => {
            if (clients?.length) {
              // Send message to all controlled clients
              for (const client of clients) {
                client.postMessage({
                  type: "VERCEL_CHALLENGE_DETECTED",
                  url: request.url,
                  originalUrl: request.referrer || self.registration.scope
                })
              }
            }
          })

          // Pass through the challenge response
          return responseClone
        }

        return response
      })
      .catch((error) => {
        console.error("[SW] Fetch error:", error)
        throw error
      })
  )
})

// Log when the service worker is installed
self.addEventListener("install", () => {
  self.skipWaiting()
})

// Activate immediately
self.addEventListener("activate", () => {
  self.clients.claim()
})

