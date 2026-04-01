import { redirect } from "next/navigation"
import { getOrganization } from "@/actions/organizations/get-organization"
import { getOrganizationProfile } from "@/actions/organizations/get-organization-profile"
import { OrgSettingsForm } from "@/components/organizations/org-settings-form"
import { getSession } from "@/lib/auth"
import { getAppUrl } from "@/lib/url"

export default async function OrganizationSettingsPage() {
  const session = await getSession()
  const activeOrgId = session?.session?.activeOrganizationId
  if (!activeOrgId) redirect("/home")

  const [orgData, profile] = await Promise.all([
    getOrganization(activeOrgId),
    getOrganizationProfile(activeOrgId),
  ])

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Organization Profile</h2>
        <OrgSettingsForm
          organizationId={activeOrgId}
          currentName={orgData.organization.name}
          currentSlug={orgData.organization.slug}
          currentLogo={orgData.organization.logo ?? null}
          currentDescription={profile.description}
          currentWebsiteUrl={profile.websiteUrl}
          currentIsOrganizationProfileOpen={profile.isOrganizationProfileOpen}
          auditionUrl={getAppUrl(`/s/${orgData.organization.slug}`)}
        />
      </section>
    </div>
  )
}
