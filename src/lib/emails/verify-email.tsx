import { Button, Heading, Text } from "@react-email/components"
import { EmailLayout } from "./components/layout"

export function VerifyEmailEmail({
  name,
  verifyUrl,
}: {
  name: string
  verifyUrl: string
}) {
  return (
    <EmailLayout preview="Verify your Castparty email">
      <Heading style={heading}>Verify your email</Heading>
      <Text style={text}>Hi {name},</Text>
      <Text style={text}>
        Thanks for signing up. Please verify your email address by clicking the
        button below.
      </Text>
      <Button style={button} href={verifyUrl}>
        Verify email
      </Button>
      <Text style={muted}>
        If you didn't create an account, you can safely ignore this email.
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
