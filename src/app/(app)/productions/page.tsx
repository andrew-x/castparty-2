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
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { ProductionsTable } from "@/components/productions/productions-table"

export const metadata: Metadata = {
  title: "Productions — Castparty",
}

export default async function ProductionsPage() {
  const productions = await getProductionsWithSubmissionCounts()

  return (
    <Page>
      <PageHeader
        title="Productions"
        actions={<Button href="/productions/new">Create production</Button>}
      />
      <PageContent>
        {productions.length === 0 ? (
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
          <ProductionsTable productions={productions} />
        )}
      </PageContent>
    </Page>
  )
}
