import { type NextRequest, NextResponse } from "next/server"

// Let's search for any hidden rate limiting code
export async function GET(request: NextRequest) {
  // Get request info
  const requestId = crypto.randomUUID()
  const via = request.nextUrl.searchParams.get("via") || "direct"

  console.log(`[API] Request ${requestId} received via ${via}`)

  // Generate a random stock price to simulate real data
  const stockSymbol = "ACME"
  const stockPrice = (Math.random() * 100 + 50).toFixed(2)
  const changePercent = (Math.random() * 10 - 5).toFixed(2)
  const timestamp = new Date().toISOString()

  // Add a small delay to simulate processing
  await new Promise((resolve) => setTimeout(resolve, 200))

  console.log(`[API] Request ${requestId}: Successfully processed`)

  // Always return a successful response with no rate limiting
  return NextResponse.json(
    {
      message: "Stock data retrieved successfully",
      data: {
        stock: {
          symbol: stockSymbol,
          price: Number.parseFloat(stockPrice),
          change: Number.parseFloat(changePercent),
          currency: "USD",
        },
        timestamp,
        requestId,
        via,
      },
    },
    {
      headers: {
        "X-Request-ID": requestId,
        // Ensure no cache headers
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  )
}

