import type { Metadata } from "next"
import { getOrganizations } from "@/actions/admin/get-orphaned-orgs"
import { AdminOrgsClient } from "@/components/admin/admin-orgs-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Organizations",
}

export default async function AdminOrganizationsPage() {
  const orgs = await getOrganizations()
  return <AdminOrgsClient orgs={orgs} />
}
