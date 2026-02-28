"use client"

import "@/styles/globals.scss"
import Link from "next/link"

import { Button } from "@/components/common/button"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main
          data-slot="global-error"
          className="flex min-h-svh flex-col items-center justify-center px-page"
        >
          <div className="flex flex-col items-center gap-group text-center">
            <div className="flex flex-col items-center gap-element">
              <h1 className="font-serif text-foreground text-title">
                Something went wrong backstage.
              </h1>
              <p className="max-w-sm text-muted-foreground">
                Something unexpected happened. Give it another try.
              </p>
            </div>
            <div className="flex items-center gap-block">
              <Button onClick={reset}>Try again</Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
