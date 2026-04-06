import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { FieldValues } from "react-hook-form"

/**
 * Typed wrapper around standardSchemaResolver for use with useHookFormAction.
 *
 * Form schemas intentionally differ from action schemas (fewer fields),
 * so the resolver type doesn't match what the adapter expects. This
 * wrapper centralises the cast so individual form files stay clean.
 */
// biome-ignore lint/suspicious/noExplicitAny: form schema is a subset of action schema
export function formResolver(schema: StandardSchemaV1<FieldValues>): any {
  return standardSchemaResolver(schema)
}
