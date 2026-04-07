"use client"

import { InfoIcon } from "lucide-react"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import type { DashboardSubmission } from "@/actions/productions/get-production-dashboard"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/common/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/common/empty"
import day from "@/lib/dayjs"

interface Props {
  submissions: DashboardSubmission[]
  productionStatus: string
}

const chartConfig: ChartConfig = {
  count: {
    label: "Submissions",
    color: "var(--chart-1)",
  },
}

export function DashboardInboundChart({
  submissions,
  productionStatus,
}: Props) {
  const today = day().startOf("day")
  const sevenDaysAgo = today.subtract(6, "day")

  const dayCounts = new Map<string, number>()
  for (let i = 0; i < 7; i++) {
    const d = sevenDaysAgo.add(i, "day")
    dayCounts.set(d.format("YYYY-MM-DD"), 0)
  }

  for (const sub of submissions) {
    const d = day(sub.createdAt).format("YYYY-MM-DD")
    if (dayCounts.has(d)) {
      dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1)
    }
  }

  const data = Array.from(dayCounts.entries()).map(([date, count]) => ({
    date,
    label: day(date).format("MMM D"),
    count,
  }))

  const totalCount = data.reduce((sum, d) => sum + d.count, 0)

  const isClosed =
    productionStatus === "closed" || productionStatus === "archive"

  if (totalCount === 0) {
    return (
      <div className="flex flex-col gap-block">
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyTitle>No submissions in the last 7 days</EmptyTitle>
            <EmptyDescription>
              New submissions will appear here as candidates apply.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        {isClosed && (
          <div className="flex items-center gap-element rounded-md bg-muted px-block py-element">
            <InfoIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <p className="text-caption text-muted-foreground">
              This production is no longer accepting submissions.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-block">
      <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
        <LineChart data={data} margin={{ left: 0, right: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Line
            dataKey="count"
            type="monotone"
            stroke="var(--color-count)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-count)" }}
          />
        </LineChart>
      </ChartContainer>
      {isClosed && (
        <div className="flex items-center gap-element rounded-md bg-muted px-block py-element">
          <InfoIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <p className="text-caption text-muted-foreground">
            This production is no longer accepting submissions.
          </p>
        </div>
      )}
    </div>
  )
}
