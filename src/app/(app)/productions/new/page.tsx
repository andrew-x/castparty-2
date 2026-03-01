import type { Metadata } from "next"
import { CreateProductionForm } from "@/components/productions/create-production-form"

export const metadata: Metadata = {
  title: "New production — Castparty",
}

export default function NewProductionPage() {
  return (
    <div className="flex flex-col gap-section px-page py-section">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-serif text-title">New production</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Set up your production details. You can add roles now or later.
        </p>
        <div className="mt-section">
          <CreateProductionForm />
        </div>
      </div>
    </div>
  )
}
