import { MessageSquareIcon, StarIcon } from "lucide-react"
import Link from "next/link"
import type { ActivityItem } from "@/actions/dashboard/get-recent-activity"
import { Badge } from "@/components/common/badge"
import day from "@/lib/dayjs"

interface Props {
  activity: ActivityItem[]
}

const ratingLabels: Record<string, string> = {
  STRONG_YES: "Strong Yes",
  YES: "Yes",
  NO: "No",
  STRONG_NO: "Strong No",
}

const ratingColors: Record<string, string> = {
  STRONG_YES: "bg-success-light text-success-text",
  YES: "bg-success-subtle text-success-text",
  NO: "bg-error-subtle text-error-text",
  STRONG_NO: "bg-error-light text-error-text",
}

export function ActivityWidget({ activity }: Props) {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border">
      <div className="border-b px-block py-element">
        <h2 className="font-medium text-label">Recent Activity</h2>
      </div>
      {activity.length === 0 ? (
        <p className="px-block py-section text-center text-caption text-muted-foreground">
          No comments or feedback yet
        </p>
      ) : (
        <div className="flex max-h-[28rem] min-h-48 flex-col overflow-y-auto">
          {activity.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/productions/${item.productionId}?submission=${item.submissionId}`}
              className="flex items-start gap-element border-b px-block py-element transition-colors last:border-b-0 hover:bg-muted/50"
            >
              {item.type === "comment" ? (
                <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <StarIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-tight">
                <div className="flex items-baseline justify-between gap-element">
                  <span className="truncate font-medium text-foreground text-label">
                    {item.authorName}
                  </span>
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {day(item.createdAt).fromNow()}
                  </span>
                </div>
                {item.type === "comment" ? (
                  <p className="line-clamp-2 text-caption text-muted-foreground">
                    {item.content}
                  </p>
                ) : (
                  <div className="flex items-center gap-element">
                    <Badge className={ratingColors[item.rating]}>
                      {ratingLabels[item.rating]}
                    </Badge>
                    {item.notes && (
                      <span className="truncate text-caption text-muted-foreground">
                        {item.notes}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-caption text-muted-foreground">
                  {item.productionName}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
