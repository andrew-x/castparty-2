import { redirect } from "next/navigation"

export default async function SubmitRolePage({
  params,
}: {
  params: Promise<{
    orgSlug: string
    productionSlug: string
    roleSlug: string
  }>
}) {
  const { orgSlug, productionSlug } = await params
  redirect(`/s/${orgSlug}/${productionSlug}`)
}
