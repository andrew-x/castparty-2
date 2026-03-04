import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { Separator } from "@/components/common/separator"
import { RoleFormFieldsEditor } from "@/components/productions/role-form-fields-editor"
import { RoleSettingsForm } from "@/components/productions/role-settings-form"
import { RoleStagesEditor } from "@/components/productions/role-stages-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { roleId } = await params
  const role = await getRole(roleId)
  return {
    title: role
      ? `${role.name} Settings — Castparty`
      : "Role Settings — Castparty",
  }
}

export default async function RoleSettingsPage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { id, roleId } = await params
  const role = await getRole(roleId)

  if (!role || role.production.id !== id) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Role details</h2>
        <RoleSettingsForm
          roleId={role.id}
          orgSlug={role.production.organization.slug}
          productionSlug={role.production.slug}
          currentName={role.name}
          currentSlug={role.slug}
          currentDescription={role.description}
          currentIsOpen={role.isOpen}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Pipeline stages</h2>
        <RoleStagesEditor roleId={role.id} stages={role.pipelineStages} />
      </section>

      <Separator />

      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Application form</h2>
        <RoleFormFieldsEditor roleId={role.id} fields={role.formFields} />
      </section>
    </div>
  )
}
