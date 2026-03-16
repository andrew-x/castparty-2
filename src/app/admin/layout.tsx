import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { getSession } from "@/lib/auth"
import db from "@/lib/db/db"
import { user } from "@/lib/db/schema"
import { IS_DEV } from "@/lib/util"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!IS_DEV) notFound()

  const sessionData = await getSession()
  const isImpersonating = !!sessionData?.session?.impersonatedBy

  // Auto-promote the real user to admin so better-auth impersonation works.
  // Safe because the page is already gated by IS_DEV.
  if (
    sessionData?.user &&
    !isImpersonating &&
    sessionData.user.role !== "admin"
  ) {
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, sessionData.user.id))
  }

  return (
    <main className="min-h-svh bg-background px-page py-section">
      <div className="mx-auto flex max-w-4xl flex-col gap-section">
        {isImpersonating && (
          <ImpersonationBanner userName={sessionData.user?.name ?? "Unknown"} />
        )}
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
