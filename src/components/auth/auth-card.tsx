import Image from "next/image"

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-group">
      <Image src="/icon.svg" alt="Castparty" width={48} height={48} />
      <div className="w-full rounded-xl border border-border bg-background p-section">
        {children}
      </div>
    </div>
  )
}
