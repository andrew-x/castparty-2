import type { Metadata } from "next"
import { AdminEmailsClient } from "@/components/admin/admin-emails-client"
import { getEmails } from "@/lib/email-dev-store"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Emails",
}

export default function AdminEmailsPage() {
  const emails = getEmails()
  return <AdminEmailsClient emails={emails} />
}
