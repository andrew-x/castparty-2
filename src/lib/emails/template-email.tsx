import { Text } from "@react-email/components"
import { EmailLayout } from "./components/layout"

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#27272a",
  margin: "0 0 16px",
}

export function TemplateEmail({
  body,
  preview,
}: {
  body: string
  preview: string
}) {
  const paragraphs = body.split("\n\n")

  return (
    <EmailLayout preview={preview}>
      {paragraphs.map((p) => (
        <Text key={p} style={paragraph}>
          {p}
        </Text>
      ))}
    </EmailLayout>
  )
}
