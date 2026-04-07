"use client"

import { MessageSquareTextIcon, StarIcon } from "lucide-react"
import type {
  DashboardComment,
  DashboardFeedback,
} from "@/actions/productions/get-production-dashboard"
import { Badge } from "@/components/common/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/common/empty"
import day from "@/lib/dayjs"

function isFeedback(
  item: DashboardComment | DashboardFeedback,
): item is DashboardFeedback {
  return "rating" in item
}

const RATING_LABELS: Record<string, string> = {
  STRONG_YES: "Strong yes",
  YES: "Yes",
  NO: "No",
  STRONG_NO: "Strong no",
}

interface Props {
  activity: (DashboardComment | DashboardFeedback)[]
}

export function DashboardRecentActivity({ activity }: Props) {
  if (activity.length === 0) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyTitle>No activity yet</EmptyTitle>
          <EmptyDescription>
            Comments and feedback from the production team will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
      {activity.map((item) => {
        if (isFeedback(item)) {
          return (
            <div key={item.id} className="flex items-start gap-block py-block">
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                <StarIcon className="size-3.5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-tight">
                <div className="flex items-center gap-element">
                  <span className="font-medium text-caption">
                    {item.submittedByName}
                  </span>
                  {item.rating && (
                    <Badge variant="outline" className="text-caption-sm">
                      {RATING_LABELS[item.rating] ?? item.rating}
                    </Badge>
                  )}
                </div>
                <span className="text-caption text-muted-foreground">
                  {item.candidateName} &middot; {item.stageName}
                </span>
                {item.notes && (
                  <p className="line-clamp-1 text-caption text-muted-foreground">
                    {item.notes}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-caption text-muted-foreground">
                {day(item.createdAt).fromNow()}
              </span>
            </div>
          )
        }

        return (
          <div key={item.id} className="flex items-start gap-block py-block">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
              <MessageSquareTextIcon className="size-3.5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-tight">
              <span className="font-medium text-caption">
                {item.submittedByName}
              </span>
              <p className="line-clamp-2 text-caption text-muted-foreground">
                {item.content}
              </p>
              <span className="text-caption text-muted-foreground">
                {item.candidateName}
              </span>
            </div>
            <span className="shrink-0 text-caption text-muted-foreground">
              {day(item.createdAt).fromNow()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
