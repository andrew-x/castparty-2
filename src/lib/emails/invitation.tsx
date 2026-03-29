import { Button, Heading, Text } from "@react-email/components"
import { EmailLayout } from "@/lib/emails/components/layout"

export function InvitationEmail({
  inviterName,
  organizationName,
  acceptUrl,
}: {
  inviterName: string
  organizationName: string
  acceptUrl: string
}) {
  return (
    <EmailLayout preview={`You're invited to ${organizationName} on Castparty`}>
      <Heading style={heading}>You're invited to {organizationName}</Heading>
      <Text style={text}>
        {inviterName} has invited you to join {organizationName} on Castparty.
      </Text>
      <Button style={button} href={acceptUrl}>
        Accept invitation
      </Button>
      <Text style={muted}>
        If you don't want to join, you can safely ignore this email.
      </Text>
    </EmailLayout>
  )
}

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#7c3aed",
  margin: "0 0 16px",
}

const text = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#27272a",
  margin: "0 0 16px",
}

const button = {
  backgroundColor: "#f97316",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "24px 0",
}

const muted = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#a1a1aa",
  margin: "16px 0 0",
}
