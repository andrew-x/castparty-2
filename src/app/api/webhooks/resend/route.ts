import { Webhook } from "svix"
import { receiveInboundEmail } from "@/actions/emails/receive-inbound-email"
import logger from "@/lib/logger"

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

  await receiveInboundEmail({
    resendEmailId: payload.data.email_id,
    submissionId,
    fromEmail: payload.data.from ?? "unknown",
    toAddresses,
    subject: payload.data.subject ?? "(no subject)",
    bodyText: payload.data.text ?? "",
    bodyHtml: payload.data.html ?? payload.data.text ?? "",
    createdAt: payload.data.created_at,
  })

  return new Response("OK", { status: 200 })
}
