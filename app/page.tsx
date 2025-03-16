import DemoTabs from "../components/demo-tabs"

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-4">Vercel Challenge Handler Demo</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This demo shows how to handle Vercel security challenges for API requests, WebSockets, and service workers.
        </p>

        <DemoTabs />
      </div>
    </main>
  )
}

