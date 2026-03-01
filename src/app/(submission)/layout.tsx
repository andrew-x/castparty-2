import Image from "next/image"

export default function SubmissionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col px-page py-section">
      <header className="mb-section flex items-center gap-element">
        <Image src="/icon.svg" alt="Castparty" width={28} height={28} />
        <span className="font-serif text-foreground text-heading">
          Castparty
        </span>
      </header>
      {children}
    </main>
  )
}
