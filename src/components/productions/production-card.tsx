import { ClapperboardIcon } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/common/badge"
import day from "@/lib/dayjs"

interface Props {
  production: {
    id: string
    name: string
    description: string | null
    createdAt: Date
    submissionCount: number
  }
}

export function ProductionCard({ production }: Props) {
  return (
    <Link
      href={`/productions/${production.id}`}
      className="group flex flex-col gap-element rounded-lg border p-group transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-element">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ClapperboardIcon className="size-5 text-foreground" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate font-medium text-foreground text-label">
            {production.name}
          </h3>
          {production.description && (
            <p className="line-clamp-2 text-caption text-muted-foreground">
              {production.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted-foreground">
          Created {day(production.createdAt).format("LL")}
        </p>
        <Badge variant="secondary">
          {production.submissionCount}{" "}
          {production.submissionCount === 1 ? "submission" : "submissions"}
        </Badge>
      </div>
    </Link>
  )
}
