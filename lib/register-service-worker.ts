/**
 * Registers the service worker and sets up challenge detection
 */
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      console.log("[SERVICE WORKER] 🔄 Attempting to register service worker", {
        timestamp: new Date().toISOString(),
      })

      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SERVICE WORKER] ✅ Registered successfully", {
            scope: registration.scope,
            timestamp: new Date().toISOString(),
          })

          // Set up listener for messages from the service worker
          setupServiceWorkerMessageListener()
        })
        .catch((error) => {
          console.error("[SERVICE WORKER] ❌ Registration failed", {
            error: error.message,
            timestamp: new Date().toISOString(),
          })
        })
    })
  } else {
    console.warn("[SERVICE WORKER] ⚠️ Service workers not supported in this browser", {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Sets up a listener for messages from the service worker
 */
function setupServiceWorkerMessageListener() {
  console.log("[SERVICE WORKER] 🔄 Setting up message listener", {
    timestamp: new Date().toISOString(),
  })

  navigator.serviceWorker.addEventListener("message", (event) => {
    console.log("[SERVICE WORKER] 📩 Message received from service worker", {
      type: event.data?.type,
      data: event.data,
      timestamp: new Date().toISOString(),
    })

    // Handle Vercel challenge detection messages
    if (event.data && event.data.type === "VERCEL_CHALLENGE_DETECTED") {
      console.log("[SERVICE WORKER] 🛡️ Challenge detection message received", {
        url: event.data.url,
        originalUrl: event.data.originalUrl,
        timestamp: new Date().toISOString(),
      })

      handleVercelChallengeFromServiceWorker(event.data.url, event.data.originalUrl)
    }
  })
}

/**
 * Handles a Vercel challenge detected by the service worker
 */
function handleVercelChallengeFromServiceWorker(challengeUrl: string, returnUrl: string) {
  console.log("[SERVICE WORKER] 🛡️ Handling challenge from service worker", {
    challengeUrl,
    returnUrl: returnUrl || window.location.href,
    timestamp: new Date().toISOString(),
  })

  // Create the challenge resolution URL
  const challengeResolutionUrl = `/api/resolve-challenge?originalUrl=${encodeURIComponent(
    challengeUrl,
  )}&returnUrl=${encodeURIComponent(returnUrl || window.location.href)}`

  console.log("[SERVICE WORKER] 🔀 Redirecting to challenge resolution page", {
    from: window.location.href,
    to: challengeResolutionUrl,
    timestamp: new Date().toISOString(),
  })

  // Show a notification to the user (optional)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Security Verification Required", {
      body: "Redirecting to complete security verification...",
      icon: "/favicon.ico",
    })
  }

  // Redirect to the challenge resolution page
  window.location.href = challengeResolutionUrl
}

/**
 * Updates the service worker when a new version is available
 */
export function updateServiceWorker() {
  if ("serviceWorker" in navigator) {
    console.log("[SERVICE WORKER] 🔄 Attempting to update service worker", {
      timestamp: new Date().toISOString(),
    })

    navigator.serviceWorker.ready.then((registration) => {
      registration.update()
      console.log("[SERVICE WORKER] ✅ Update triggered", {
        timestamp: new Date().toISOString(),
      })
    })
  }
}

/**
 * Unregisters all service workers
 * Useful for debugging or when you need to reset the service worker
 */
export function unregisterServiceWorkers() {
  if ("serviceWorker" in navigator) {
    console.log("[SERVICE WORKER] 🔄 Attempting to unregister all service workers", {
      timestamp: new Date().toISOString(),
    })

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      console.log("[SERVICE WORKER] 📊 Found registrations to unregister:", {
        count: registrations.length,
        timestamp: new Date().toISOString(),
      })

      for (const registration of registrations) {
        registration.unregister()
        console.log("[SERVICE WORKER] ✅ Unregistered service worker", {
          scope: registration.scope,
          timestamp: new Date().toISOString(),
        })
      }

      console.log("[SERVICE WORKER] 🔄 Reloading page after unregistration", {
        timestamp: new Date().toISOString(),
      })

      window.location.reload()
    })
  }
}

