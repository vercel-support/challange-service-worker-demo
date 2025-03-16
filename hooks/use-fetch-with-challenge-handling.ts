"use client"

import { useState, useCallback } from "react"
import { fetchWithChallengeHandling } from "@/lib/challenge-handler"

interface UseFetchWithChallengeHandlingOptions {
  onChallengeDetected?: (url: string) => void
}

interface FetchState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

/**
 * A hook that wraps fetch with Vercel challenge handling
 */
export function useFetchWithChallengeHandling<T = any>(options: UseFetchWithChallengeHandlingOptions = {}) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const fetchData = useCallback(
    async (url: string, fetchOptions?: RequestInit) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetchWithChallengeHandling(url, fetchOptions)

        // If we get here, the response was not a challenge
        const data = await response.json()
        setState({ data, error: null, loading: false })
        return { data, response }
      } catch (error) {
        // If this is a challenge handling redirect, we don't want to set an error state
        if (error instanceof Error && error.message === "Handling Vercel challenge") {
          // The page will redirect, so we just return
          return
        }

        // Otherwise, it's a real error
        const errorObj = error instanceof Error ? error : new Error(String(error))
        setState({ data: null, error: errorObj, loading: false })
        throw error
      }
    },
    [options],
  )

  return {
    ...state,
    fetchData,
  }
}

