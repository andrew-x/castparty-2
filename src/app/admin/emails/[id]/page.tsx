import { notFound } from "next/navigation"
import { AdminEmailDetailClient } from "@/components/admin/admin-email-detail-client"
import { getEmailById } from "@/lib/email-dev-store"

export const dynamic = "force-dynamic"

export default async function AdminEmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const email = getEmailById(id)
  if (!email) notFound()
  return <AdminEmailDetailClient email={email} />
}
