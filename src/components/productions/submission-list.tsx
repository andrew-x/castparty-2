import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import day from "@/lib/dayjs"
import {
  getStageBadgeProps,
  getStageLabel,
  type SubmissionWithCandidate,
} from "@/lib/submission-helpers"

interface Props {
  submissions: SubmissionWithCandidate[]
  onSelect: (s: SubmissionWithCandidate) => void
}

export function SubmissionList({ submissions, onSelect }: Props) {
  if (submissions.length === 0) {
    return (
      <p className="py-2 text-caption text-muted-foreground">
        No submissions in this stage.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-element">
      {submissions.map((submission) => {
        const badgeProps = getStageBadgeProps(submission.stage)
        return (
          <Button
            key={submission.id}
            variant="ghost"
            onClick={() => onSelect(submission)}
            className="h-auto w-full justify-between p-2 text-left"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-element">
                <span className="font-medium text-foreground text-label">
                  {submission.firstName} {submission.lastName}
                </span>
                <Badge
                  variant={badgeProps.variant}
                  className={badgeProps.className}
                >
                  {getStageLabel(submission)}
                </Badge>
              </div>
              <span className="text-caption text-muted-foreground">
                {submission.email}
              </span>
            </div>
            <span className="text-caption text-muted-foreground">
              {day(submission.createdAt).format("LL")}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
