import {
  adminClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
