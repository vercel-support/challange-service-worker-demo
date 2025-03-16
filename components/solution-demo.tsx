"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Play, RefreshCw, Wifi, WifiOff } from "lucide-react"

export default function SolutionDemo() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    challenged: 0,
    handled: 0,
  })
  const [socketStatus, setSocketStatus] = useState("disconnected")
  const [logs, setLogs] = useState<string[]>([])

  // Enhance the logging in the solution demo component

  // Function to add a log message
  const addLog = (message: string, type: "info" | "warning" | "error" | "success" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`

    // Log to console with emoji for better visibility in Vercel logs
    const emoji =
      type === "info" ? "ℹ️" : type === "warning" ? "⚠️" : type === "error" ? "❌" : type === "success" ? "✅" : ""

    console.log(`[SOLUTION DEMO] ${emoji} ${message}`)

    // Update UI logs
    setLogs((prev) => [logMessage, ...prev].slice(0, 10))
  }

  // Update the runDemo function to use enhanced logging
  const runDemo = async () => {
    setRunning(true)
    setProgress(0)
    setResults({
      total: 0,
      success: 0,
      failed: 0,
      challenged: 0,
      handled: 0,
    })
    setLogs([])

    addLog("Starting API request sequence with challenge handling...", "info")
    console.log("[SOLUTION DEMO] 🚀 Starting demo sequence", {
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      demoType: "solution",
    })

    // Make 20 rapid requests to potentially trigger challenges
    const totalRequests = 20

    for (let i = 0; i < totalRequests; i++) {
      try {
        // Update progress
        setProgress(Math.round((i / totalRequests) * 100))

        // Make the request with challenge handling
        addLog(`Request ${i + 1}: Sending with challenge handling...`, "info")
        console.log("[SOLUTION DEMO] 🔄 Sending request", {
          requestNumber: i + 1,
          url: `/api/demo/test-endpoint?id=${i}&t=${Date.now()}`,
          timestamp: new Date().toISOString(),
        })

        try {
          // In a real implementation, this would use fetchWithChallengeHandling
          // For demo purposes, we'll simulate the behavior
          const response = await simulateFetchWithChallengeHandling(`/api/demo/test-endpoint?id=${i}&t=${Date.now()}`)

          if (response.status === 200) {
            setResults((prev) => ({ ...prev, success: prev.success + 1 }))
            addLog(`Request ${i + 1}: Success (200 OK)`, "success")
            console.log("[SOLUTION DEMO] ✅ Request successful", {
              requestNumber: i + 1,
              status: 200,
              timestamp: new Date().toISOString(),
            })
          } else {
            setResults((prev) => ({ ...prev, failed: prev.failed + 1 }))
            addLog(`Request ${i + 1}: Failed (${response.status})`, "error")
            console.log("[SOLUTION DEMO] ❌ Request failed", {
              requestNumber: i + 1,
              status: response.status,
              timestamp: new Date().toISOString(),
            })
          }
        } catch (error) {
          if (error instanceof Error && error.message === "Challenge detected and handled") {
            setResults((prev) => ({ ...prev, challenged: prev.challenged + 1, handled: prev.handled + 1 }))
            addLog(`Request ${i + 1}: Challenge detected and handled successfully`, "warning")
            console.log("[SOLUTION DEMO] 🛡️ Challenge detected and handled", {
              requestNumber: i + 1,
              timestamp: new Date().toISOString(),
            })
          } else {
            setResults((prev) => ({ ...prev, failed: prev.failed + 1 }))
            addLog(`Request ${i + 1}: Error - ${error instanceof Error ? error.message : String(error)}`, "error")
            console.error("[SOLUTION DEMO] ❌ Request error", {
              requestNumber: i + 1,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
            })
          }
        }

        setResults((prev) => ({ ...prev, total: prev.total + 1 }))

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        setResults((prev) => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }))
        addLog(`Request ${i + 1}: Error - ${error instanceof Error ? error.message : String(error)}`, "error")
        console.error("[SOLUTION DEMO] ❌ Outer error handler", {
          requestNumber: i + 1,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        })
      }
    }

    setProgress(100)
    addLog("API request sequence completed", "info")
    console.log("[SOLUTION DEMO] 🏁 Request sequence completed", {
      totalRequests,
      successful: results.success,
      challenged: results.challenged,
      handled: results.handled,
      failed: results.failed,
      timestamp: new Date().toISOString(),
    })

    // Try to establish a WebSocket connection with challenge handling
    try {
      addLog("Attempting WebSocket connection with challenge handling...", "info")
      setSocketStatus("connecting")
      console.log("[SOLUTION DEMO] 🔌 Attempting WebSocket connection with challenge handling", {
        timestamp: new Date().toISOString(),
      })

      // Simulate WebSocket connection with challenge handling
      setTimeout(() => {
        // Simulate a challenge being detected and handled
        addLog("WebSocket challenge detected and handled", "warning")
        console.log("[SOLUTION DEMO] 🛡️ WebSocket challenge detected and handled", {
          timestamp: new Date().toISOString(),
        })

        setResults((prev) => ({
          ...prev,
          challenged: prev.challenged + 1,
          handled: prev.handled + 1,
        }))

        // Then simulate a successful connection
        setTimeout(() => {
          setSocketStatus("connected")
          addLog("WebSocket connected successfully after challenge resolution", "success")
          console.log("[SOLUTION DEMO] ✅ WebSocket connected successfully after challenge resolution", {
            timestamp: new Date().toISOString(),
          })
        }, 1500)
      }, 2000)
    } catch (error) {
      setSocketStatus("failed")
      addLog(`WebSocket error: ${error instanceof Error ? error.message : String(error)}`, "error")
      console.error("[SOLUTION DEMO] ❌ WebSocket error", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    }

    setRunning(false)
  }

  // Enhance the simulateFetchWithChallengeHandling function with better logging
  const simulateFetchWithChallengeHandling = async (url: string, options?: RequestInit): Promise<Response> => {
    console.log("[SOLUTION DEMO] 🔄 simulateFetchWithChallengeHandling", {
      url,
      method: options?.method || "GET",
      timestamp: new Date().toISOString(),
    })

    // Randomly simulate a challenge (30% chance)
    if (Math.random() < 0.3) {
      // Simulate challenge detection and handling
      console.log("[SOLUTION DEMO] 🛡️ Simulating challenge detection", {
        url,
        timestamp: new Date().toISOString(),
      })

      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("[SOLUTION DEMO] ⏳ Simulating challenge handling process", {
        url,
        timestamp: new Date().toISOString(),
      })

      // In a real implementation, this would redirect to the challenge resolution page
      // For demo purposes, we'll just throw a special error
      throw new Error("Challenge detected and handled")
    }

    // Otherwise, simulate a successful response
    await new Promise((resolve) => setTimeout(resolve, 200))

    console.log("[SOLUTION DEMO] ✅ Simulating successful response", {
      url,
      timestamp: new Date().toISOString(),
    })

    // Create a mock response
    return new Response(
      JSON.stringify({
        success: true,
        message: "This is a simulated successful response",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">API Requests with Challenge Handling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div>Total Requests:</div>
              <div className="font-medium">{results.total}</div>

              <div>Successful:</div>
              <div className="font-medium text-green-500">{results.success}</div>

              <div>Challenges Detected:</div>
              <div className="font-medium text-amber-500">{results.challenged}</div>

              <div>Challenges Handled:</div>
              <div className="font-medium text-green-500">{results.handled}</div>

              <div>Failed:</div>
              <div className="font-medium text-red-500">{results.failed}</div>
            </div>

            {running && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runDemo} disabled={running} className="w-full flex items-center gap-2">
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Running Demo..." : "Run Solution Demo"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">WebSocket with Challenge Handling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24">
              {socketStatus === "disconnected" && (
                <div className="flex flex-col items-center text-muted-foreground">
                  <WifiOff className="h-10 w-10 mb-2" />
                  <span>Disconnected</span>
                </div>
              )}

              {socketStatus === "connecting" && (
                <div className="flex flex-col items-center text-amber-500">
                  <Wifi className="h-10 w-10 mb-2 animate-pulse" />
                  <span>Connecting...</span>
                </div>
              )}

              {socketStatus === "connected" && (
                <div className="flex flex-col items-center text-green-500">
                  <Wifi className="h-10 w-10 mb-2" />
                  <span>Connected</span>
                </div>
              )}

              {socketStatus === "failed" && (
                <div className="flex flex-col items-center text-red-500">
                  <AlertCircle className="h-10 w-10 mb-2" />
                  <span>Connection Failed</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Badge
              variant={
                socketStatus === "connected" ? "success" : socketStatus === "connecting" ? "outline" : "destructive"
              }
            >
              {socketStatus === "connected"
                ? "Socket Connected"
                : socketStatus === "connecting"
                  ? "Connecting..."
                  : socketStatus === "failed"
                    ? "Connection Failed"
                    : "Disconnected"}
            </Badge>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-3 h-40 overflow-y-auto text-sm font-mono">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">Run the demo to see logs</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="pb-1">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">The solution works by:</p>
            <ol className="list-decimal pl-5 text-sm space-y-2">
              <li>
                <strong>Detecting challenges</strong> by checking response status codes, headers, and URLs
              </li>
              <li>
                <strong>Handling challenges</strong> by redirecting to a full-page challenge resolution flow
              </li>
              <li>
                <strong>Returning to the original page</strong> after the challenge is resolved
              </li>
              <li>
                <strong>Integrating with service workers</strong> to handle challenges in cached requests
              </li>
            </ol>
            <p className="text-sm">
              This approach ensures that your API requests and WebSocket connections work reliably, even when Vercel's
              security system challenges them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

