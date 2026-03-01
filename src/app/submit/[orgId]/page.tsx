import { ClapperboardIcon, UserIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicOrg } from "@/actions/submissions/get-public-org"
import { getPublicProductions } from "@/actions/submissions/get-public-productions"
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
  params: Promise<{ orgId: string }>
}): Promise<Metadata> {
  const { orgId } = await params
  const org = await getPublicOrg(orgId)
  return {
    title: org ? `${org.name} — Auditions` : "Auditions — Castparty",
  }
}

export default async function SubmitOrgPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  const org = await getPublicOrg(orgId)

  if (!org) notFound()

  const productions = await getPublicProductions(orgId)

  return (
    <div className="flex flex-col gap-section">
      <div>
        <h1 className="font-serif text-title">{org.name}</h1>
        <p className="mt-2 text-body text-muted-foreground">Open auditions</p>
      </div>

      {productions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClapperboardIcon />
            </EmptyMedia>
            <EmptyTitle>No open auditions</EmptyTitle>
            <EmptyDescription>
              This organization has no active productions at the moment.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-group">
          {productions.map((production) => (
            <div
              key={production.id}
              className="flex flex-col gap-block rounded-lg border p-group"
            >
              <div className="flex items-start gap-element">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <ClapperboardIcon className="size-5 text-foreground" />
                </div>
                <div>
                  <h2 className="font-medium text-foreground text-heading">
                    {production.name}
                  </h2>
                  {production.description && (
                    <p className="mt-1 text-body text-muted-foreground">
                      {production.description}
                    </p>
                  )}
                </div>
              </div>

              {production.roles.length === 0 ? (
                <p className="text-caption text-muted-foreground">
                  No roles listed.
                </p>
              ) : (
                <div className="flex flex-col gap-element">
                  {production.roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between gap-element rounded-md border p-group"
                    >
                      <div className="flex items-center gap-element">
                        <UserIcon className="size-4 text-muted-foreground" />
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
                        href={`/submit/${orgId}/${production.id}/${role.id}`}
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
          ))}
        </div>
      )}
    </div>
  )
}
