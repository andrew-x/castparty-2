import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { FieldValues } from "react-hook-form"

/**
 * Typed wrapper around standardSchemaResolver for use with useHookFormAction.
 *
 * standardSchemaResolver returns Resolver<FieldValues> (generic), but
 * useHookFormAction expects Resolver<SpecificFields> (contravariant in
 * its type parameter). The any cast bridges this mismatch so individual
 * form files stay clean.
 */
// biome-ignore lint/suspicious/noExplicitAny: Resolver<FieldValues> is not assignable to Resolver<SpecificFields> due to contravariance
export function formResolver(schema: StandardSchemaV1<FieldValues>): any {
  return standardSchemaResolver(schema)
}
