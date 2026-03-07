import { ClapperboardIcon, LockIcon, LockOpenIcon } from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import day from "@/lib/dayjs"
import { cn } from "@/lib/util"

interface Props {
  production: {
    id: string
    name: string
    isOpen: boolean
    createdAt: Date
    roleCount: number
    submissionCount: number
  }
}

export function ProductionCard({ production }: Props) {
  return (
    <Link
      href={`/productions/${production.id}`}
      className="group relative flex items-start gap-element rounded-lg border px-block py-element transition-colors hover:bg-muted/50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <ClapperboardIcon className="size-5 text-foreground" />
      </div>
      <div className="flex min-w-0 flex-col gap-element">
        <h3 className="truncate font-medium text-foreground text-label">
          {production.name}
        </h3>
        <p className="text-caption text-muted-foreground">
          {day(production.createdAt).format("LL")} &middot;{" "}
          {production.roleCount} {production.roleCount === 1 ? "role" : "roles"}{" "}
          &middot; {production.submissionCount}{" "}
          {production.submissionCount === 1 ? "submission" : "submissions"}
        </p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "absolute top-element right-block",
              production.isOpen
                ? "text-muted-foreground/60"
                : "text-muted-foreground/40",
            )}
          >
            {production.isOpen ? (
              <LockOpenIcon className="size-3.5" />
            ) : (
              <LockIcon className="size-3.5" />
            )}
            <span className="sr-only">
              {production.isOpen ? "Open" : "Closed"}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {production.isOpen ? "Accepting submissions" : "Closed"}
        </TooltipContent>
      </Tooltip>
    </Link>
  )
}
