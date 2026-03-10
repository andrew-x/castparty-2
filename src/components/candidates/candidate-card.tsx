import Link from "next/link"
import { Badge } from "@/components/common/badge"
import type { PipelineStageData } from "@/lib/submission-helpers"
import { getStageBadgeProps } from "@/lib/submission-helpers"

const MAX_VISIBLE_SUBMISSIONS = 2

interface Submission {
  id: string
  role: { id: string; name: string } | null
  production: { id: string; name: string } | null
  stage: PipelineStageData | null
}

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  headshotUrl: string | null
  submissions: Submission[]
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  const visibleSubmissions = candidate.submissions.slice(
    0,
    MAX_VISIBLE_SUBMISSIONS,
  )
  const overflowCount = candidate.submissions.length - MAX_VISIBLE_SUBMISSIONS

  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-muted/50"
    >
      <div className="relative aspect-square w-full bg-muted">
        {candidate.headshotUrl ? (
          // biome-ignore lint/performance/noImgElement: external R2 URLs
          <img
            src={candidate.headshotUrl}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="font-medium text-heading text-muted-foreground">
              {getInitials(candidate.firstName, candidate.lastName)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-2">
        <div>
          <p className="truncate font-medium text-caption text-foreground">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="truncate text-caption text-muted-foreground">
            {candidate.email}
          </p>
        </div>

        {candidate.submissions.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {visibleSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-1 text-caption"
              >
                <span className="truncate text-muted-foreground">
                  {sub.production?.name ?? "Unknown"} /{" "}
                  {sub.role?.name ?? "Unknown"}
                </span>
                {sub.stage && (
                  <Badge
                    {...getStageBadgeProps(sub.stage)}
                    className="shrink-0"
                  >
                    {sub.stage.name}
                  </Badge>
                )}
              </div>
            ))}
            {overflowCount > 0 && (
              <p className="text-caption text-muted-foreground">
                +{overflowCount} more
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
