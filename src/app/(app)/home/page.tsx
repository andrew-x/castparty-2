import type { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Home — Castparty",
}

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-page">
      <h1 className="font-serif text-heading">Welcome, {user?.name}.</h1>
    </div>
  )
}
