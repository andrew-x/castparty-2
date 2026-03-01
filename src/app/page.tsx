import Image from "next/image"

import { Button } from "@/components/common/button"

export default function Home() {
  return (
    <main
      data-slot="landing"
      className="flex min-h-svh flex-col items-center justify-center px-page"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, var(--color-brand-subtle) 0%, transparent 70%)",
      }}
    >
      <div className="flex flex-col items-center gap-section text-center">
        <div className="flex flex-col items-center gap-block">
          <Image
            src="/logo.svg"
            alt="Castparty"
            width={409}
            height={77}
            priority
          />
          <p className="max-w-sm text-body-lg text-muted-foreground">
            The easiest way to cast your next show.
          </p>
        </div>
        <Button href="/auth" size="lg">
          Get Started
        </Button>
      </div>
    </main>
  )
}
