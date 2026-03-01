import type { Metadata } from "next"
import { getProductionsWithSubmissionCounts } from "@/actions/productions/get-productions-with-submission-counts"
import { ProductionCard } from "@/components/productions/production-card"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Home — Castparty",
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const productions = await getProductionsWithSubmissionCounts()

  return (
    <div className="flex flex-col gap-section px-page py-section">
      <h1 className="font-serif text-title">Welcome, {user?.name}.</h1>

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
