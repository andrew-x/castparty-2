import { LinkIcon } from "lucide-react"
import type { Metadata } from "next"
import { getProductionsWithSubmissionCounts } from "@/actions/productions/get-productions-with-submission-counts"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
import { ProductionCard } from "@/components/productions/production-card"
import { getCurrentUser, getSession } from "@/lib/auth"
import { getAppUrl } from "@/lib/url"

export const metadata: Metadata = {
  title: "Home — Castparty",
}

export default async function HomePage() {
  const [user, session, productions] = await Promise.all([
    getCurrentUser(),
    getSession(),
    getProductionsWithSubmissionCounts(),
  ])
  const orgId = session?.session?.activeOrganizationId ?? null

  return (
    <div className="flex flex-col gap-section px-page py-section">
      <h1 className="font-serif text-title">Welcome, {user?.name}.</h1>

      {orgId && (
        <div className="flex flex-col gap-element rounded-lg border p-group">
          <p className="text-label text-muted-foreground">Your audition link</p>
          <div className="flex items-center gap-element">
            <p className="break-all font-mono text-caption text-foreground">
              /submit/{orgId}
            </p>
            <CopyButton value={getAppUrl(`/submit/${orgId}`)} />
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

      {productions.length > 0 && (
        <div className="flex flex-col gap-block">
          <h2 className="font-medium text-heading">Your productions</h2>
          <div className="grid gap-block sm:grid-cols-2 lg:grid-cols-3">
            {productions.map((production) => (
              <ProductionCard key={production.id} production={production} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
