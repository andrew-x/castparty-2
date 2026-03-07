import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export function EmailLayout({
  preview,
  children,
}: {
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Castparty</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Section style={footer}>
            <Text style={footerText}>
              Castparty — Casting made simple for every production.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0",
  padding: "0",
}

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "40px 0",
}

const header = {
  textAlign: "center" as const,
  padding: "0 0 24px",
}

const logo = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#7c3aed",
  margin: "0",
}

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "40px 32px",
}

const footer = {
  textAlign: "center" as const,
  padding: "24px 0 0",
}

const footerText = {
  fontSize: "13px",
  color: "#a1a1aa",
  margin: "0",
}
