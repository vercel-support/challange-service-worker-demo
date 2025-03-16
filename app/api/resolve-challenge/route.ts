import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get the return URL and original URL from query parameters
  const searchParams = request.nextUrl.searchParams
  const returnUrl = searchParams.get("returnUrl") || "/"
  const originalUrl = searchParams.get("originalUrl")
  const requestId = searchParams.get("requestId")

  console.log("[CHALLENGE RESOLUTION PAGE] 🛡️", {
    originalUrl,
    returnUrl,
    requestId,
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
        <title>Security Verification Required</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
            color: #333;
          }
          .card {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            max-width: 500px;
            width: 100%;
          }
          .spinner {
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 3px solid #000;
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
            background: #f7f7f7;
            border-radius: 8px;
            padding: 12px;
            margin-top: 20px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            text-align: left;
            font-size: 12px;
            max-height: 120px;
            overflow-y: auto;
            border: 1px solid #eaeaea;
          }
          .log-entry {
            margin: 4px 0;
            line-height: 1.4;
          }
          .error {
            color: #e11d48;
          }
          .success {
            color: #059669;
          }
          .warning {
            color: #d97706;
          }
          .retry-button {
            background: #000;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 16px;
            transition: background-color 0.2s;
          }
          .retry-button:hover {
            background: #333;
          }
          .retry-button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a;
              color: #fff;
            }
            .card {
              background: #262626;
            }
            .log {
              background: #333;
              border-color: #404040;
            }
            .retry-button {
              background: #fff;
              color: #000;
            }
            .retry-button:hover {
              background: #e5e5e5;
            }
            .retry-button:disabled {
              background: #404040;
              color: #666;
            }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Security Verification Required</h2>
          <p>We're verifying your browser to protect our service. This should only take a moment.</p>
          <div class="spinner"></div>
          <p id="status">Initiating verification...</p>
          <div id="log" class="log"></div>
          <button id="retryButton" class="retry-button" style="display: none;" onclick="retryVerification()">
            Retry Verification
          </button>
        </div>
        
        <script>
          const MAX_RETRIES = 3;
          const RETRY_DELAY = 2000;
          let retryCount = 0;
          let isVerifying = false;

          // Function to update the status message
          function updateStatus(message, type = 'info') {
            const statusEl = document.getElementById('status');
            statusEl.textContent = message;
            statusEl.className = type;
          }
          
          // Function to add a log entry
          function addLog(message, type = 'info') {
            const logEl = document.getElementById('log');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            logEl.insertBefore(entry, logEl.firstChild);
            
            // Also log to console for debugging
            console.log(\`[CHALLENGE RESOLUTION] [\${type.toUpperCase()}] \${message}\`);
          }

          // Function to show/hide retry button
          function toggleRetryButton(show) {
            const button = document.getElementById('retryButton');
            button.style.display = show ? 'inline-block' : 'none';
            button.disabled = isVerifying;
          }
          
          // Function to verify the browser and handle the challenge
          async function verifyBrowser() {
            if (isVerifying) return;
            isVerifying = true;
            toggleRetryButton(false);

            try {
              updateStatus('Verifying your browser...', 'info');
              addLog('Starting browser verification process');
              
              const originalUrl = ${JSON.stringify(originalUrl)};
              const requestId = ${JSON.stringify(requestId)};
              
              if (originalUrl) {
                addLog(\`Attempting to verify URL: \${originalUrl}\`);
                
                // Make a fetch request to the original URL to trigger/resolve the challenge
                const response = await fetch(originalUrl, {
                  credentials: 'include', // Include cookies
                  headers: {
                    'X-Request-ID': requestId || 'unknown',
                  }
                });
                
                if (response.ok) {
                  addLog('Verification successful!', 'success');
                  updateStatus('Verification complete! Redirecting...', 'success');
                  
                  // Small delay before redirect to show success message
                  setTimeout(() => {
                    window.location.href = ${JSON.stringify(returnUrl)};
                  }, 1000);
                  return;
                }
                
                // If we get a 403, the challenge might need more time
                if (response.status === 403) {
                  throw new Error('Challenge verification in progress');
                }
                
                throw new Error(\`Unexpected response: \${response.status}\`);
              } else {
                addLog('No verification URL provided', 'warning');
                updateStatus('Preparing verification...', 'warning');
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // If we get here without a redirect, try the return URL
              addLog(\`Redirecting to: \${${JSON.stringify(returnUrl)}}\`);
              window.location.href = ${JSON.stringify(returnUrl)};
              
            } catch (error) {
              console.error('Error during verification:', error);
              addLog(\`Error: \${error.message}\`, 'error');
              
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                addLog(\`Retry \${retryCount}/\${MAX_RETRIES} in \${RETRY_DELAY/1000}s...`, 'warning');
                updateStatus(\`Verification failed. Retrying in \${RETRY_DELAY/1000} seconds...\`, 'warning');
                
                setTimeout(() => {
                  isVerifying = false;
                  verifyBrowser();
                }, RETRY_DELAY);
              } else {
                updateStatus('Verification failed. Please try again.', 'error');
                addLog('Maximum retry attempts reached', 'error');
                toggleRetryButton(true);
              }
            } finally {
              isVerifying = false;
            }
          }
          
          // Function to manually retry verification
          function retryVerification() {
            retryCount = 0;
            verifyBrowser();
          }
          
          // Start the verification process
          verifyBrowser();
          
          // Listen for visibility changes to retry verification when tab becomes visible
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !isVerifying) {
              addLog('Tab became visible, retrying verification...', 'info');
              retryVerification();
            }
          });
        </script>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store, must-revalidate",
    },
  })
}

