import { notFound } from "next/navigation"
import { IS_DEV } from "@/lib/util"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!IS_DEV) notFound()

  return (
    <main className="min-h-svh bg-background px-page py-section">
      <div className="mx-auto flex max-w-4xl flex-col gap-section">
        <div className="flex flex-col gap-element">
          <p className="font-mono text-caption text-muted-foreground uppercase tracking-widest">
            Dev only
          </p>
          <h1 className="font-serif text-foreground text-title">Admin</h1>
        </div>
        {children}
      </div>
    </main>
  )
}
