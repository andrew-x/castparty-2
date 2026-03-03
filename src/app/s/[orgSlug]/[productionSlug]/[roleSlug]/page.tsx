import type { Metadata } from "next"
import { getPublicOrg } from "@/actions/submissions/get-public-org"
import { getPublicProduction } from "@/actions/submissions/get-public-production"
import { getPublicRole } from "@/actions/submissions/get-public-role"
import { NotFoundEntity } from "@/components/submissions/not-found-entity"
import { SubmissionForm } from "@/components/submissions/submission-form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    orgSlug: string
    productionSlug: string
    roleSlug: string
  }>
}): Promise<Metadata> {
  const { orgSlug, productionSlug, roleSlug } = await params
  const org = await getPublicOrg(orgSlug)
  if (!org) return { title: "Submit — Castparty" }
  const production = await getPublicProduction(org.id, productionSlug)
  if (!production) return { title: "Submit — Castparty" }
  const role = await getPublicRole(production.id, roleSlug)
  return {
    title: role ? `Submit for ${role.name} — Castparty` : "Submit — Castparty",
  }
}

export default async function SubmitRolePage({
  params,
}: {
  params: Promise<{
    orgSlug: string
    productionSlug: string
    roleSlug: string
  }>
}) {
  const { orgSlug, productionSlug, roleSlug } = await params

  const org = await getPublicOrg(orgSlug)
  if (!org) return <NotFoundEntity entity="organization" />

  const production = await getPublicProduction(org.id, productionSlug)
  if (!production) return <NotFoundEntity entity="production" />

  const role = await getPublicRole(production.id, roleSlug)
  if (!role) return <NotFoundEntity entity="role" />

  return (
    <div className="flex flex-col gap-section">
      <div>
        <p className="text-caption text-muted-foreground">{production.name}</p>
        <h1 className="font-serif text-title">{role.name}</h1>
        {role.description && (
          <p className="mt-2 text-body text-muted-foreground">
            {role.description}
          </p>
        )}
      </div>

      <SubmissionForm
        orgId={org.id}
        productionId={production.id}
        roleId={role.id}
        orgSlug={orgSlug}
        productionSlug={productionSlug}
      />
    </div>
  )
}
