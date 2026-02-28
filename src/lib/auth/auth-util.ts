import { getCurrentUser } from "@/lib/auth"
import { IS_MAINTENANCE_MODE } from "@/lib/util"

export async function checkAuth() {
  const user = await getCurrentUser()
  if (!user || IS_MAINTENANCE_MODE) {
    throw new Error(
      "Unauthorized: You must be signed in to perform this action",
    )
  }
  return user
}
