import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to detect Vercel challenge responses
export function isVercelChallenge(response: Response): boolean {
  // Check for status code (usually 403)
  if (response.status === 403) {
    // Check for Vercel challenge headers or content
    return response.headers.get("server") === "Vercel" || response.headers.get("x-vercel-protection") !== null
  }
  return false
}

// Utility to handle challenge resolution in an iframe
export async function resolveVercelChallengeInIframe(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`[Challenge Resolver] Opening iframe for URL: ${url}`)

    // Create an iframe to load the challenge
    const iframe = document.createElement("iframe")
    iframe.style.width = "100%"
    iframe.style.height = "400px"
    iframe.style.border = "1px solid #ccc"
    iframe.style.borderRadius = "4px"
    iframe.src = `/api/challenge-resolver?originalUrl=${encodeURIComponent(url)}&iframe=true`

    // Create a container for the iframe
    const container = document.createElement("div")
    container.id = "challenge-iframe-container"
    container.style.position = "fixed"
    container.style.top = "50%"
    container.style.left = "50%"
    container.style.transform = "translate(-50%, -50%)"
    container.style.zIndex = "9999"
    container.style.backgroundColor = "white"
    container.style.padding = "20px"
    container.style.borderRadius = "8px"
    container.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"
    container.style.width = "90%"
    container.style.maxWidth = "600px"

    // Create a title for the container
    const title = document.createElement("h3")
    title.textContent = "Resolving Vercel Security Challenge"
    title.style.marginTop = "0"
    title.style.marginBottom = "10px"

    // Create a message explaining what's happening
    const message = document.createElement("p")
    message.textContent =
      "Please complete the security challenge below to continue. The application will automatically continue once the challenge is resolved."
    message.style.marginBottom = "15px"

    // Add elements to the container
    container.appendChild(title)
    container.appendChild(message)
    container.appendChild(iframe)

    // Add a backdrop
    const backdrop = document.createElement("div")
    backdrop.style.position = "fixed"
    backdrop.style.top = "0"
    backdrop.style.left = "0"
    backdrop.style.width = "100%"
    backdrop.style.height = "100%"
    backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
    backdrop.style.zIndex = "9998"

    // Add the container and backdrop to the body
    document.body.appendChild(backdrop)
    document.body.appendChild(container)

    // Function to handle message events
    const handleMessage = (event: MessageEvent) => {
      console.log("[Challenge Resolver] Received message:", event.data)

      if (event.data && event.data.type === "CHALLENGE_RESOLVED") {
        console.log("[Challenge Resolver] Challenge resolved, cleaning up")

        // Remove the iframe and backdrop
        if (document.body.contains(container)) {
          document.body.removeChild(container)
        }
        if (document.body.contains(backdrop)) {
          document.body.removeChild(backdrop)
        }

        // Remove the event listener
        window.removeEventListener("message", handleMessage)

        // Resolve the promise
        resolve(true)
      }
    }

    // Listen for messages from the iframe
    window.addEventListener("message", handleMessage)

    // Add a timeout to remove the iframe if it takes too long
    setTimeout(() => {
      console.log("[Challenge Resolver] Timeout reached")

      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
      if (document.body.contains(backdrop)) {
        document.body.removeChild(backdrop)
      }

      window.removeEventListener("message", handleMessage)
      resolve(false)
    }, 60000) // 1 minute timeout
  })
}

