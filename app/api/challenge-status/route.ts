import { type NextRequest, NextResponse } from "next/server"

// Endpoint to notify service worker that challenge has been resolved
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resolved } = body

    if (resolved !== true) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Challenge status updated",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

