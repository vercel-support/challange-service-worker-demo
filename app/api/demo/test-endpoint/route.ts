import { type NextRequest, NextResponse } from "next/server"

// Simple API endpoint for testing
export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id") || "unknown"

  // Return a simple JSON response
  return NextResponse.json({
    success: true,
    id,
    timestamp: new Date().toISOString(),
  })
}

