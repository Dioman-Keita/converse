import { Link } from "@tanstack/react-router"

import { Button } from "@/shared/ui"

export function HomePage() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.35_0.12_280_/_0.3),transparent_55%)]"
      />

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Converse
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Talk in realtime
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Chat and call with low-latency presence — self-hosted, your data
          stays yours.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login">
            <Button size="lg">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg">
              Create account
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
