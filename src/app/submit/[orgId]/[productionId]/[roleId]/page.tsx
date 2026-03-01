import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicRole } from "@/actions/submissions/get-public-role"
import { SubmissionForm } from "@/components/submissions/submission-form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string; productionId: string; roleId: string }>
}): Promise<Metadata> {
  const { roleId } = await params
  const role = await getPublicRole(roleId)
  return {
    title: role ? `Submit for ${role.name} — Castparty` : "Submit — Castparty",
  }
}

export default async function SubmitRolePage({
  params,
}: {
  params: Promise<{ orgId: string; productionId: string; roleId: string }>
}) {
  const { orgId, productionId, roleId } = await params

  const role = await getPublicRole(roleId)

  if (
    !role ||
    role.productionId !== productionId ||
    role.production.organizationId !== orgId
  ) {
    notFound()
  }

  return (
    <div className="flex max-w-lg flex-col gap-section">
      <div>
        <p className="text-caption text-muted-foreground">
          {role.production.name}
        </p>
        <h1 className="font-serif text-title">{role.name}</h1>
        {role.description && (
          <p className="mt-2 text-body text-muted-foreground">
            {role.description}
          </p>
        )}
      </div>

      <SubmissionForm
        orgId={orgId}
        productionId={productionId}
        roleId={roleId}
      />
    </div>
  )
}
