import Image from "next/image"
import { Button } from "@/components/common/button"

export default function SubmissionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col items-center px-page">
      <div className="flex w-full max-w-page-content flex-1 flex-col gap-section py-section">
        {children}
      </div>
      <footer className="flex w-full max-w-page-content items-center justify-center gap-element py-section">
        <Image src="/icon.svg" alt="Castparty" width={16} height={16} />
        <span className="text-caption text-muted-foreground">
          Powered by{" "}
          <Button
            href="/"
            variant="link"
            className="h-auto p-0 text-caption text-muted-foreground"
          >
            Castparty
          </Button>
        </span>
      </footer>
    </main>
  )
}
