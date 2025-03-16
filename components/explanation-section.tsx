"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle } from "lucide-react"

export default function ExplanationSection() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Understanding the Problem</CardTitle>
          <CardDescription>Why Vercel's security challenges can break API requests and WebSockets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>
            Vercel's Web Application Firewall (WAF) and DDoS protection system help protect your application from
            attacks. When suspicious activity is detected, Vercel may issue a "challenge" to verify that the request is
            coming from a real browser.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Works for Regular Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  When a user navigates to a page directly, the browser can complete the challenge and continue to the
                  requested page.
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  Breaks API and WebSocket Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  When your application makes fetch requests or WebSocket connections, the challenge can't be properly
                  completed, resulting in 403 errors and broken functionality.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h3 className="font-medium mb-2">Common symptoms include:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>API requests failing with 403 errors</li>
              <li>WebSocket connections being dropped</li>
              <li>"Failed to verify your browser" messages</li>
              <li>Issues occurring more in Chrome than other browsers</li>
              <li>Problems after refreshing the page multiple times</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>The Solution</CardTitle>
          <CardDescription>How our challenge handler detects and resolves Vercel security challenges</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="detection">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="detection">1. Detection</TabsTrigger>
              <TabsTrigger value="resolution">2. Resolution</TabsTrigger>
              <TabsTrigger value="integration">3. Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="detection" className="space-y-4">
              <p>The system detects Vercel challenges by checking for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The <code>x-vercel-protection</code> header
                </li>
                <li>
                  URLs containing <code>_vercel/protection/challenge</code>
                </li>
                <li>403 status codes with specific response patterns</li>
              </ul>
              <div className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
                <pre>{`function isVercelChallenge(response) {
  return (
    response.status === 403 &&
    (response.headers.get('x-vercel-protection') !== null ||
      response.url.includes('_vercel/protection/challenge'))
  );
}`}</pre>
              </div>
            </TabsContent>

            <TabsContent value="resolution" className="space-y-4">
              <p>When a challenge is detected:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>The user is redirected to a dedicated challenge resolution page</li>
                <li>This page makes the same request in a full-page context</li>
                <li>The browser completes the challenge</li>
                <li>The user is redirected back to the original page</li>
              </ol>
              <div className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
                <pre>{`function handleVercelChallenge(originalUrl, returnUrl) {
  // Create a challenge resolution URL
  const challengeResolutionUrl = 
    \`/api/resolve-challenge?originalUrl=\${encodeURIComponent(originalUrl)}&returnUrl=\${encodeURIComponent(returnUrl)}\`;
  
  // Redirect to the challenge resolution page
  window.location.href = challengeResolutionUrl;
}`}</pre>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <p>The solution integrates with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>API Requests</strong>: Using <code>fetchWithChallengeHandling</code> or the{" "}
                  <code>useFetchWithChallengeHandling</code> hook
                </li>
                <li>
                  <strong>WebSockets</strong>: Using the <code>createSocketConnection</code> utility
                </li>
                <li>
                  <strong>Service Worker</strong>: Detecting challenges and communicating with the main thread
                </li>
              </ul>
              <div className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
                <pre>{`// Example usage
const { data, error, loading, fetchData } = useFetchWithChallengeHandling();

// Make a request with challenge handling
await fetchData('/api/auth/get-session');`}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

