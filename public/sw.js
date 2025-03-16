// Enhance the logging in the service worker

// Constants for challenge detection
const VERCEL_CHALLENGE_HEADER = "x-vercel-protection"
const CHALLENGE_PATH_INDICATOR = "_vercel/protection/challenge"

/**
 * Detects if a response is a Vercel security challenge
 */
function isVercelChallenge(response) {
  // Check status code and headers
  if (response.status === 403) {
    // Try to check headers (may be limited due to CORS)
    if (response.headers.get(VERCEL_CHALLENGE_HEADER) !== null) {
      console.log("[SW] [VERCEL CHALLENGE DETECTED] 🛡️ via header", {
        url: response.url,
        timestamp: new Date().toISOString(),
      })
      return true
    }

    // Check URL for challenge indicators
    const url = response.url || ""
    if (url.includes(CHALLENGE_PATH_INDICATOR)) {
      console.log("[SW] [VERCEL CHALLENGE DETECTED] 🛡️ via URL pattern", {
        url: response.url,
        timestamp: new Date().toISOString(),
      })
      return true
    }

    // Log suspicious 403 responses that might be challenges
    console.log("[SW] [SUSPICIOUS 403] ⚠️", {
      url: response.url,
      status: response.status,
      timestamp: new Date().toISOString(),
    })
  }

  return false
}

/**
 * Main fetch event handler for the service worker
 */
self.addEventListener("fetch", (event) => {
  const request = event.request

  // Skip non-GET requests or browser extension requests
  if (request.method !== "GET" || request.url.startsWith("chrome-extension://")) {
    return
  }

  // Handle API and WebSocket requests differently
  if (request.url.includes("/api/") || request.url.includes("/socket.io/")) {
    console.log("[SW] [API/SOCKET REQUEST] 🔄", {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    })

    event.respondWith(
      fetch(request)
        .then((response) => {
          // Check if the response is a Vercel challenge
          if (isVercelChallenge(response)) {
            // Clone the response before checking it
            const responseClone = response.clone()

            console.log("[SW] [CHALLENGE DETECTED] 🛡️ Notifying main thread", {
              url: request.url,
              timestamp: new Date().toISOString(),
            })

            // Notify the main thread about the challenge
            self.clients.matchAll().then((clients) => {
              if (clients && clients.length) {
                // Send message to all controlled clients
                clients.forEach((client) => {
                  client.postMessage({
                    type: "VERCEL_CHALLENGE_DETECTED",
                    url: request.url,
                    originalUrl: request.referrer || self.registration.scope,
                    timestamp: new Date().toISOString(),
                  })
                })

                console.log("[SW] [MESSAGE SENT] 📤 Notified clients:", clients.length)
              } else {
                console.log("[SW] [WARNING] ⚠️ No clients to notify about challenge")
              }
            })

            // Pass through the challenge response
            return responseClone
          }

          // If not a challenge, proceed with normal caching strategy
          console.log("[SW] [RESPONSE OK] ✅", {
            url: request.url,
            status: response.status,
            timestamp: new Date().toISOString(),
          })

          return response
        })
        .catch((error) => {
          console.error("[SW] [FETCH ERROR] ❌", {
            url: request.url,
            error: error.message,
            timestamp: new Date().toISOString(),
          })
          throw error
        }),
    )
  } else {
    // For non-API requests, use your regular caching strategy
    // This is just an example - replace with your actual caching strategy
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log("[SW] [CACHE HIT] 📦", {
            url: request.url,
            timestamp: new Date().toISOString(),
          })
          return cachedResponse
        }

        console.log("[SW] [CACHE MISS] 🔍", {
          url: request.url,
          timestamp: new Date().toISOString(),
        })

        return fetch(request).then((response) => {
          // Check for Vercel challenge even on regular requests
          if (isVercelChallenge(response)) {
            return response
          }

          // Clone the response to store in cache
          const responseToCache = response.clone()

          // Open cache and store response
          caches.open("v1").then((cache) => {
            cache.put(request, responseToCache)
            console.log("[SW] [CACHED] 💾", {
              url: request.url,
              timestamp: new Date().toISOString(),
            })
          })

          return response
        })
      }),
    )
  }
})

/**
 * Listen for messages from the main thread
 */
self.addEventListener("message", (event) => {
  console.log("[SW] [MESSAGE RECEIVED] 📩", {
    type: event.data?.type,
    timestamp: new Date().toISOString(),
  })

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] [SKIP WAITING] ⏭️ Service worker activating immediately")
    self.skipWaiting()
  }

  // You can add more message handlers here if needed
})

// Log when the service worker is installed
self.addEventListener("install", (event) => {
  console.log("[SW] [INSTALLED] 🎉 Service worker installed", {
    timestamp: new Date().toISOString(),
  })
})

// Log when the service worker is activated
self.addEventListener("activate", (event) => {
  console.log("[SW] [ACTIVATED] ✨ Service worker activated", {
    timestamp: new Date().toISOString(),
  })
})

