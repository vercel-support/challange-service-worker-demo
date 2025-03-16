import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

export default function Documentation() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-8">Handling Vercel DDoS Challenges</h1>

      <Alert className="mb-8">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Vercel Configuration Required</AlertTitle>
        <AlertDescription>
          This demo requires configuring Vercel DDoS protection rules to challenge specific API endpoints. See the Setup
          Instructions on the home page.
        </AlertDescription>
      </Alert>

      <div className="space-y-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Understanding the Problem</CardTitle>
            <CardDescription>Why service workers can't handle Vercel challenges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Vercel's DDoS protection system may challenge suspicious requests to verify they're coming from legitimate
              browsers. This works well for normal page navigation, but causes problems in these scenarios:
            </p>

            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Service workers intercepting fetch requests</li>
              <li>Background API calls made by JavaScript</li>
              <li>WebSocket connections</li>
              <li>PWA applications with cached assets</li>
            </ul>

            <p>
              The challenge fails because these contexts can't display the challenge UI or handle the verification flow.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solution Overview</CardTitle>
            <CardDescription>How to properly handle Vercel challenges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>The solution involves these key components:</p>

            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>
                <strong>Challenge Detection</strong>: Identify when a response is a Vercel security challenge
              </li>
              <li>
                <strong>In-Page Resolution</strong>: Handle the challenge in an iframe without page navigation
              </li>
              <li>
                <strong>Challenge Resolution</strong>: Let the user complete the challenge in the iframe
              </li>
              <li>
                <strong>Automatic Retry</strong>: Retry the original request after challenge resolution
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
            <CardDescription>Code explanation and best practices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">1. Detecting Vercel Challenges</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                {`function isVercelChallenge(response) {
// Check for status code (usually 403)
if (response.status === 403) {
  // Check for Vercel challenge headers or content
  return response.headers.get('server') === 'Vercel' || 
         response.headers.get('x-vercel-protection') !== null;
}
return false;
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">2. Service Worker Communication</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                {`// In service worker
if (isVercelChallenge(response)) {
// Notify the main thread about the challenge
const allClients = await clients.matchAll();
for (const client of allClients) {
  client.postMessage({
    type: 'CHALLENGE_DETECTED',
    url: event.request.url
  });
}
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">3. In-Page Challenge Resolution</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                {`// In main thread
navigator.serviceWorker.addEventListener('message', async (event) => {
if (event.data.type === 'CHALLENGE_DETECTED') {
  // Create an iframe to resolve the challenge in-page
  const resolved = await resolveVercelChallengeInIframe(event.data.url);
  
  if (resolved) {
    // Retry the original request
    retryOriginalRequest();
  }
}
});`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">4. Challenge Resolver Function</h3>
              <p className="mb-2">This function creates an iframe to resolve the challenge:</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                {`// Client-side function
export async function resolveVercelChallengeInIframe(url) {
  return new Promise((resolve) => {
    // Create an iframe to load the challenge
    const iframe = document.createElement('iframe');
    iframe.src = \`/api/challenge-resolver?originalUrl=\${encodeURIComponent(url)}&iframe=true\`;
    
    // Add the iframe to the page
    document.body.appendChild(iframe);
    
    // Listen for messages from the iframe
    window.addEventListener('message', function onMessage(event) {
      if (event.data.type === 'CHALLENGE_RESOLVED') {
        // Remove the iframe
        document.body.removeChild(iframe);
        
        // Resolve the promise
        resolve(true);
      }
    });
  });
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vercel DDoS Protection Configuration</CardTitle>
            <CardDescription>How to set up challenge rules in Vercel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              To test this demo with real Vercel challenges, you need to configure DDoS protection rules in your Vercel
              dashboard:
            </p>

            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>
                In your Vercel dashboard, go to your project, then navigate to
                <strong> Settings → Security</strong>.
              </li>
              <li>
                Under "DDoS Protection", set up a rule to challenge requests to:
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li>
                    <code>/api/challenged-endpoint</code> (for both demos)
                  </li>
                </ul>
              </li>
              <li>
                Set the challenge mode to "Always Challenge" for this path to ensure consistent behavior during the
                demo.
              </li>
            </ol>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md mt-4">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Pro Tip</h3>
              <p className="text-blue-700 dark:text-blue-400">
                For production applications, consider using System Bypass Rules (available on Pro and Enterprise plans)
                to whitelist critical API endpoints or specific IP ranges.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
            <CardDescription>Recommendations for handling Vercel DDoS protection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Use browser-like headers</strong>: When making API requests, include standard browser headers
              </li>
              <li>
                <strong>Consider System Bypass Rules</strong>: For Pro and Enterprise plans, you can set up System
                Bypass Rules for essential traffic
              </li>
              <li>
                <strong>Implement proper error handling</strong>: Always handle network errors gracefully in your
                application
              </li>
              <li>
                <strong>Use Attack Challenge Mode</strong>: During high-traffic events, you can enable Attack Challenge
                Mode to protect your site
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

