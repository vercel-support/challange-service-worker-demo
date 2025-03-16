"use client"

import type React from "react"

import { registerServiceWorker } from "@/lib/register-service-worker"
import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Register service worker on client side
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}

      {/* Add a hidden component to handle service worker messages */}
      <ServiceWorkerHandler />
    </ThemeProvider>
  )
}

// Client component to handle service worker messages
function ServiceWorkerHandler() {
  useEffect(() => {
    // Add event listener for messages from service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "VERCEL_CHALLENGE_DETECTED") {
        console.log("Challenge detected by service worker:", event.data)
        // The handling logic is in the service worker message listener
      }
    }

    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage)
    }
  }, [])

  return null // This component doesn't render anything
}

