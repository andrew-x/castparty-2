import { ClapperboardIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getProductions } from "@/actions/productions/get-productions"
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

export const metadata: Metadata = {
  title: "Productions — Castparty",
}

export default async function ProductionsPage() {
  const productions = await getProductions()

  if (productions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-page">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClapperboardIcon />
            </EmptyMedia>
            <EmptyTitle>No productions yet</EmptyTitle>
            <EmptyDescription>
              Create your first production to start organizing auditions and
              casting.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/productions/new">Create production</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-section px-page py-section">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-title">Productions</h1>
        <Button asChild>
          <Link href="/productions/new">Create production</Link>
        </Button>
      </div>
      <div className="grid gap-block sm:grid-cols-2 lg:grid-cols-3">
        {productions.map((production) => (
          <ProductionCard key={production.id} production={production} />
        ))}
      </div>
    </div>
  )
}
