// Problem Service Worker - Doesn't handle Vercel challenges
self.addEventListener("install", (event) => {
  console.log("[Problem SW] Installing...")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("[Problem SW] Activating...")
  event.waitUntil(clients.claim())
})

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  // Only intercept API requests to the challenged endpoint
  if (event.request.url.includes("/api/challenged-endpoint")) {
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

            // Log response headers for debugging
            const headers = {}
            response.headers.forEach((value, key) => {
              headers[key] = value
            })
            console.log("[Problem SW] Response headers:", headers)

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

