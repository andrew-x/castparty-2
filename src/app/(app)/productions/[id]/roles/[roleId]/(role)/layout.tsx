import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import {
  Page,
  PageBody,
  PageContent,
  PageHeader,
} from "@/components/common/page"
import { PreviewLinkButtons } from "@/components/common/preview-link-buttons"
import { RoleSubNav } from "@/components/productions/role-sub-nav"
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
      />
      <PageBody nav={<RoleSubNav productionId={id} roleId={roleId} />}>
        <PageContent className="min-h-0 overflow-hidden">
          {children}
        </PageContent>
      </PageBody>
    </Page>
  )
}
