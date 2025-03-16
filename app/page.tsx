"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, RefreshCcw, Terminal, TrendingUp } from "lucide-react"
import { ExclamationTriangleIcon, CheckCircledIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { resolveVercelChallengeInIframe } from "@/lib/utils"

export default function Home() {
  const [activeTab, setActiveTab] = useState("problem")

  // Problem demo state
  const [problemServiceWorkerRegistered, setProblemServiceWorkerRegistered] = useState(false)
  const [problemApiResponse, setProblemApiResponse] = useState<Record<string, unknown> | null>(null)
  const [problemError, setProblemError] = useState<string | null>(null)
  const [problemLoading, setProblemLoading] = useState(false)
  const [problemLogs, setProblemLogs] = useState<string[]>([])
  const [numRequests, setNumRequests] = useState(10)

  interface TestResult {
    status: number
    headers: Record<string, string>
    body: string
  }

  interface TestResponse {
    message: string
    results: TestResult[]
    requestId: string
    via: string
  }

  // Solution demo state
  const [solutionServiceWorkerRegistered, setSolutionServiceWorkerRegistered] = useState(false)
  const [solutionApiResponse, setSolutionApiResponse] = useState<any | null>(null)
  const [solutionError, setSolutionError] = useState<string | null>(null)
  const [solutionLoading, setSolutionLoading] = useState(false)
  const [challengeResolved, setChallengeResolved] = useState(false)
  const [challengeDetected, setChallengeDetected] = useState<boolean | null>(null)
  const [solutionLogs, setSolutionLogs] = useState<string[]>([])

  // Refs for retrying requests after challenge resolution
  const lastRequestUrlRef = useRef<string | null>(null)
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null)

  // Register service workers when the respective tab is active
  useEffect(() => {
    // Check if we're returning from a challenge resolution
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("challengeResolved") === "true") {
      setChallengeResolved(true)
      setActiveTab("solution")
      addSolutionLog("Challenge resolved, redirected back to application")

      // Clean up the URL to remove the challengeResolved parameter
      // This prevents getting stuck in the solution tab
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }

    // When switching tabs, unregister the other service worker
    if (activeTab === "problem") {
      // Unregister solution service worker if it exists
      if (solutionServiceWorkerRegistered) {
        addProblemLog("Unregistering solution service worker...")
        navigator.serviceWorker.getRegistration("/solution-sw.js").then((registration) => {
          if (registration) {
            registration.unregister().then(() => {
              addProblemLog("Solution service worker unregistered")
              setSolutionServiceWorkerRegistered(false)
            })
          }
        })
      }
      registerProblemServiceWorker()
    } else if (activeTab === "solution") {
      // Unregister problem service worker if it exists
      if (problemServiceWorkerRegistered) {
        addSolutionLog("Unregistering problem service worker...")
        navigator.serviceWorker.getRegistration("/problem-sw.js").then((registration) => {
          if (registration) {
            registration.unregister().then(() => {
              addSolutionLog("Problem service worker unregistered")
              setProblemServiceWorkerRegistered(false)
            })
          }
        })
      }
      registerSolutionServiceWorker()
    }

    // Cleanup function to remove event listeners
    return () => {
      if (messageHandlerRef.current) {
        navigator.serviceWorker.removeEventListener("message", messageHandlerRef.current)
        messageHandlerRef.current = null
      }
    }
  }, [activeTab, problemServiceWorkerRegistered, solutionServiceWorkerRegistered])

  // Helper function to add logs
  const addProblemLog = (message: string) => {
    setProblemLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const addSolutionLog = (message: string) => {
    setSolutionLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Register problem service worker
  const registerProblemServiceWorker = () => {
    if ("serviceWorker" in navigator && !problemServiceWorkerRegistered) {
      addProblemLog("Registering problem service worker...")
      navigator.serviceWorker
        .register("/problem-sw.js")
        .then((registration) => {
          console.log("Problem Service Worker registered with scope:", registration.scope)
          setProblemServiceWorkerRegistered(true)
          addProblemLog("Problem service worker registered successfully")
        })
        .catch((error) => {
          console.error("Problem Service Worker registration failed:", error)
          setProblemError("Failed to register service worker: " + error.message)
          addProblemLog(`Service worker registration failed: ${error.message}`)
        })
    }
  }

  // Register solution service worker
  const registerSolutionServiceWorker = () => {
    if ("serviceWorker" in navigator && !solutionServiceWorkerRegistered) {
      addSolutionLog("Registering solution service worker...")

      // Remove any existing message event listeners
      if (messageHandlerRef.current) {
        navigator.serviceWorker.removeEventListener("message", messageHandlerRef.current)
        messageHandlerRef.current = null
      }

      navigator.serviceWorker
        .register("/solution-sw.js")
        .then((registration) => {
          console.log("Solution Service Worker registered with scope:", registration.scope)
          setSolutionServiceWorkerRegistered(true)
          addSolutionLog("Solution service worker registered successfully")

          // Create a new message handler
          messageHandlerRef.current = handleSolutionServiceWorkerMessage

          // Listen for messages from the service worker
          navigator.serviceWorker.addEventListener("message", messageHandlerRef.current)
        })
        .catch((error) => {
          console.error("Solution Service Worker registration failed:", error)
          setSolutionError("Failed to register service worker: " + error.message)
          addSolutionLog(`Service worker registration failed: ${error.message}`)
        })
    }
  }

  // Function to make API request through problem service worker
  const makeProblemApiRequest = async () => {
    setProblemLoading(true)
    setProblemApiResponse(null)
    setProblemError(null)
    addProblemLog(`Making ${numRequests} rapid API requests via problem service worker...`)

    try {
      // This will be intercepted by the service worker
      // Add via parameter to ensure it's handled by the problem service worker
      const response = await fetch(`/api/test-challenge?via=problem-sw&requests=${numRequests}`, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || `API request failed with status: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = (await response.json()) as TestResponse
      setProblemApiResponse(data)
      
      // Log the results
      for (const [index, result] of data.results.entries()) {
        addProblemLog(`Request ${index + 1}: Status ${result.status}${result.status === 403 ? ' (Challenge Detected!)' : ''}`)
      }
      
      // Check if any requests were challenged
      const challengedRequests = data.results.filter((r) => r.status === 403)
      if (challengedRequests.length > 0) {
        addProblemLog(`⚠️ ${challengedRequests.length} requests were challenged!`)
      } else {
        addProblemLog('No challenges detected. Try increasing the number of requests.')
      }
    } catch (err) {
      console.error("API request error:", err)
      setProblemError(`API request failed: ${err instanceof Error ? err.message : String(err)}`)
      addProblemLog(`API request failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setProblemLoading(false)
    }
  }

  // Function to make API request through solution service worker
  const makeSolutionApiRequest = async () => {
    setSolutionLoading(true)
    setSolutionApiResponse(null)
    setSolutionError(null)
    setChallengeDetected(null)
    addSolutionLog("Making API request via solution service worker...")

    const requestUrl = "/api/challenged-endpoint?via=solution-sw"
    lastRequestUrlRef.current = requestUrl

    try {
      // This will be intercepted by the service worker
      // Add via parameter to ensure it's handled by the solution service worker
      const response = await fetch(requestUrl, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || `API request failed with status: ${response.status}`
        throw new Error(errorMessage)
      } else {
        const data = await response.json()
        setSolutionApiResponse(data)
        addSolutionLog(`API request successful, received stock price: $${data.data.stock.price}`)
      }
    } catch (err) {
      console.error("API request error:", err)
      setSolutionError(`API request failed: ${err instanceof Error ? err.message : String(err)}`)
      addSolutionLog(`API request failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSolutionLoading(false)
    }
  }

  // Function to retry the last request after challenge resolution
  const retryAfterChallengeResolution = async () => {
    if (!lastRequestUrlRef.current) return

    addSolutionLog("Retrying request after challenge resolution...")
    setSolutionLoading(true)

    try {
      const response = await fetch(lastRequestUrlRef.current, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || `API request failed with status: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setSolutionApiResponse(data)
      addSolutionLog(`API request successful, received stock price: $${data.data.stock.price}`)
    } catch (err) {
      console.error("Retry request error:", err)
      setSolutionError(`Retry request failed: ${err instanceof Error ? err.message : String(err)}`)
      addSolutionLog(`Retry request failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSolutionLoading(false)
    }
  }

  // Function to clear cookies and local storage
  const resetBrowserState = () => {
    // Clear cookies related to Vercel challenges
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=")
      if (name.includes("vercel") || name.includes("challenge")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      }
    })

    // Clear logs
    setProblemLogs([])
    setSolutionLogs([])

    // Reset state
    setProblemApiResponse(null)
    setProblemError(null)
    setSolutionApiResponse(null)
    setSolutionError(null)
    setChallengeResolved(false)
    setChallengeDetected(null)
    lastRequestUrlRef.current = null

    addProblemLog("Browser state reset")
    addSolutionLog("Browser state reset")

    // Reload the page to ensure clean state
    window.location.reload()
  }

  // Handler for solution service worker messages
  const handleSolutionServiceWorkerMessage = async (event) => {
    console.log("[Main Thread] Received message from service worker:", event.data)

    if (event.data.type === "CHALLENGE_DETECTED") {
      setChallengeDetected(true)
      addSolutionLog(`Challenge detected for URL: ${event.data.url}`)

      // Use the in-page iframe approach instead of redirecting
      addSolutionLog("Opening challenge resolver in-page...")

      const resolved = await resolveVercelChallengeInIframe(event.data.url)

      if (resolved) {
        setChallengeResolved(true)
        addSolutionLog("Challenge has been resolved in-page")

        // Notify the service worker that the challenge has been resolved
        if (navigator.serviceWorker.controller) {
          console.log("[Main Thread] Sending CHALLENGE_RESOLVED message to service worker")
          navigator.serviceWorker.controller.postMessage({
            type: "CHALLENGE_RESOLVED",
          })
        }

        // Retry the request
        await retryAfterChallengeResolution()
      } else {
        addSolutionLog("Failed to resolve challenge or timed out")
      }
    } else if (event.data.type === "CHALLENGE_RESOLVED") {
      setChallengeResolved(true)
      addSolutionLog("Challenge has been resolved")
    } else if (event.data.type === "NO_CHALLENGE_DETECTED") {
      setChallengeDetected(false)
      addSolutionLog("No challenge detected, request succeeded normally")
    }
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Vercel Challenge Handler Demo</h1>

      <Alert className="mb-8">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Setup Required</AlertTitle>
        <AlertDescription>
          This demo requires configuring Vercel DDoS protection rules. See the Setup Instructions tab below.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={resetBrowserState} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Reset Browser State
        </Button>
      </div>

      <Tabs
        defaultValue="problem"
        className="max-w-6xl mx-auto"
        onValueChange={(value) => {
          setActiveTab(value)
          // Reset challenge detection state when switching tabs
          if (value !== "solution") {
            setChallengeDetected(null)
          }
        }}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="problem">The Problem</TabsTrigger>
          <TabsTrigger value="solution">The Solution</TabsTrigger>
          <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
        </TabsList>

        <TabsContent value="problem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>The Problem: Service Worker Challenges</CardTitle>
              <CardDescription>
                Why Vercel DDoS protection breaks service workers and background requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h3>What happens?</h3>
                <p>
                  When Vercel's DDoS protection system detects suspicious traffic patterns, it issues a challenge to
                  verify the request is coming from a legitimate browser. This works well for normal page navigation,
                  but causes problems with:
                </p>

                <ul>
                  <li>
                    <strong>Service workers</strong> intercepting fetch requests
                  </li>
                  <li>
                    <strong>Background API calls</strong> made by JavaScript
                  </li>
                  <li>
                    <strong>WebSocket connections</strong>
                  </li>
                  <li>
                    <strong>PWA applications</strong> with cached assets
                  </li>
                </ul>

                <p>
                  The challenge fails because service workers run in a separate thread without UI capabilities, so they
                  can't display or respond to the challenge. This results in API requests failing after the challenge is
                  triggered.
                </p>
              </div>

              {/* Problem Demo */}
              <Card className="mt-6 border-amber-200 dark:border-amber-800">
                <CardHeader className="bg-amber-50 dark:bg-amber-950 rounded-t-lg">
                  <CardTitle className="text-amber-800 dark:text-amber-300">Problem Demo</CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-400">
                    See how service worker requests fail when challenged
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Service Worker Status</h3>
                    {problemServiceWorkerRegistered ? (
                      <p className="text-green-600">✓ Service Worker registered successfully</p>
                    ) : (
                      <p className="text-amber-600">⟳ Registering service worker...</p>
                    )}
                  </div>

                  {problemError && (
                    <Alert variant="destructive">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{problemError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-4 mb-4">
                      <Button
                        onClick={makeProblemApiRequest}
                        disabled={problemLoading || !problemServiceWorkerRegistered}
                        className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
                      >
                        {problemLoading ? "Loading..." : "Test Challenge"}
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <label htmlFor="numRequests" className="text-sm">Requests:</label>
                        <input
                          type="number"
                          id="numRequests"
                          value={numRequests}
                          onChange={(e) => setNumRequests(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          min="1"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Makes multiple rapid requests to try to trigger the Vercel challenge
                    </p>
                  </div>

                  {/* Log Console */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="h-4 w-4" />
                      <h3 className="text-sm font-medium">Event Log</h3>
                    </div>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-md h-32 overflow-y-auto font-mono text-xs">
                      {problemLogs.length === 0 ? (
                        <p className="text-gray-500">No events logged yet...</p>
                      ) : (
                        problemLogs.map((log, i) => (
                          <div key={i} className="mb-1">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {problemApiResponse && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Stock Data Response</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                        {problemApiResponse.data?.stock && (
                          <div className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg">{problemApiResponse.data.stock.symbol}</span>
                              <span
                                className={`font-bold text-lg ${problemApiResponse.data.stock.change >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                ${problemApiResponse.data.stock.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Change</span>
                              <span
                                className={`${problemApiResponse.data.stock.change >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {problemApiResponse.data.stock.change >= 0 ? "+" : ""}
                                {problemApiResponse.data.stock.change}%
                              </span>
                            </div>
                          </div>
                        )}
                        <pre className="text-xs mt-2">{JSON.stringify(problemApiResponse, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md">
                <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">Common symptoms:</h3>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400 pl-4">
                  <li>API requests suddenly start failing with 403 errors</li>
                  <li>Error messages like "Failed to verify your browser"</li>
                  <li>WebSocket connections dropping unexpectedly</li>
                  <li>Issues occurring in some browsers but not others</li>
                  <li>Problems appearing after refreshing or after a period of inactivity</li>
                  <li>Requests being rate limited with 429 status codes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>The Solution: In-Page Challenge Resolution</CardTitle>
              <CardDescription>How to properly handle Vercel DDoS challenges in service workers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h3>How it works</h3>
                <p>
                  The solution involves detecting when a response is a Vercel challenge and handling it in-page without
                  a full redirect. Here's the process:
                </p>

                <ol>
                  <li>
                    <strong>Challenge Detection</strong>: The service worker identifies when a response is a Vercel
                    security challenge by checking response status codes and headers.
                  </li>
                  <li>
                    <strong>Main Thread Communication</strong>: When a challenge is detected, the service worker
                    notifies the main thread via <code>postMessage()</code>.
                  </li>
                  <li>
                    <strong>In-Page Resolution</strong>: The main thread opens an iframe overlay to resolve the
                    challenge without navigating away from the page.
                  </li>
                  <li>
                    <strong>Challenge Resolution</strong>: The user completes the challenge in the iframe.
                  </li>
                  <li>
                    <strong>Automatic Retry</strong>: After the challenge is resolved, the original request is
                    automatically retried.
                  </li>
                </ol>
              </div>

              {/* Solution Demo */}
              <Card className="mt-6 border-green-200 dark:border-green-800">
                <CardHeader className="bg-green-50 dark:bg-green-950 rounded-t-lg">
                  <CardTitle className="text-green-800 dark:text-green-300">Solution Demo</CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-400">
                    See how the challenge handler properly resolves Vercel challenges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Service Worker Status</h3>
                    {solutionServiceWorkerRegistered ? (
                      <p className="text-green-600">✓ Solution Service Worker registered successfully</p>
                    ) : (
                      <p className="text-amber-600">⟳ Registering service worker...</p>
                    )}
                  </div>

                  {challengeResolved && (
                    <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                      <CheckCircledIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">Challenge Resolved</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        A Vercel security challenge was successfully resolved
                      </AlertDescription>
                    </Alert>
                  )}

                  {challengeDetected === false && (
                    <Alert
                      variant="warning"
                      className="bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertTitle className="text-yellow-800 dark:text-yellow-300">No Challenge Detected</AlertTitle>
                      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        No Vercel challenge was detected. Please ensure you have configured the challenge rules in
                        Vercel dashboard.
                      </AlertDescription>
                    </Alert>
                  )}

                  {solutionError && (
                    <Alert variant="destructive">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{solutionError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={makeSolutionApiRequest}
                      disabled={solutionLoading || !solutionServiceWorkerRegistered}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      {solutionLoading ? "Loading..." : "Fetch Stock Data"}
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <p className="text-sm text-gray-500">
                      If a challenge is detected, it will be resolved in-page without navigation
                    </p>
                  </div>

                  {/* Log Console */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="h-4 w-4" />
                      <h3 className="text-sm font-medium">Event Log</h3>
                    </div>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-md h-32 overflow-y-auto font-mono text-xs">
                      {solutionLogs.length === 0 ? (
                        <p className="text-gray-500">No events logged yet...</p>
                      ) : (
                        solutionLogs.map((log, i) => (
                          <div key={i} className="mb-1">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {solutionApiResponse && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Stock Data Response</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                        {solutionApiResponse.data?.stock && (
                          <div className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg">{solutionApiResponse.data.stock.symbol}</span>
                              <span
                                className={`font-bold text-lg ${solutionApiResponse.data.stock.change >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                ${solutionApiResponse.data.stock.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Change</span>
                              <span
                                className={`${solutionApiResponse.data.stock.change >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {solutionApiResponse.data.stock.change >= 0 ? "+" : ""}
                                {solutionApiResponse.data.stock.change}%
                              </span>
                            </div>
                          </div>
                        )}
                        <pre className="text-xs mt-2">{JSON.stringify(solutionApiResponse, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-300">Key benefits:</h3>
                <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-400 pl-4">
                  <li>Seamless handling of Vercel challenges in service workers</li>
                  <li>No page navigation required - challenge is resolved in-page</li>
                  <li>Automatic retry after challenge resolution</li>
                  <li>Works with PWAs and background API requests</li>
                  <li>Compatible with WebSocket connections</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>How to configure Vercel DDoS protection for testing this demo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Configuring Vercel DDoS Protection Rules</h3>
                <p>
                  To test this demo with real Vercel challenges, you need to configure DDoS protection rules in your
                  Vercel dashboard. Follow these steps:
                </p>

                <ol>
                  <li>
                    <strong>Deploy this project to Vercel</strong>
                    <p>First, deploy this project to your Vercel account.</p>
                  </li>

                  <li>
                    <strong>Access Security Settings</strong>
                    <p>
                      In your Vercel dashboard, go to your project, then navigate to
                      <strong> Settings → Security</strong>.
                    </p>
                  </li>

                  <li>
                    <strong>Configure Challenge Rules</strong>
                    <p>Under "DDoS Protection", set up a rule to challenge requests to:</p>
                    <ul>
                      <li>
                        <code>/api/challenged-endpoint</code> - This endpoint will be used by both demos
                      </li>
                    </ul>
                  </li>

                  <li>
                    <strong>Set Challenge Mode</strong>
                    <p>
                      Set the challenge mode to "Always Challenge" for this path to ensure consistent behavior during
                      the demo.
                    </p>
                  </li>

                  <li>
                    <strong>Save Changes</strong>
                    <p>Save your configuration. It may take a few minutes for the changes to propagate.</p>
                  </li>
                </ol>

                <h3>About the API Data</h3>
                <p>The API in this demo returns simulated stock market data:</p>
                <ul>
                  <li>
                    <strong>Stock Symbol:</strong> A fictional stock ticker (ACME)
                  </li>
                  <li>
                    <strong>Price:</strong> A random price between $50 and $150
                  </li>
                  <li>
                    <strong>Change:</strong> A random percentage change between -5% and +5%
                  </li>
                </ul>

                <h3>About Vercel DDoS Protection</h3>
                <p>
                  When configured, Vercel's firewall will issue challenges for requests to the protected endpoint. This
                  demo shows how to handle these challenges properly in service workers.
                </p>

                <h3>Resetting Browser State</h3>
                <p>
                  Vercel challenges use cookies to remember that your browser has been verified. When testing the demo
                  multiple times, you may need to:
                </p>

                <ul>
                  <li>
                    <strong>Use the "Reset Browser State" button</strong> at the top of this page to clear Vercel
                    challenge cookies
                  </li>
                  <li>
                    <strong>Use private/incognito browsing</strong> for a clean state each time
                  </li>
                  <li>
                    <strong>Clear your browser cookies manually</strong> between tests
                  </li>
                </ul>

                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md">
                  <h4 className="text-amber-800 dark:text-amber-300 mt-0">Note for Enterprise Users</h4>
                  <p className="text-amber-700 dark:text-amber-400 mb-0">
                    If you're using Vercel Enterprise, you can also use System Bypass Rules to whitelist specific paths
                    or IP addresses to avoid challenges for critical traffic.
                  </p>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Link href="/documentation">
                  <Button variant="outline">View Full Documentation</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

