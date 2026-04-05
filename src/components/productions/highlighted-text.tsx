import { TEMPLATE_VARIABLES } from "@/lib/email-template"

const validVariableSet = new Set<string>(TEMPLATE_VARIABLES)

/** Renders text with valid {{variables}} highlighted. */
export function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\{\{[\w]*\}\})/g)
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{(\w*)\}\}$/)
        if (match && validVariableSet.has(match[1])) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: static split, no reordering
            <mark key={i} className="rounded-sm bg-brand/15 text-brand">
              {part}
            </mark>
          )
        }
        // biome-ignore lint/suspicious/noArrayIndexKey: static split, no reordering
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
