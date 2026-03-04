import type { Metadata } from "next"
import { getActiveOrgSlug } from "@/actions/organizations/get-active-org-slug"
import { CreateProductionForm } from "@/components/productions/create-production-form"

export const metadata: Metadata = {
  title: "New production — Castparty",
}

export default async function NewProductionPage() {
  const orgSlug = await getActiveOrgSlug()

  return (
    <div className="flex flex-col gap-group px-page py-section">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-serif text-title">New production</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Set up your production details. You can add roles now or later.
        </p>
        <div className="mt-section">
          <CreateProductionForm orgSlug={orgSlug} />
        </div>
      </div>
    </div>
  )
}
