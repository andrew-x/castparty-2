"use client"

import { Label, Pie, PieChart } from "recharts"
import type {
  DashboardStage,
  DashboardSubmission,
} from "@/actions/productions/get-production-dashboard"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/common/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/common/empty"

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

export function DashboardRejectReasonsChart({
  submissions,
  pipelineStages,
}: Props) {
  const rejectedStageIds = new Set(
    pipelineStages.filter((s) => s.type === "REJECTED").map((s) => s.id),
  )

  const rejectedSubmissions = submissions.filter((s) =>
    rejectedStageIds.has(s.stageId),
  )

  if (rejectedSubmissions.length === 0) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyTitle>No rejected submissions</EmptyTitle>
          <EmptyDescription>
            Rejection reason data will appear here when candidates are rejected.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const reasonCounts = new Map<string, number>()
  for (const sub of rejectedSubmissions) {
    const reason = sub.rejectionReason?.trim() || "No reason given"
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)
  }

  const data = Array.from(reasonCounts.entries()).map(([reason, count], i) => ({
    key: `reason-${i}`,
    reason,
    count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.key, { label: d.reason, color: d.fill }]),
  )

  const totalRejected = rejectedSubmissions.length

  return (
    <ChartContainer config={config} className="aspect-square h-64 w-full">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="key" labelKey="reason" />}
        />
        <Pie
          data={data}
          dataKey="count"
          nameKey="reason"
          innerRadius={50}
          outerRadius={80}
          strokeWidth={2}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground font-bold text-2xl"
                    >
                      {totalRejected}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      rejected
                    </tspan>
                  </text>
                )
              }
              return null
            }}
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  )
}
