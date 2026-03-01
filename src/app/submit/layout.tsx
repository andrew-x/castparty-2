import Image from "next/image"

export default function SubmissionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col items-center px-page">
      <div className="flex w-full max-w-3xl flex-col gap-section py-section">
        <header className="flex items-center gap-element">
          <Image src="/icon.svg" alt="Castparty" width={28} height={28} />
          <span className="font-serif text-foreground text-heading">
            Castparty
          </span>
        </header>
        {children}
      </div>
    </main>
  )
}
