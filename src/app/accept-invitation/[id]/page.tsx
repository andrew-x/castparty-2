import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AcceptInvitationCard } from "@/components/organizations/accept-invitation-card"
import { getSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Accept invitation — Castparty",
}

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    redirect(`/auth?tab=signup&redirect=/accept-invitation/${id}`)
  }

  return <AcceptInvitationCard invitationId={id} />
}
