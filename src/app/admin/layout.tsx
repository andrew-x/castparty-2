import Link from "next/link"
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
          <nav className="flex gap-group text-label">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground"
            >
              Users
            </Link>
            <Link
              href="/admin/organizations"
              className="text-muted-foreground hover:text-foreground"
            >
              Organizations
            </Link>
            <Link
              href="/admin/emails"
              className="text-muted-foreground hover:text-foreground"
            >
              Emails
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </main>
  )
}
