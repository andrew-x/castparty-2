import { zodResolver } from "@hookform/resolvers/zod"
import type { ZodType } from "zod/v4"

/**
 * Typed wrapper around zodResolver for use with useHookFormAction.
 *
 * Form schemas intentionally differ from action schemas (fewer fields),
 * so the resolver type doesn't match what the adapter expects. This
 * wrapper centralises the cast so individual form files stay clean.
 */
// biome-ignore lint/suspicious/noExplicitAny: form schema is a subset of action schema
export function formResolver(schema: ZodType): any {
  // biome-ignore lint/suspicious/noExplicitAny: ZodType from zod/v4 isn't directly assignable to zodResolver's parameter type
  return zodResolver(schema as any)
}
