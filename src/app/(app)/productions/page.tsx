import { ClapperboardIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
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
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { ProductionCard } from "@/components/productions/production-card"

export const metadata: Metadata = {
  title: "Productions — Castparty",
}

export default async function ProductionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const showArchived = params.showArchived === "true"
  const allProductions = await getProductionsWithSubmissionCounts()

  const hasArchived = allProductions.some((p) => p.status === "archive")
  const productions = showArchived
    ? allProductions
    : allProductions.filter((p) => p.status !== "archive")

  return (
    <Page>
      <PageHeader
        title="Productions"
        actions={<Button href="/productions/new">Create production</Button>}
      />
      <PageContent>
        {allProductions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
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
                <Button href="/productions/new">Create production</Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="flex flex-col gap-block">
            {hasArchived && (
              <div className="flex justify-end">
                <Link
                  href={
                    showArchived
                      ? "/productions"
                      : "/productions?showArchived=true"
                  }
                  className="text-caption text-muted-foreground hover:text-foreground"
                >
                  {showArchived ? "Hide archived" : "Show archived"}
                </Link>
              </div>
            )}
            <div className="grid gap-block sm:grid-cols-2 lg:grid-cols-3">
              {productions.map((production) => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </Page>
  )
}
