"use client"

import { useState } from "react"
import { useFetchWithChallengeHandling } from "@/hooks/use-fetch-with-challenge-handling"
import { createSocketConnection } from "@/app/api/socket-io-setup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExampleUsage() {
  const { data, error, loading, fetchData } = useFetchWithChallengeHandling()
  const [socketStatus, setSocketStatus] = useState("Not connected")

  // Example of using the fetch with challenge handling
  const handleFetchData = async () => {
    try {
      await fetchData("/api/auth/get-session")
    } catch (err) {
      // Error handling is done in the hook
    }
  }

  // Example of connecting to Socket.IO with challenge handling
  const handleConnectSocket = async () => {
    try {
      setSocketStatus("Connecting...")
      const socket = await createSocketConnection("/api/socket")

      socket.on("connect", () => {
        setSocketStatus("Connected")
      })

      socket.on("disconnect", () => {
        setSocketStatus("Disconnected")
      })

      socket.on("error", (err) => {
        setSocketStatus(`Error: ${err.message}`)
      })
    } catch (err) {
      setSocketStatus(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Request Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleFetchData} disabled={loading}>
            {loading ? "Loading..." : "Fetch Session Data"}
          </Button>

          {error && <div className="text-red-500">Error: {error.message}</div>}

          {data && <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Socket.IO Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleConnectSocket}>Connect to Socket</Button>

          <div>
            Socket Status: <span className="font-medium">{socketStatus}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

