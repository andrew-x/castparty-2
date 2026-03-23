import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { EmailTemplatesForm } from "@/components/productions/email-templates-form"
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/email-template"
import type { EmailTemplates } from "@/lib/types"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `Email Templates — ${production.name} — Castparty`
      : "Email Templates — Castparty",
  }
}

export default async function EmailTemplatesSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)

  if (!production) {
    notFound()
  }

  return (
    <EmailTemplatesForm
      production={{
        id: production.id,
        emailTemplates:
          (production.emailTemplates as EmailTemplates | null) ??
          DEFAULT_EMAIL_TEMPLATES,
      }}
    />
  )
}
