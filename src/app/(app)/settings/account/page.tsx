import { redirect } from "next/navigation"
import { AccountSettings } from "@/components/auth/account-settings"
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner"
import { getCurrentUser } from "@/lib/auth"

export default async function AccountSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      {!user.emailVerified && <EmailVerificationBanner email={user.email} />}
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Account</h2>
        <AccountSettings email={user.email} />
      </section>
    </div>
  )
}
