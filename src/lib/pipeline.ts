import { generateId } from "@/lib/util"

export const SYSTEM_STAGES = [
  { name: "Inbound", order: 0, type: "APPLIED" as const },
  { name: "Cast", order: 1000, type: "SELECTED" as const },
  { name: "Rejected", order: 1001, type: "REJECTED" as const },
]

/**
 * Build the 3 system pipeline stage rows for a new role.
 */
export function buildSystemStages(
  roleId: string,
  productionId: string,
  organizationId: string,
) {
  return SYSTEM_STAGES.map((s) => ({
    id: generateId("stg"),
    roleId,
    productionId,
    organizationId,
    name: s.name,
    order: s.order,
    type: s.type,
  }))
}
