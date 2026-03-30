import { UserIcon } from "lucide-react"
import type { Metadata } from "next"
import { getPublicOrg } from "@/actions/submissions/get-public-org"
import { getPublicProduction } from "@/actions/submissions/get-public-production"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/common/accordion"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { Separator } from "@/components/common/separator"
import { NotFoundEntity } from "@/components/submissions/not-found-entity"
import { SubmissionForm } from "@/components/submissions/submission-form"
import { sanitizeDescription } from "@/lib/sanitize"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; productionSlug: string }>
}): Promise<Metadata> {
  const { orgSlug, productionSlug } = await params
  const org = await getPublicOrg(orgSlug)
  if (!org) return { title: "Auditions — Castparty" }
  const production = await getPublicProduction(org.id, productionSlug)
  return {
    title: production
      ? `${production.name} — Auditions`
      : "Auditions — Castparty",
  }
}

export default async function SubmitProductionPage({
  params,
}: {
  params: Promise<{ orgSlug: string; productionSlug: string }>
}) {
  const { orgSlug, productionSlug } = await params

  const org = await getPublicOrg(orgSlug)
  if (!org) return <NotFoundEntity entity="organization" />

  const production = await getPublicProduction(org.id, productionSlug)
  if (!production) return <NotFoundEntity entity="production" />
  if (production.status !== "open")
    return <NotFoundEntity entity="production" />

  const hasRoles = production.roles.length > 0

  return (
    <div className="flex flex-col gap-section">
      {/* Production info */}
      <div>
        <h1 className="font-serif text-title">{production.name}</h1>
        {production.description && (
          <div
            className="prose-description mt-2 text-body text-muted-foreground"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitize-html allowlist
            dangerouslySetInnerHTML={{
              __html: sanitizeDescription(production.description),
            }}
          />
        )}
      </div>

      {/* Roles accordion */}
      {hasRoles ? (
        <>
          <Accordion type="multiple">
            {production.roles.map((role) => (
              <AccordionItem key={role.id} value={role.id}>
                <AccordionTrigger>{role.name}</AccordionTrigger>
                {role.description && (
                  <AccordionContent>
                    <div
                      className="prose-description text-muted-foreground"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitize-html allowlist
                      dangerouslySetInnerHTML={{
                        __html: sanitizeDescription(role.description),
                      }}
                    />
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>

          <Separator />

          {/* Submission form */}
          <SubmissionForm
            orgId={org.id}
            productionId={production.id}
            availableRoles={production.roles}
            orgSlug={orgSlug}
            productionSlug={productionSlug}
            submissionFormFields={production.submissionFormFields}
            systemFieldConfig={production.systemFieldConfig}
          />
        </>
      ) : (
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
      )}
    </div>
  )
}
