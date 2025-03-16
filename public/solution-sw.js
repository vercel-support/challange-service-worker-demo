// Solution Service Worker - Handles Vercel challenges
self.addEventListener("install", (event) => {
  console.log("[Solution SW] Installing...")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("[Solution SW] Activating...")
  event.waitUntil(clients.claim())
})

// Function to check if a response is a Vercel challenge
function isVercelChallenge(response) {
  // Check for status code (usually 403)
  if (response.status === 403) {
    // Check for Vercel challenge headers or content
    return response.headers.get("server") === "Vercel" || response.headers.get("x-vercel-protection") !== null
  }
  return false
}

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  // Only intercept API requests to the challenged endpoint
  if (event.request.url.includes("/api/challenged-endpoint")) {
    const requestUrl = new URL(event.request.url)

    // Check if this request is already tagged for the solution service worker
    // If not, add the parameter
    if (!requestUrl.searchParams.has("via")) {
      requestUrl.searchParams.set("via", "solution-sw")

      console.log("[Solution SW] Intercepting API request:", requestUrl.toString())

      event.respondWith(
        (async () => {
          const startTime = Date.now()
          try {
            console.log("[Solution SW] Sending request...")
            // Make the request
            const response = await fetch(requestUrl.toString(), {
              method: event.request.method,
              headers: event.request.headers,
              credentials: event.request.credentials,
              cache: "no-store",
            })

            const responseTime = Date.now() - startTime
            console.log(`[Solution SW] Received response: ${response.status} (${responseTime}ms)`)

            // Log response headers for debugging
            const headers = {}
            response.headers.forEach((value, key) => {
              headers[key] = value
            })
            console.log("[Solution SW] Response headers:", headers)

            // Check if the response is a Vercel challenge
            if (isVercelChallenge(response)) {
              console.log("[Solution SW] Vercel challenge detected")

              // Notify the main thread about the challenge
              const allClients = await clients.matchAll({ includeUncontrolled: true })
              for (const client of allClients) {
                client.postMessage({
                  type: "CHALLENGE_DETECTED",
                  url: requestUrl.toString(),
                  status: response.status,
                  headers: headers,
                })
              }

              // Return a more helpful error response
              return new Response(
                JSON.stringify({
                  error: "Vercel security challenge detected",
                  message: "The application will handle this challenge in-page",
                  timestamp: new Date().toISOString(),
                  via: "solution-sw",
                }),
                {
                  status: 403,
                  headers: { "Content-Type": "application/json" },
                },
              )
            }

            // If we got a successful response but expected a challenge, notify the main thread
            if (response.ok && response.status === 200) {
              console.log("[Solution SW] Request successful, no challenge detected")
              const allClients = await clients.matchAll({ includeUncontrolled: true })
              for (const client of allClients) {
                client.postMessage({
                  type: "NO_CHALLENGE_DETECTED",
                  url: requestUrl.toString(),
                })
              }
            }

            // If no challenge, return the original response
            return response
          } catch (error) {
            const responseTime = Date.now() - startTime
            console.error(`[Solution SW] Fetch error after ${responseTime}ms:`, error)
            return new Response(
              JSON.stringify({
                error: "Service Worker fetch failed",
                message: error.message,
                timestamp: new Date().toISOString(),
                via: "solution-sw",
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            )
          }
        })(),
      )
    }
  }
})

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  console.log("[Solution SW] Received message:", event.data)

  if (event.data.type === "CHALLENGE_RESOLVED") {
    console.log("[Solution SW] Challenge resolved notification received")

    // Notify all clients that the challenge has been resolved
    clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "CHALLENGE_RESOLVED",
        })
      })
    })
  }
})

