import { Hr, Link, Text } from "@react-email/components"
import { EmailLayout } from "@/lib/emails/components/layout"

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#27272a",
  margin: "0 0 16px",
}

const divider = {
  borderColor: "#e4e4e7",
  margin: "24px 0 16px",
}

const replyHint = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#a1a1aa",
  margin: "0",
}

const replyLink = {
  color: "#7c3aed",
}

export function TemplateEmail({
  body,
  preview,
  replyTo,
}: {
  body: string
  preview: string
  replyTo?: string
}) {
  const paragraphs = body.split("\n\n")

  return (
    <EmailLayout preview={preview}>
      {paragraphs.map((p) => (
        <Text key={p} style={paragraph}>
          {p}
        </Text>
      ))}
      {replyTo && (
        <>
          <Hr style={divider} />
          <Text style={replyHint}>
            To respond, just reply to this email or send a message to{" "}
            <Link href={`mailto:${replyTo}`} style={replyLink}>
              {replyTo}
            </Link>
            .
          </Text>
        </>
      )}
    </EmailLayout>
  )
}
