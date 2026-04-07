import Link from "next/link"
import type { DashboardProduction } from "@/actions/dashboard/get-dashboard-productions"
import { Badge } from "@/components/common/badge"
import day from "@/lib/dayjs"
import { cn } from "@/lib/util"

interface Props {
  productions: DashboardProduction[]
}

const statusConfig: Record<string, { label: string; badge: string }> = {
  open: { label: "Open", badge: "bg-success-subtle text-success-text" },
  closed: { label: "Closed", badge: "bg-muted text-muted-foreground" },
  archive: { label: "Archived", badge: "bg-muted text-muted-foreground" },
}

export function ProductionsWidget({ productions }: Props) {
  const visibleProductions = productions.filter((p) => p.status !== "archive")

  if (visibleProductions.length === 0) return null

  return (
    <section className="flex flex-col gap-block">
      <h2 className="font-medium text-heading">Productions</h2>
      <div className="flex max-h-[32rem] flex-col gap-block overflow-y-auto">
        {visibleProductions.map((production) => {
          const config = statusConfig[production.status]
          return (
            <Link
              key={production.id}
              href={`/productions/${production.id}`}
              className={cn(
                "group flex flex-col overflow-hidden rounded-lg border transition-colors hover:bg-muted/30",
                production.status === "closed" && "opacity-75",
              )}
            >
              <div
                className={cn(
                  "h-1",
                  production.status === "open"
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                )}
              />
              <div className="flex flex-col gap-group px-block py-block">
                <div className="flex items-start justify-between gap-element">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-foreground text-label">
                      {production.name}
                    </h3>
                    <p className="text-caption text-muted-foreground">
                      {production.roleCount}{" "}
                      {production.roleCount === 1 ? "role" : "roles"}
                      {Number(production.roleCount) > 0 && (
                        <>
                          {" "}
                          ({production.openRoleCount} open,{" "}
                          {production.closedRoleCount} closed
                          {Number(production.archivedRoleCount) > 0 &&
                            `, ${production.archivedRoleCount} archived`}
                          )
                        </>
                      )}{" "}
                      &middot; Created{" "}
                      {day(production.createdAt).format("MMM D")}
                    </p>
                  </div>
                  <Badge className={cn("shrink-0", config.badge)}>
                    {config.label}
                  </Badge>
                </div>
                <div className="flex gap-group">
                  <Stat label="Applied" value={production.appliedCount} />
                  <Stat label="In Review" value={production.inReviewCount} />
                  <Stat label="Selected" value={production.selectedCount} />
                  <Stat label="Rejected" value={production.rejectedCount} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-semibold text-foreground text-label">{value}</div>
      <div className="text-caption-sm text-muted-foreground">{label}</div>
    </div>
  )
}
