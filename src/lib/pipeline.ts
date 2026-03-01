import { generateId } from "@/lib/util"

export const SYSTEM_STAGES = [
  { slug: "inbound", name: "Inbound", position: 0, isTerminal: false },
  { slug: "cast", name: "Cast", position: 1000, isTerminal: true },
  { slug: "rejected", name: "Rejected", position: 1001, isTerminal: true },
] as const

export type SystemStageSlug = (typeof SYSTEM_STAGES)[number]["slug"]

/**
 * Build the 3 system pipeline stage rows for a new role.
 */
export function buildSystemStages(roleId: string) {
  return SYSTEM_STAGES.map((s) => ({
    id: generateId("stg"),
    roleId,
    name: s.name,
    slug: s.slug,
    position: s.position,
    isSystem: true,
    isTerminal: s.isTerminal,
  }))
}
