import { LinkIcon } from "lucide-react"
import type { Metadata } from "next"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
import { getCurrentUser, getSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Home — Castparty",
}

export default async function HomePage() {
  const [user, session] = await Promise.all([getCurrentUser(), getSession()])
  const orgId = session?.session?.activeOrganizationId ?? null

  return (
    <div className="flex flex-col gap-section px-page py-section">
      <h1 className="font-serif text-heading">Welcome, {user?.name}.</h1>

      {orgId && (
        <div className="flex flex-col gap-element rounded-lg border p-group">
          <p className="text-label text-muted-foreground">Your audition link</p>
          <div className="flex items-center gap-element">
            <p className="break-all font-mono text-caption text-foreground">
              /submit/{orgId}
            </p>
            <CopyButton value={`/submit/${orgId}`} />
          </div>
          <Button
            href={`/submit/${orgId}`}
            variant="outline"
            size="sm"
            leftSection={<LinkIcon />}
            className="w-fit"
          >
            View audition page
          </Button>
        </div>
      )}
    </div>
  )
}
