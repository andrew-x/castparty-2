import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { PreviewLinkButtons } from "@/components/common/preview-link-buttons"
import { RoleTabNav } from "@/components/productions/role-tab-nav"
import { getAppUrl } from "@/lib/url"

export default async function RoleLayout({
  params,
  children,
}: {
  params: Promise<{ id: string; roleId: string }>
  children: React.ReactNode
}) {
  const { id, roleId } = await params
  const role = await getRole(roleId)

  if (!role || role.production.id !== id) {
    notFound()
  }

  return (
    <Page>
      <PageHeader
        title={role.name}
        description={role.description}
        breadcrumbs={[
          { label: "Productions", href: "/productions" },
          {
            label: role.production.name,
            href: `/productions/${id}`,
          },
          { label: role.name },
        ]}
        actions={
          <PreviewLinkButtons
            url={getAppUrl(
              `/s/${role.production.organization.slug}/${role.production.slug}/${role.slug}`,
            )}
            href={`/s/${role.production.organization.slug}/${role.production.slug}/${role.slug}`}
          />
        }
        tabs={<RoleTabNav productionId={id} roleId={roleId} />}
      />
      <PageContent>{children}</PageContent>
    </Page>
  )
}
