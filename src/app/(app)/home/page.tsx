import { ClapperboardIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import { getDashboardProductions } from "@/actions/dashboard/get-dashboard-productions"
import { getRecentActivity } from "@/actions/dashboard/get-recent-activity"
import { getRecentInboundEmails } from "@/actions/dashboard/get-recent-emails"
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
import { ActivityWidget } from "@/components/home/activity-widget"
import { EmailsWidget } from "@/components/home/emails-widget"
import { ProductionsWidget } from "@/components/home/productions-widget"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Home — Castparty",
}

export default async function HomePage() {
  const [user, productions, emails, activity] = await Promise.all([
    getCurrentUser(),
    getDashboardProductions(),
    getRecentInboundEmails(),
    getRecentActivity(),
  ])

  const hasVisibleProductions = productions.some((p) => p.status !== "archive")

  return (
    <Page>
      <PageHeader
        title={`Welcome, ${user?.firstName ?? ""}`}
        actions={
          hasVisibleProductions ? (
            <Button href="/productions/new" leftSection={<PlusIcon />}>
              Create production
            </Button>
          ) : undefined
        }
      />
      <PageContent>
        {!hasVisibleProductions ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClapperboardIcon />
                </EmptyMedia>
                <EmptyTitle>No productions yet</EmptyTitle>
                <EmptyDescription>
                  Create your first production to start managing auditions,
                  tracking submissions, and casting roles.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button href="/productions/new">Create production</Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="grid gap-section lg:grid-cols-[3fr_2fr]">
            <ProductionsWidget productions={productions} />
            <div className="flex flex-col gap-section">
              <EmailsWidget emails={emails} />
              <ActivityWidget activity={activity} />
            </div>
          </div>
        )}
      </PageContent>
    </Page>
  )
}
