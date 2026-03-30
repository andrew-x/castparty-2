import sanitizeHtml from "sanitize-html"

const DESCRIPTION_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "strong", "em", "ul", "ol", "li", "br"],
  allowedAttributes: {},
  allowedSchemes: [],
}

export function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, DESCRIPTION_SANITIZE_OPTIONS)
}
