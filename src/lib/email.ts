import type { ReactElement } from "react"
import { addEmail } from "@/lib/email-dev-store"
import logger from "@/lib/logger"
import { IS_DEV } from "@/lib/util"

interface SendEmailOptions {
  to: string
  subject: string
  react: ReactElement
  text: string
}

const from =
  process.env.EMAIL_FROM ?? "Castparty <message@mail.joincastparty.com>"

export async function sendEmail({
  to,
  subject,
  react,
  text,
}: SendEmailOptions): Promise<{ html: string }> {
  try {
    const { render } = await import("@react-email/components")
    const html = await render(react)

    if (IS_DEV) {
      addEmail({ to, subject, html, text })
      logger.info(`[Email] To: ${to} | Subject: ${subject}`)
      return { html }
    }

    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from, to, subject, html, text })
    return { html }
  } catch (error) {
    logger.error("[Email] Failed to send:", error)
    throw error
  }
}
