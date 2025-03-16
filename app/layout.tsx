import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./clientLayout"

export const metadata: Metadata = {
  title: "Vercel Challenge Handler Demo",
  description: "A demo showing how to handle Vercel security challenges",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}



import './globals.css'