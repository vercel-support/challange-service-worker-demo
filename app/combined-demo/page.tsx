"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExclamationTriangleIcon, CheckCircledIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { InfoIcon } from "lucide-react"

export default function CombinedDemo() {
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)

  // Problem demo state
  const [problemApiResponse, setProblemApiResponse] = useState<string | null>(null)
  const [problemError, setProblemError] = useState<string | null>(null)
  const [problemLoading, setProblemLoading] = useState(false)

  // Solution demo state
  const [solutionApiResponse, setSolutionApiResponse] = useState<string | null>(null)
  const [solutionError, setSolutionError] = useState<string | null>(null)
  const [solutionLoading, setSolutionLoading] = useState(false)
  const [challengeResolved, setChallengeResolved] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)

  // Check if we're in the v0 preview environment
  useEffect(() => {
    const isPreview = window.location.hostname.includes("vusercontent.net")
    setIsPreviewEnvironment(isPreview)

    if (isPreview) {
      setProblemError("Service Worker registration is not supported in the preview environment. This is a simulation.")
      setSolutionError("Service Worker registration is not supported in the preview environment. This is a simulation.")
    }

    // Check if we're returning from a challenge resolution
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("challengeResolved") === "true") {
      setChallengeResolved(true)
    }
  }, [])

  // Function to make API request for problem demo
  const makeProblemApiRequest = async () => {
    setProblemLoading(true)
    setProblemApiResponse(null)
    setProblemError(null)

    try {
      // Simulate the problem in preview environment
      await new Promise((resolve) => setTimeout(resolve, 1000))
      throw new Error("Simulated Vercel challenge error: Failed to verify your browser")
    } catch (err) {
      console.error("Problem API request error:", err)
      setProblemError(`API request failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setProblemLoading(false)
    }
  }

  // Function to make API request for solution demo
  const makeSolutionApiRequest = async () => {
    setSolutionLoading(true)
    setSolutionApiResponse(null)
    setSolutionError(null)

    try {
      // Simulate the solution in preview environment
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (simulationStep === 0) {
        // First attempt - show challenge detected
        setSimulationStep(1)
        setSolutionError("Vercel security challenge detected. Click 'Resolve Challenge' to continue.")
      } else if (simulationStep === 1) {
        // After challenge resolution
        setSimulationStep(2)
        setChallengeResolved(true)
        setSolutionApiResponse(
          JSON.stringify(
            {
              message: "API request successful after challenge resolution",
              timestamp: new Date().toISOString(),
              via: "solution-worker-simulation",
            },
            null,
            2,
          ),
        )
      }
    } catch (err) {
      console.error("Solution API request error:", err)
      setSolutionError(`API request failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSolutionLoading(false)
    }
  }

  // Function to simulate challenge resolution in preview environment
  const simulateResolveChallenge = () => {
    setSolutionLoading(true)

    // Simulate the challenge resolution process
    setTimeout(() => {
      setChallengeResolved(true)
      setSimulationStep(2)
      setSolutionLoading(false)
      setSolutionError(null)
    }, 1500)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-center">Vercel Challenge Handler Demo</h1>

      {isPreviewEnvironment && (
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Preview Environment</AlertTitle>
          <AlertDescription>
            This demo uses simulations since service workers cannot be registered in the preview environment. Deploy the
            application to see the actual implementation in action.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="problem" className="max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="problem">Problem Demo</TabsTrigger>
          <TabsTrigger value="solution">Solution Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="problem">
          <Card>
            <CardHeader>
              <CardTitle>Problem: Service Worker Challenges</CardTitle>
              <CardDescription>This demo shows how Vercel DDoS protection can break service workers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Service Worker Status</h3>
                <p className="text-amber-600">⚠️ Preview environment detected - using simulation mode</p>
              </div>

              {problemError && (
                <Alert variant="destructive">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{problemError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button onClick={makeProblemApiRequest} disabled={problemLoading}>
                  {problemLoading ? "Loading..." : "Simulate API Request"}
                </Button>
                <p className="text-sm text-gray-500">
                  This will simulate a failed request due to Vercel's DDoS protection
                </p>
              </div>

              {problemApiResponse && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">API Response</h3>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                    {problemApiResponse}
                  </pre>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md">
                <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">What's happening?</h3>
                <p className="text-amber-700 dark:text-amber-400">
                  When Vercel's DDoS protection challenges a request made by the service worker, the challenge cannot be
                  completed because service workers run in a separate thread without UI capabilities. This results in
                  API requests failing after the challenge is triggered.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solution">
          <Card>
            <CardHeader>
              <CardTitle>Solution: Challenge Detection & Handling</CardTitle>
              <CardDescription>This demo shows how to detect and properly handle Vercel challenges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Service Worker Status</h3>
                <p className="text-amber-600">⚠️ Preview environment detected - using simulation mode</p>
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

              {solutionError && (
                <Alert variant={simulationStep === 1 ? "default" : "destructive"}>
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertTitle>{simulationStep === 1 ? "Challenge Detected" : "Error"}</AlertTitle>
                  <AlertDescription>{solutionError}</AlertDescription>

                  {simulationStep === 1 && (
                    <Button onClick={simulateResolveChallenge} className="mt-2" disabled={solutionLoading}>
                      {solutionLoading ? "Resolving..." : "Resolve Challenge"}
                    </Button>
                  )}
                </Alert>
              )}

              <div className="space-y-2">
                <Button onClick={makeSolutionApiRequest} disabled={solutionLoading || simulationStep === 1}>
                  {solutionLoading ? "Loading..." : "Simulate API Request"}
                </Button>
                <p className="text-sm text-gray-500">
                  This will simulate the challenge detection and resolution process
                </p>
              </div>

              {solutionApiResponse && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">API Response</h3>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                    {solutionApiResponse}
                  </pre>
                </div>
              )}

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-300">How the solution works</h3>
                <ol className="list-decimal list-inside space-y-2 text-green-700 dark:text-green-400">
                  <li>The service worker intercepts all fetch requests</li>
                  <li>When it detects a Vercel challenge response, it notifies the main thread</li>
                  <li>The main thread resolves the challenge in-page using an iframe</li>
                  <li>After resolving the challenge, the original request is automatically retried</li>
                  <li>The service worker can now make requests without being challenged</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <Link href="/documentation">
          <Button variant="outline">View Full Documentation</Button>
        </Link>
      </div>
    </div>
  )
}

