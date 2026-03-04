import { ClapperboardIcon } from "lucide-react"
import type { Metadata } from "next"
import { getProductionsWithSubmissionCounts } from "@/actions/productions/get-productions-with-submission-counts"
import { Button } from "@/components/common/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { ProductionCard } from "@/components/productions/production-card"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Home — Castparty",
}

export default async function HomePage() {
  const [user, productions] = await Promise.all([
    getCurrentUser(),
    getProductionsWithSubmissionCounts(),
  ])

  return (
    <div className="flex flex-col gap-group px-page py-section">
      <h1 className="font-serif text-title">Welcome, {user?.name}.</h1>

      {productions.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClapperboardIcon />
              </EmptyMedia>
              <EmptyTitle>No productions yet</EmptyTitle>
              <EmptyDescription>
                Create your first production to start casting.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button href="/productions/new">Create production</Button>
            </EmptyContent>
          </Empty>
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
