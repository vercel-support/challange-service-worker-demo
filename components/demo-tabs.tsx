"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, ShieldAlert, Zap } from "lucide-react"
import IssueDemo from "./issue-demo"
import SolutionDemo from "./solution-demo"
import ServiceWorkerControls from "./service-worker-controls"
import ExplanationSection from "./explanation-section"

export default function DemoTabs() {
  return (
    <Tabs defaultValue="explanation" className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="explanation">
          <InfoIcon className="h-4 w-4 mr-2" />
          Explanation
        </TabsTrigger>
        <TabsTrigger value="issue">
          <ShieldAlert className="h-4 w-4 mr-2" />
          The Issue
        </TabsTrigger>
        <TabsTrigger value="solution">
          <Zap className="h-4 w-4 mr-2" />
          The Solution
        </TabsTrigger>
        <TabsTrigger value="troubleshooting">Tools</TabsTrigger>
      </TabsList>

      <TabsContent value="explanation">
        <ExplanationSection />
      </TabsContent>

      <TabsContent value="issue">
        <Card>
          <CardHeader>
            <CardTitle>Demonstrating the Issue</CardTitle>
            <CardDescription>
              This section demonstrates how Vercel's security challenges can break API requests and WebSockets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 border-amber-500">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <AlertTitle>Important Note</AlertTitle>
              <AlertDescription>
                This demo will intentionally trigger Vercel's security challenges by making rapid API requests. This
                simulates what happens when your application makes multiple fetch or WebSocket requests.
              </AlertDescription>
            </Alert>

            <IssueDemo />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="solution">
        <Card>
          <CardHeader>
            <CardTitle>The Solution in Action</CardTitle>
            <CardDescription>
              See how our challenge handler detects and resolves Vercel security challenges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SolutionDemo />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="troubleshooting">
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Tools</CardTitle>
            <CardDescription>
              If you're experiencing issues with security challenges, these tools can help
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ServiceWorkerControls />

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <DebugInfo />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function DebugInfo() {
  const [info, setInfo] = useState({
    serviceWorkerActive: false,
    serviceWorkerVersion: "unknown",
    browser: "unknown",
    challengeCookiePresent: false,
  })

  // Check service worker status
  useState(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setInfo((prev) => ({
          ...prev,
          serviceWorkerActive: !!registration,
          serviceWorkerVersion: registration?.active?.scriptURL || "unknown",
        }))
      })
    }

    // Detect browser
    const userAgent = navigator.userAgent
    let browser = "unknown"
    if (userAgent.indexOf("Chrome") > -1) browser = "Chrome"
    else if (userAgent.indexOf("Firefox") > -1) browser = "Firefox"
    else if (userAgent.indexOf("Safari") > -1) browser = "Safari"
    else if (userAgent.indexOf("Edge") > -1) browser = "Edge"

    // Check for challenge cookie
    const hasChallengeResolved = document.cookie.includes("vercel-challenge-resolved")

    setInfo((prev) => ({
      ...prev,
      browser,
      challengeCookiePresent: hasChallengeResolved,
    }))
  }, [])

  return (
    <div className="text-sm space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="font-medium">Service Worker:</div>
        <div>{info.serviceWorkerActive ? "Active" : "Inactive"}</div>

        <div className="font-medium">Browser:</div>
        <div>{info.browser}</div>

        <div className="font-medium">Challenge Cookie:</div>
        <div>{info.challengeCookiePresent ? "Present" : "Not Present"}</div>
      </div>
    </div>
  )
}

