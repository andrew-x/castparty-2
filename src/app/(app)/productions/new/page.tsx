import type { Metadata } from "next"
import { getActiveOrgSlug } from "@/actions/organizations/get-active-org-slug"
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { CreateProductionForm } from "@/components/productions/create-production-form"

export const metadata: Metadata = {
  title: "New production — Castparty",
}

export default async function NewProductionPage() {
  const orgSlug = await getActiveOrgSlug()

  return (
    <Page>
      <PageHeader
        title="New production"
        description="Set up your production details. You can add roles now or later."
      />
      <PageContent>
        <div className="mx-auto w-full max-w-xl">
          <CreateProductionForm orgSlug={orgSlug} />
        </div>
      </PageContent>
    </Page>
  )
}
