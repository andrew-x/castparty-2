import {
  adminClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { Auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient(), inferAdditionalFields<Auth>()],
})
