import { eq } from "drizzle-orm"
import { Webhook } from "svix"
import db from "@/lib/db/db"
import { Email } from "@/lib/db/schema"
import logger from "@/lib/logger"
import { generateId } from "@/lib/util"

interface ResendEmailReceivedEvent {
  type: string
  data: {
    email_id?: string
    from: string
    to: string[]
    subject: string
    text?: string
    html?: string
    created_at: string
  }
}

const REPLY_TO_PATTERN = /^reply\+([^@]+)@/
const SUBMISSION_ID_PATTERN = /^sub-[a-z0-9]+$/

export async function POST(req: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error("[Webhook] RESEND_WEBHOOK_SECRET not configured")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const body = await req.text()

  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  let payload: ResendEmailReceivedEvent
  try {
    const wh = new Webhook(webhookSecret)
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendEmailReceivedEvent
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  if (payload.type !== "email.received") {
    return new Response("OK", { status: 200 })
  }

  const toAddresses = payload.data.to ?? []
  let submissionId: string | null = null
  for (const addr of toAddresses) {
    const match = addr.match(REPLY_TO_PATTERN)
    if (match) {
      submissionId = match[1]
      break
    }
  }

  if (!submissionId || !SUBMISSION_ID_PATTERN.test(submissionId)) {
    logger.error(
      "[Webhook] No valid submission ID found in to addresses:",
      toAddresses,
    )
    return new Response("OK", { status: 200 })
  }

  const submission = await db.query.Submission.findFirst({
    where: (s) => eq(s.id, submissionId),
    columns: { id: true },
    with: {
      role: {
        columns: { id: true },
        with: { production: { columns: { organizationId: true } } },
      },
    },
  })

  if (!submission) {
    logger.error("[Webhook] Submission not found for ID:", submissionId)
    return new Response("OK", { status: 200 })
  }

  const fromEmail = payload.data.from ?? "unknown"
  const subject = payload.data.subject ?? "(no subject)"
  const bodyText = payload.data.text ?? ""
  const bodyHtml = payload.data.html ?? bodyText

  await db.insert(Email).values({
    id: generateId("eml"),
    organizationId: submission.role.production.organizationId,
    submissionId,
    sentByUserId: null,
    direction: "inbound",
    fromEmail,
    toEmail: toAddresses.join(", "),
    subject,
    bodyText,
    bodyHtml,
    templateType: null,
  })

  return new Response("OK", { status: 200 })
}
