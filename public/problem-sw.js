// Problem Service Worker - Doesn't handle Vercel challenges
self.addEventListener("install", (event) => {
  console.log("[Problem SW] Installing...")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("[Problem SW] Activating...")
  event.waitUntil(clients.claim())
})

// Function to check if a response is a Vercel challenge (for logging purposes only)
function detectVercelChallenge(response) {
  // Log all headers for debugging
  const headers = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  console.log("[Problem SW] Response headers:", headers)

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

  console.log("[Problem SW] Challenge indicators:", challengeIndicators)

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
    console.log("[Problem SW] ⚠️ Vercel challenge detected!")
    console.log("[Problem SW] Indicators that triggered detection:", 
      Object.entries(challengeIndicators)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(", ")
    )
    console.log("[Problem SW] ⚠️ This service worker cannot handle challenges - the request will fail")
  }

  return {
    isChallenge,
    indicators: challengeIndicators,
    headers
  }
}

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  // Intercept both the test and challenged endpoints
  if (event.request.url.includes("/api/challenged-endpoint") || event.request.url.includes("/api/test-challenge")) {
    const requestUrl = new URL(event.request.url)

    // Check if this request is already tagged for the problem service worker
    // If not, add the parameter
    if (!requestUrl.searchParams.has("via")) {
      requestUrl.searchParams.set("via", "problem-sw")

      console.log("[Problem SW] Intercepting API request:", requestUrl.toString())

      // Simply pass through the request - this will fail when challenged
      event.respondWith(
        (async () => {
          const startTime = Date.now()
          try {
            console.log("[Problem SW] Sending request...")
            const response = await fetch(requestUrl.toString(), {
              method: event.request.method,
              headers: event.request.headers,
              credentials: event.request.credentials,
              cache: "no-store",
            })

            const responseTime = Date.now() - startTime
            console.log(`[Problem SW] Received response: ${response.status} (${responseTime}ms)`)

            // Check if this is a challenge response
            const challengeCheck = detectVercelChallenge(response)
            
            if (challengeCheck.isChallenge) {
              // Return a more descriptive error for the demo
              return new Response(
                JSON.stringify({
                  error: "Vercel security challenge detected",
                  message: "This service worker cannot handle challenges",
                  timestamp: new Date().toISOString(),
                  via: "problem-sw",
                  details: {
                    status: response.status,
                    headers: challengeCheck.headers,
                    indicators: challengeCheck.indicators
                  }
                }),
                {
                  status: 403,
                  headers: { "Content-Type": "application/json" },
                },
              )
            }

            // Clone the response before reading it
            const responseClone = response.clone()

            try {
              // Try to read the response as JSON
              const data = await responseClone.json()
              console.log("[Problem SW] Response data:", data)
            } catch (e) {
              console.log("[Problem SW] Response is not JSON")
            }

            return response
          } catch (error) {
            const responseTime = Date.now() - startTime
            console.error(`[Problem SW] Fetch error after ${responseTime}ms:`, error)
            return new Response(
              JSON.stringify({
                error: "Service Worker fetch failed",
                message: error.message,
                timestamp: new Date().toISOString(),
                via: "problem-sw",
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

