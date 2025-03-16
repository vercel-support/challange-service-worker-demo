import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const via = request.nextUrl.searchParams.get("via") || "direct"
  const numRequests = Number(request.nextUrl.searchParams.get("requests")) || 10

  console.log(`[Test Challenge] Making ${numRequests} requests via ${via}`)

  // Make multiple rapid requests to try to trigger the challenge
  const requests = Array.from({ length: numRequests }, async () => {
    const response = await fetch(`${request.nextUrl.origin}/api/challenged-endpoint?via=${via}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
      },
    })
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    }
  })

  try {
    const results = await Promise.all(requests)
    return NextResponse.json({
      message: "Test completed",
      results,
      requestId,
      via,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      message: error instanceof Error ? error.message : String(error),
      requestId,
      via,
    }, { status: 500 })
  }
} 