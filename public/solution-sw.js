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
  // Log all headers for debugging
  const headers = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  console.log("[Solution SW] Response headers:", headers)

  // Check for various challenge indicators
  const challengeIndicators = {
    // Status code check
    status: response.status === 403,
    
    // Vercel-specific headers
    vercelServer: response.headers.get("server")?.toLowerCase().includes("vercel"),
    vercelProtection: response.headers.get("x-vercel-protection") !== null,
    vercelProxy: response.headers.get("x-vercel-proxy") !== null,
    
    // Challenge-specific headers
    challengeHeader: response.headers.get("x-vercel-challenge") !== null,
    securityHeaders: response.headers.get("x-vercel-security") !== null,
    
    // Content type check (challenges often return HTML)
    contentType: response.headers.get("content-type")?.toLowerCase().includes("text/html"),
  }

  console.log("[Solution SW] Challenge indicators:", challengeIndicators)

  // A request is considered challenged if:
  // 1. Status is 403 AND
  // 2. At least one Vercel-specific header is present
  const isChallenge = challengeIndicators.status && (
    challengeIndicators.vercelServer ||
    challengeIndicators.vercelProtection ||
    challengeIndicators.vercelProxy ||
    challengeIndicators.challengeHeader ||
    challengeIndicators.securityHeaders
  )

  if (isChallenge) {
    console.log("[Solution SW] ⚠️ Vercel challenge detected!")
    console.log("[Solution SW] Indicators that triggered detection:", 
      Object.entries(challengeIndicators)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(", ")
    )
  }

  return isChallenge
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

            // Check if the response is a Vercel challenge
            if (isVercelChallenge(response)) {
              // Notify the main thread about the challenge
              const allClients = await clients.matchAll({ includeUncontrolled: true })
              for (const client of allClients) {
                client.postMessage({
                  type: "CHALLENGE_DETECTED",
                  url: requestUrl.toString(),
                  status: response.status,
                  headers: Object.fromEntries(response.headers.entries()),
                })
              }

              // Return a more helpful error response
              return new Response(
                JSON.stringify({
                  error: "Vercel security challenge detected",
                  message: "The application will handle this challenge in-page",
                  timestamp: new Date().toISOString(),
                  via: "solution-sw",
                  details: {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                  }
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

