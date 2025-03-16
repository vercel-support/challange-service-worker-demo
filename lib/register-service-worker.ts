/**
 * Simple service worker registration for handling Vercel challenges
 */

/**
 * Registers the service worker and sets up challenge detection
 */
export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported in this browser")
    return
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })

    console.log("Service worker registered successfully", {
      scope: registration.scope
    })

    // Set up message listener for challenge detection
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "VERCEL_CHALLENGE_DETECTED") {
        handleVercelChallengeFromServiceWorker(
          event.data.url,
          event.data.originalUrl
        )
      }
    })

  } catch (error) {
    console.error("Service worker registration failed:", error)
  }
}

/**
 * Handles a Vercel challenge detected by the service worker
 */
function handleVercelChallengeFromServiceWorker(
  challengeUrl: string,
  returnUrl: string
) {
  // Create the challenge resolution URL
  const challengeResolutionUrl = `/api/resolve-challenge?originalUrl=${encodeURIComponent(
    challengeUrl,
  )}&returnUrl=${encodeURIComponent(returnUrl || window.location.href)}`

  // Show a notification if possible
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Security Verification Required", {
      body: "Redirecting to complete security verification...",
      icon: "/favicon.ico"
    })
  }

  // Redirect to the challenge resolution page
  window.location.href = challengeResolutionUrl
}

/**
 * Updates the service worker when a new version is available
 */
export async function updateServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
    console.log("[SERVICE WORKER] ✅ Update triggered", {
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[SERVICE WORKER] ❌ Update failed", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Schedules periodic service worker updates
 */
function schedulePeriodicUpdates() {
  setInterval(async () => {
    try {
      await updateServiceWorker()
    } catch (error) {
      console.error("[SERVICE WORKER] ❌ Periodic update failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    }
  }, 3600000) // 1 hour
}

/**
 * Requests notification permission if not already granted
 */
async function requestNotificationPermission() {
  if (!("Notification" in window)) return

  if (Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission()
      console.log("[NOTIFICATIONS] 🔔 Permission request result:", {
        permission,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[NOTIFICATIONS] ❌ Permission request failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    }
  }
}

/**
 * Unregisters all service workers
 * Useful for debugging or when you need to reset the service worker
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    console.log("[SERVICE WORKER] 📊 Found registrations to unregister:", {
      count: registrations.length,
      timestamp: new Date().toISOString(),
    })

    await Promise.all(
      registrations.map(async (registration) => {
        const unregistered = await registration.unregister()
        console.log("[SERVICE WORKER] ✅ Unregistered service worker", {
          scope: registration.scope,
          success: unregistered,
          timestamp: new Date().toISOString(),
        })
      })
    )

    console.log("[SERVICE WORKER] 🔄 Reloading page after unregistration", {
      timestamp: new Date().toISOString(),
    })

    window.location.reload()
  } catch (error) {
    console.error("[SERVICE WORKER] ❌ Unregistration failed", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

