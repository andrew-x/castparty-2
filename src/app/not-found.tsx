import Image from "next/image"

import { Button } from "@/components/common/button"

export default function NotFound() {
  return (
    <main
      data-slot="not-found"
      className="flex min-h-svh flex-col items-center justify-center px-page"
    >
      <div className="flex flex-col items-center gap-group text-center">
        <div className="flex flex-col items-center gap-element">
          <Image src="/icon.svg" alt="" width={60} height={60} />
          <span
            className="select-none font-bold font-serif text-[10rem] text-brand-light leading-none sm:text-[12rem]"
            aria-hidden="true"
          >
            404
          </span>
        </div>
        <div className="flex flex-col items-center gap-element">
          <h1 className="font-serif text-foreground text-title">
            This page didn&apos;t make the callback list.
          </h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </div>
    </main>
  )
}
