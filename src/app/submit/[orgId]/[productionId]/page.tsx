import { UserIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicProduction } from "@/actions/submissions/get-public-production"
import { Button } from "@/components/common/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string; productionId: string }>
}): Promise<Metadata> {
  const { productionId } = await params
  const production = await getPublicProduction(productionId)
  return {
    title: production
      ? `${production.name} — Auditions`
      : "Auditions — Castparty",
  }
}

export default async function SubmitProductionPage({
  params,
}: {
  params: Promise<{ orgId: string; productionId: string }>
}) {
  const { orgId, productionId } = await params

  const production = await getPublicProduction(productionId)

  if (!production || production.organizationId !== orgId) notFound()

  return (
    <div className="flex flex-col gap-section">
      <div>
        <h1 className="font-serif text-title">{production.name}</h1>
        {production.description && (
          <p className="mt-2 text-body text-muted-foreground">
            {production.description}
          </p>
        )}
      </div>

      {production.roles.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserIcon />
            </EmptyMedia>
            <EmptyTitle>No roles listed</EmptyTitle>
            <EmptyDescription>
              This production has no roles open for submission.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-element">
          {production.roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between gap-element rounded-lg border p-group"
            >
              <div className="flex items-center gap-element">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <UserIcon className="size-4 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-label">
                    {role.name}
                  </p>
                  {role.description && (
                    <p className="text-caption text-muted-foreground">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>
              <Button
                href={`/submit/${orgId}/${productionId}/${role.id}`}
                variant="outline"
                size="sm"
              >
                Submit
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
