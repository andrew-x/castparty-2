import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action"
import { z } from "zod"
import logger from "@/lib/logger"
import { generateId, IS_MAINTENANCE_MODE } from "@/lib/util"
import { checkAuth } from "./auth/auth-util"

export const publicActionClient = createSafeActionClient({
  handleServerError(e) {
    logger.error(e, "Action failed")

    if (e instanceof Error) {
      return e.message
    }

    return DEFAULT_SERVER_ERROR_MESSAGE
  },
  defineMetadataSchema() {
    return z.object({
      action: z.string(),
    })
  },
}).use(async ({ next, clientInput, metadata }) => {
  const requestId = generateId("req")
  logger.info({
    requestId,
    metadata,
    clientInput,
  })

  if (IS_MAINTENANCE_MODE) {
    throw new Error("Maintenance mode is enabled")
  }

  const start = performance.now()
  const result = await next()
  const end = performance.now()
  const duration = end - start

  logger.info({
    requestId,
    metadata,
    duration: `${duration.toFixed(2)}ms`,
    result,
  })

  return result
})

export const secureActionClient = publicActionClient.use(async ({ next }) => {
  const user = await checkAuth()
  return next({ ctx: { user } })
})
