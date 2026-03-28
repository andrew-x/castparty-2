import type { Metadata } from "next"
import { SimulateEmailClient } from "@/components/admin/simulate-email-client"

export const metadata: Metadata = {
  title: "Admin — Simulate Inbound Email",
}

export default function SimulateEmailPage() {
  return <SimulateEmailClient />
}
