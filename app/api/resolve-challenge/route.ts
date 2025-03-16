import { NextResponse } from 'next/server'

// Constants
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

// Types for log messages
type LogLevel = 'info' | 'warning' | 'error' | 'success'

interface LogMessage {
  message: string
  level: LogLevel
  timestamp: string
}

/**
 * Generates HTML for the challenge resolution page
 */
function generateHTML(
  originalUrl: string,
  returnUrl: string,
  logs: LogMessage[] = []
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Verification</title>
        <style>
            body {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.5;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f5f5f5;
            }
            .container {
                max-width: 600px;
                width: 100%;
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h1 {
                margin-top: 0;
                color: #333;
            }
            .status {
                margin: 1rem 0;
                padding: 1rem;
                border-radius: 4px;
                background: #f8f9fa;
            }
            .log {
                margin: 1rem 0;
                padding: 1rem;
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.9rem;
                max-height: 200px;
                overflow-y: auto;
                background: #f8f9fa;
            }
            .log-entry {
                margin: 0.5rem 0;
                padding: 0.5rem;
                border-radius: 4px;
            }
            .info { background: #e3f2fd; }
            .warning { background: #fff3e0; }
            .error { background: #ffebee; }
            .success { background: #e8f5e9; }
            #verifyButton {
                background: #0070f3;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.2s;
            }
            #verifyButton:hover {
                background: #0051a8;
            }
            #verifyButton:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Security Verification</h1>
            <div id="status" class="status">
                Preparing verification...
            </div>
            <div id="log" class="log">
                ${logs.map(log => `
                    <div class="log-entry ${log.level}">
                        [${log.timestamp}] ${log.message}
                    </div>
                `).join('')}
            </div>
            <button id="verifyButton" onclick="startVerification()">
                Start Verification
            </button>
        </div>
        <script>
            // Store URLs for verification
            const originalUrl = ${JSON.stringify(originalUrl)};
            const returnUrl = ${JSON.stringify(returnUrl)};
            let retryCount = 0;

            // Update the status message
            function updateStatus(message, level = 'info') {
                const status = document.getElementById('status');
                status.textContent = message;
                status.className = 'status ' + level;
            }

            // Add a log message
            function addLog(message, level = 'info') {
                const log = document.getElementById('log');
                const entry = document.createElement('div');
                entry.className = 'log-entry ' + level;
                entry.textContent = '[' + new Date().toISOString() + '] ' + message;
                log.appendChild(entry);
                log.scrollTop = log.scrollHeight;
            }

            // Start the verification process
            async function startVerification() {
                const button = document.getElementById('verifyButton');
                button.disabled = true;
                
                try {
                    updateStatus('Verifying...', 'info');
                    addLog('Starting verification process');
                    
                    // Attempt to fetch the original URL
                    const response = await fetch(originalUrl, {
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        addLog('Verification successful', 'success');
                        updateStatus('Verification successful! Redirecting...', 'success');
                        
                        // Redirect back to the return URL
                        setTimeout(() => {
                            window.location.href = returnUrl;
                        }, 1000);
                    } else {
                        if (retryCount < ${MAX_RETRIES}) {
                            retryCount++;
                            addLog('Retry ' + retryCount + '/' + ${MAX_RETRIES} + ' in ' + ${RETRY_DELAY}/1000 + 's...', 'warning');
                            updateStatus('Verification failed. Retrying in ' + ${RETRY_DELAY}/1000 + ' seconds...', 'warning');
                            
                            setTimeout(() => {
                                button.disabled = false;
                                startVerification();
                            }, ${RETRY_DELAY});
                        } else {
                            addLog('Maximum retry attempts reached', 'error');
                            updateStatus('Verification failed. Please try again later.', 'error');
                            button.disabled = false;
                        }
                    }
                } catch (error) {
                    addLog('Error during verification: ' + error.message, 'error');
                    updateStatus('Verification failed. Please try again.', 'error');
                    button.disabled = false;
                }
            }

            // Start verification automatically
            startVerification();
        </script>
    </body>
    </html>
  `
}

/**
 * Handle GET requests to the challenge resolution endpoint
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const originalUrl = searchParams.get('originalUrl')
  const returnUrl = searchParams.get('returnUrl')

  if (!originalUrl || !returnUrl) {
    return new NextResponse('Missing required parameters', { status: 400 })
  }

  // Generate the challenge resolution page
  const html = generateHTML(originalUrl, returnUrl)

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

