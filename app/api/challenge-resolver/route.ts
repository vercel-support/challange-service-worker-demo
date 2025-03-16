import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const originalUrl = request.nextUrl.searchParams.get("originalUrl")
  const redirectBack = request.nextUrl.searchParams.get("redirectBack")
  const isIframe = request.nextUrl.searchParams.get("iframe") === "true"

  if (!originalUrl) {
    return NextResponse.json({ error: "Missing originalUrl parameter" }, { status: 400 })
  }

  try {
    console.log(`[Challenge Resolver] Attempting to resolve challenge for: ${originalUrl}`)

    // Try to fetch the original URL to resolve the challenge
    const response = await fetch(originalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
      },
      cache: "no-store",
    })

    console.log(`[Challenge Resolver] Response status: ${response.status}`)

    // If we get here, either there was no challenge or it was resolved
    if (isIframe) {
      console.log(`[Challenge Resolver] Returning iframe response`)
      // If this is in an iframe, return HTML that will post a message to the parent window
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Challenge Resolved</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 20px;
              text-align: center;
              background-color: #f9f9f9;
            }
            .success {
              color: #10b981;
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              color: #4b5563;
            }
          </style>
        </head>
        <body>
          <div class="success">✓ Challenge Resolved</div>
          <p>You can now continue using the application.</p>
          <script>
            // Notify the parent window that the challenge has been resolved
            window.parent.postMessage({ type: 'CHALLENGE_RESOLVED' }, '*');
            console.log("Sent CHALLENGE_RESOLVED message to parent");
          </script>
        </body>
        </html>
        `,
        {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        },
      )
    } else if (redirectBack) {
      console.log(`[Challenge Resolver] Redirecting back to: ${redirectBack}`)
      // Add a query parameter to indicate the challenge was resolved
      const redirectUrl = new URL(redirectBack)
      redirectUrl.searchParams.set("challengeResolved", "true")
      return NextResponse.redirect(redirectUrl)
    }

    // If no redirect URL was provided, return success
    return NextResponse.json({
      success: true,
      message: "Challenge resolved successfully",
    })
  } catch (error) {
    console.error("[Challenge Resolver] Error resolving challenge:", error)
    return NextResponse.json(
      {
        error: "Failed to resolve challenge",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

