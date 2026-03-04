import Link from "next/link"
import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/common/breadcrumb"
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
    <div className="flex flex-col gap-group px-page py-section">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/productions">Productions</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/productions/${id}`}>{role.production.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{role.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-title">{role.name}</h1>
          <PreviewLinkButtons
            url={getAppUrl(
              `/s/${role.production.organization.slug}/${role.production.slug}/${role.slug}`,
            )}
            href={`/s/${role.production.organization.slug}/${role.production.slug}/${role.slug}`}
          />
        </div>
        {role.description && (
          <p className="mt-2 text-body text-muted-foreground">
            {role.description}
          </p>
        )}
      </div>

      <RoleTabNav productionId={id} roleId={roleId} />
      {children}
    </div>
  )
}
