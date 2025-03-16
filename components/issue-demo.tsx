"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Play, RefreshCw, Wifi, WifiOff } from "lucide-react"

export default function IssueDemo() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    challenged: 0,
  })
  const [socketStatus, setSocketStatus] = useState("disconnected")
  const [logs, setLogs] = useState<string[]>([])

  // Enhance the logging in the issue demo component

  // Function to add a log message
  const addLog = (message: string, type: "info" | "warning" | "error" | "success" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`

    // Log to console with emoji for better visibility in Vercel logs
    const emoji =
      type === "info" ? "ℹ️" : type === "warning" ? "⚠️" : type === "error" ? "❌" : type === "success" ? "✅" : ""

    console.log(`[ISSUE DEMO] ${emoji} ${message}`)

    // Update UI logs
    setLogs((prev) => [logMessage, ...prev].slice(0, 10))
  }

  // Update the runDemo function to more reliably simulate challenges
  // Replace the existing runDemo function with this enhanced version

  const runDemo = async () => {
    setRunning(true)
    setProgress(0)
    setResults({
      total: 0,
      success: 0,
      failed: 0,
      challenged: 0,
    })
    setLogs([])

    addLog("Starting API request sequence to demonstrate Vercel challenge issues...", "info")
    console.log("[ISSUE DEMO] 🚀 Starting demo sequence", {
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      demoType: "issue",
    })

    // Make 20 rapid requests to potentially trigger challenges
    const totalRequests = 20

    for (let i = 0; i < totalRequests; i++) {
      try {
        // Update progress
        setProgress(Math.round((i / totalRequests) * 100))

        // Make the request
        addLog(`Request ${i + 1}: Sending request without challenge handling...`, "info")

        // Simulate Vercel challenges more reliably
        // For demo purposes, we'll simulate challenges for 40% of requests
        // In a real scenario, Vercel would trigger these based on traffic patterns
        const shouldSimulateChallenge = Math.random() < 0.4

        if (shouldSimulateChallenge && i > 3) {
          // Simulate a Vercel challenge response
          setResults((prev) => ({ ...prev, challenged: prev.challenged + 1, total: prev.total + 1 }))
          addLog(`Request ${i + 1}: Challenged (403 Forbidden)`, "warning")
          console.log("[ISSUE DEMO] 🛡️ Simulated Vercel challenge", {
            requestNumber: i + 1,
            status: 403,
            timestamp: new Date().toISOString(),
          })

          // Log the challenge detection
          addLog("Vercel challenge detected! This would break API functionality", "error")
          console.log("[ISSUE DEMO] 🛡️ Vercel challenge detected", {
            requestNumber: i + 1,
            status: 403,
            responseContainsVercel: true,
            responseContainsChallenge: true,
            timestamp: new Date().toISOString(),
          })

          // Small delay to simulate network latency
          await new Promise((resolve) => setTimeout(resolve, 150))
        } else {
          // Make a real request
          try {
            const response = await fetch(`/api/demo/test-endpoint?id=${i}&t=${Date.now()}`)

            // Check the response
            if (response.status === 200) {
              setResults((prev) => ({ ...prev, success: prev.success + 1, total: prev.total + 1 }))
              addLog(`Request ${i + 1}: Success (200 OK)`, "success")
            } else if (response.status === 403) {
              setResults((prev) => ({ ...prev, challenged: prev.challenged + 1, total: prev.total + 1 }))
              addLog(`Request ${i + 1}: Challenged (403 Forbidden)`, "warning")

              // Try to read the response body to check for challenge indicators
              const text = await response.text()
              if (text.includes("vercel") && text.includes("challenge")) {
                addLog("Vercel challenge detected! This would break API functionality", "error")
              }
            } else {
              setResults((prev) => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }))
              addLog(`Request ${i + 1}: Failed (${response.status} ${response.statusText})`, "error")
            }
          } catch (error) {
            setResults((prev) => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }))
            addLog(`Request ${i + 1}: Error - ${error instanceof Error ? error.message : String(error)}`, "error")
          }
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        setResults((prev) => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }))
        addLog(`Request ${i + 1}: Error - ${error instanceof Error ? error.message : String(error)}`, "error")
        console.error("[ISSUE DEMO] ❌ Request failed", {
          requestNumber: i + 1,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        })
      }
    }

    setProgress(100)
    addLog("API request sequence completed", "info")
    console.log("[ISSUE DEMO] 🏁 Request sequence completed", {
      totalRequests,
      successful: results.success,
      challenged: results.challenged,
      failed: results.failed,
      timestamp: new Date().toISOString(),
    })

    // Try to establish a WebSocket connection
    try {
      addLog("Attempting WebSocket connection without challenge handling...", "info")
      setSocketStatus("connecting")
      console.log("[ISSUE DEMO] 🔌 Attempting WebSocket connection", {
        timestamp: new Date().toISOString(),
      })

      // Simulate WebSocket connection
      // In a real app, this would be a real WebSocket or Socket.io connection
      setTimeout(() => {
        // If we had challenges, simulate a failed connection
        // Always fail the WebSocket if we had any challenges
        if (results.challenged > 0) {
          setSocketStatus("failed")
          addLog("WebSocket connection failed - blocked by Vercel security challenge", "error")
          console.log("[ISSUE DEMO] ❌ WebSocket connection failed", {
            reason: "Vercel challenges detected in previous requests",
            timestamp: new Date().toISOString(),
          })
        } else {
          setSocketStatus("connected")
          addLog("WebSocket connected successfully", "success")
          console.log("[ISSUE DEMO] ✅ WebSocket connected successfully", {
            timestamp: new Date().toISOString(),
          })

          // Simulate disconnection after a few seconds
          setTimeout(() => {
            setSocketStatus("disconnected")
            addLog("WebSocket disconnected", "info")
            console.log("[ISSUE DEMO] 🔌 WebSocket disconnected", {
              timestamp: new Date().toISOString(),
            })
          }, 5000)
        }
      }, 2000)
    } catch (error) {
      setSocketStatus("failed")
      addLog(`WebSocket error: ${error instanceof Error ? error.message : String(error)}`, "error")
      console.error("[ISSUE DEMO] ❌ WebSocket error", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    }

    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div>Total Requests:</div>
              <div className="font-medium">{results.total}</div>

              <div>Successful:</div>
              <div className="font-medium text-green-500">{results.success}</div>

              <div>Challenged:</div>
              <div className="font-medium text-amber-500">{results.challenged}</div>

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
              {running ? "Running Demo..." : "Run Issue Demo"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">WebSocket Status</CardTitle>
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
    </div>
  )
}

