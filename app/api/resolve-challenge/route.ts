import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get the return URL and original URL from query parameters
  const searchParams = request.nextUrl.searchParams
  const returnUrl = searchParams.get("returnUrl") || "/"
  const originalUrl = searchParams.get("originalUrl")

  console.log("[CHALLENGE RESOLUTION PAGE] 🛡️", {
    originalUrl,
    returnUrl,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") || "unknown",
  })

  // Create an HTML page that will:
  // 1. Trigger the Vercel challenge in a full page context
  // 2. Redirect back to the return URL after the challenge is resolved
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Resolving Security Check</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
          }
          .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
          }
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #000;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .log {
            background: #f0f0f0;
            border-radius: 4px;
            padding: 8px;
            margin-top: 16px;
            font-family: monospace;
            text-align: left;
            font-size: 12px;
            max-height: 100px;
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Security Verification</h2>
          <p>We're verifying your browser to protect our service from automated requests.</p>
          <div class="spinner"></div>
          <p id="status">Initiating verification...</p>
          <div id="log" class="log"></div>
        </div>
        
        <script>
          // Function to update the status message
          function updateStatus(message) {
            document.getElementById('status').textContent = message;
          }
          
          // Function to add a log entry
          function addLog(message) {
            const logEl = document.getElementById('log');
            const entry = document.createElement('div');
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            logEl.prepend(entry);
            
            // Also log to console for Vercel logs
            console.log('[CHALLENGE RESOLUTION CLIENT] 🛡️', message);
          }
          
          // Function to fetch the original URL to trigger the challenge
          async function resolveChallenge() {
            try {
              updateStatus('Verifying your browser...');
              addLog('Starting browser verification process');
              
              // The original URL that triggered the challenge
              const originalUrl = ${JSON.stringify(originalUrl)};
              
              if (originalUrl) {
                addLog(\`Fetching original URL: \${originalUrl}\`);
                
                // Make a fetch request to the original URL to trigger the challenge
                const response = await fetch(originalUrl);
                
                // If we get here, the challenge was likely resolved
                addLog(\`Received response: \${response.status} \${response.statusText}\`);
                updateStatus('Verification complete! Redirecting...');
              } else {
                // If no original URL was provided, just wait a moment
                addLog('No original URL provided, preparing verification');
                updateStatus('Preparing verification...');
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Log before redirect
              addLog(\`Redirecting to: \${${JSON.stringify(returnUrl)}}\`);
              
              // Redirect back to the return URL
              window.location.href = ${JSON.stringify(returnUrl)};
            } catch (error) {
              console.error('Error during challenge resolution:', error);
              addLog(\`Error: \${error.message}\`);
              updateStatus('Verification in progress. This may take a moment...');
              
              // Wait a bit longer and try to redirect anyway
              setTimeout(() => {
                addLog('Timeout reached, attempting redirect anyway');
                window.location.href = ${JSON.stringify(returnUrl)};
              }, 3000);
            }
          }
          
          // Start the challenge resolution process
          resolveChallenge();
        </script>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}

