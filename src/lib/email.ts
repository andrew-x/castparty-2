import type { ReactElement } from "react"
import { addEmail } from "@/lib/email-dev-store"
import logger from "@/lib/logger"
import { IS_DEV } from "@/lib/util"

export interface SendEmailOptions {
  to: string
  subject: string
  react: ReactElement
  text: string
  replyTo?: string
}

const from =
  process.env.EMAIL_FROM ?? "Castparty <message@mail.joincastparty.com>"

export async function sendEmail({
  to,
  subject,
  react,
  text,
  replyTo,
}: SendEmailOptions): Promise<{ html: string }> {
  try {
    const { render } = await import("@react-email/components")
    const html = await render(react)

    if (IS_DEV) {
      addEmail({ to, subject, html, text, replyTo })
      logger.info(`[Email] To: ${to} | Subject: ${subject}`)
      return { html }
    }

    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from, to, subject, html, text, replyTo })
    return { html }
  } catch (error) {
    logger.error("[Email] Failed to send:", error)
    throw error
  }
}

/** Resend's batch API accepts at most 100 emails per call. */
const BATCH_LIMIT = 100

export async function sendBatchEmail(
  emails: SendEmailOptions[],
): Promise<{ html: string }[]> {
  if (emails.length === 0) return []

  try {
    const { render } = await import("@react-email/components")

    const rendered = await Promise.all(
      emails.map(async (email) => ({
        ...email,
        html: await render(email.react),
      })),
    )

    if (IS_DEV) {
      for (const email of rendered) {
        addEmail({
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          replyTo: email.replyTo,
        })
        logger.info(`[Email] To: ${email.to} | Subject: ${email.subject}`)
      }
      return rendered.map(({ html }) => ({ html }))
    }

    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Chunk into batches of 100 (Resend's per-call limit)
    for (let i = 0; i < rendered.length; i += BATCH_LIMIT) {
      const chunk = rendered.slice(i, i + BATCH_LIMIT)
      await resend.batch.send(
        chunk.map((email) => ({
          from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          replyTo: email.replyTo,
        })),
      )
    }

    return rendered.map(({ html }) => ({ html }))
  } catch (error) {
    logger.error("[Email] Failed to send batch:", error)
    throw error
  }
}
