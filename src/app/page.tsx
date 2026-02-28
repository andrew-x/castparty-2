import Image from "next/image"
import Link from "next/link"

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
        <Link
          href="/auth"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-cta px-8 font-medium text-cta-fg text-label transition-all hover:bg-cta-hover focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Get Started
        </Link>
      </div>
    </main>
  )
}
