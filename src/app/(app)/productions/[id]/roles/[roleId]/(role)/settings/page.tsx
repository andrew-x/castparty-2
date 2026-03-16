import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { RoleSettingsForm } from "@/components/productions/role-settings-form"

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
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">General</h2>
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
    </div>
  )
}
