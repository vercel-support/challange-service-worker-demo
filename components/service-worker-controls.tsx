"use client"

import { useState } from "react"
import { updateServiceWorker, unregisterServiceWorkers } from "@/lib/register-service-worker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Trash2 } from "lucide-react"

export default function ServiceWorkerControls() {
  const [updating, setUpdating] = useState(false)
  const [unregistering, setUnregistering] = useState(false)

  const handleUpdate = () => {
    setUpdating(true)
    updateServiceWorker()
    setTimeout(() => setUpdating(false), 1000)
  }

  const handleUnregister = () => {
    setUnregistering(true)
    unregisterServiceWorkers()
    // No need to reset state as page will reload
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Service Worker Controls
        </CardTitle>
        <CardDescription>Use these controls if you're experiencing issues with security challenges</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          If you're having trouble with Vercel security challenges, you can try updating or unregistering the service
          worker to reset your browser's connection to the site.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 w-full">
        <Button variant="outline" onClick={handleUpdate} disabled={updating} className="flex items-center gap-2 w-full">
          <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
          {updating ? "Updating..." : "Update Service Worker"}
        </Button>
        <Button
          variant="destructive"
          onClick={handleUnregister}
          disabled={unregistering}
          className="flex items-center gap-2 w-full"
        >
          <Trash2 className="h-4 w-4" />
          {unregistering ? "Unregistering..." : "Unregister Service Workers"}
        </Button>
      </CardFooter>
    </Card>
  )
}

