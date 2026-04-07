"use client"

import type {
  DashboardStage,
  DashboardSubmission,
} from "@/actions/productions/get-production-dashboard"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/common/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface Props {
  submissions: DashboardSubmission[]
  pipelineStages: DashboardStage[]
}

export function DashboardFunnelChart({ submissions, pipelineStages }: Props) {
  const stageCounts = new Map<string, number>()
  for (const sub of submissions) {
    stageCounts.set(sub.stageId, (stageCounts.get(sub.stageId) ?? 0) + 1)
  }

  const data = pipelineStages.map((stage, i) => ({
    name: stage.name,
    value: stageCounts.get(stage.id) ?? 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const hasData = data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyTitle>No submissions to show</EmptyTitle>
          <EmptyDescription>
            Submissions will appear here once candidates apply.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-element">
      {data.map((stage) => (
        <div key={stage.name} className="flex items-center gap-block">
          <span className="w-24 shrink-0 truncate text-right text-caption text-muted-foreground">
            {stage.name}
          </span>
          <div className="relative flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="h-7 rounded transition-all"
                  style={{
                    width: `${Math.max((stage.value / maxValue) * 100, 2)}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                {stage.name}: {stage.value}
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="w-8 shrink-0 text-right font-medium text-caption tabular-nums">
            {stage.value}
          </span>
        </div>
      ))}
    </div>
  )
}
