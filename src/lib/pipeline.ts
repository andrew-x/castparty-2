import { generateId } from "@/lib/util"

export const SYSTEM_STAGES = [
  { name: "Applied", order: 0, type: "APPLIED" as const },
  { name: "Selected", order: 1000, type: "SELECTED" as const },
  { name: "Rejected", order: 1001, type: "REJECTED" as const },
]

export const DEFAULT_REJECT_REASONS = [
  "Not the right fit for this role",
  "Scheduling conflict",
  "Insufficient experience",
  "Role already filled",
  "Did not meet audition requirements",
]

export const DEFAULT_PRODUCTION_STAGES = [
  { name: "Applied", order: 0, type: "APPLIED" as const },
  { name: "Screening", order: 1, type: "CUSTOM" as const },
  { name: "Audition", order: 2, type: "CUSTOM" as const },
  { name: "Callback", order: 3, type: "CUSTOM" as const },
  { name: "Selected", order: 1000, type: "SELECTED" as const },
  { name: "Rejected", order: 1001, type: "REJECTED" as const },
]

/**
 * Build the default production pipeline stages.
 */
export function buildProductionStages(
  productionId: string,
  organizationId: string,
) {
  return DEFAULT_PRODUCTION_STAGES.map((s) => ({
    id: generateId("stg"),
    productionId,
    organizationId,
    name: s.name,
    order: s.order,
    type: s.type,
  }))
}

/**
 * Build production pipeline stages from user-provided custom stage names.
 * System stages (Applied, Selected, Rejected) are always included.
 */
export function buildCustomProductionStages(
  productionId: string,
  organizationId: string,
  customStageNames: string[],
) {
  const stages = [
    { name: "Applied", order: 0, type: "APPLIED" as const },
    ...customStageNames.map((name, i) => ({
      name,
      order: i + 1,
      type: "CUSTOM" as const,
    })),
    { name: "Selected", order: 1000, type: "SELECTED" as const },
    { name: "Rejected", order: 1001, type: "REJECTED" as const },
  ]

  return stages.map((s) => ({
    id: generateId("stg"),
    productionId,
    organizationId,
    name: s.name,
    order: s.order,
    type: s.type,
  }))
}
