"use client"

import { MailIcon, MapPinIcon, PencilIcon, PhoneIcon } from "lucide-react"
import { useState } from "react"
import { EditCandidateDialog } from "@/components/candidates/edit-candidate-dialog"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { Page, PageContent, PageHeader } from "@/components/common/page"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import { SubmissionDetailSheet } from "@/components/productions/submission-detail-sheet"
import day from "@/lib/dayjs"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import { getStageBadgeProps } from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

interface SubmissionRow {
  submission: SubmissionWithCandidate
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
  roleName: string
  productionName: string
}

interface Props {
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    createdAt: Date | string
  }
  submissions: SubmissionRow[]
}

function ContactInfo({ candidate }: { candidate: Props["candidate"] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-group gap-y-element text-label">
      <div className="flex items-center gap-element">
        <MailIcon className="size-4 text-muted-foreground" />
        <span>{candidate.email}</span>
      </div>
      {candidate.phone && (
        <div className="flex items-center gap-element">
          <PhoneIcon className="size-4 text-muted-foreground" />
          <span>{candidate.phone}</span>
        </div>
      )}
      {candidate.location && (
        <div className="flex items-center gap-element">
          <MapPinIcon className="size-4 text-muted-foreground" />
          <span>{candidate.location}</span>
        </div>
      )}
    </div>
  )
}

export function CandidateDetail({ candidate, submissions }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const selected = selectedIndex !== null ? submissions[selectedIndex] : null
  const fullName = `${candidate.firstName} ${candidate.lastName}`

  function handleStageChange(updated: SubmissionWithCandidate) {
    if (selectedIndex === null) return
    submissions[selectedIndex] = {
      ...submissions[selectedIndex],
      submission: updated,
    }
  }

  return (
    <Page>
      <PageHeader
        title={fullName}
        breadcrumbs={[
          { label: "Candidates", href: "/candidates" },
          { label: fullName },
        ]}
        description={<ContactInfo candidate={candidate} />}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftSection={<PencilIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
          </Button>
        }
      />
      <PageContent>
        <div className="flex flex-col gap-block">
          <h2 className="font-medium text-foreground text-heading">
            Submissions
          </h2>
          {submissions.length === 0 ? (
            <p className="text-label text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Production</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((row, index) => (
                  <TableRow
                    key={row.submission.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <TableCell className="text-foreground">
                      {row.productionName}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {row.roleName}
                    </TableCell>
                    <TableCell>
                      {row.submission.stage && (
                        <Badge {...getStageBadgeProps(row.submission.stage)}>
                          {row.submission.stage.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {day(row.submission.createdAt).format("LL")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <SubmissionDetailSheet
          submission={selected?.submission ?? null}
          pipelineStages={selected?.pipelineStages ?? []}
          submissionFormFields={selected?.submissionFormFields ?? []}
          feedbackFormFields={selected?.feedbackFormFields ?? []}
          onClose={() => setSelectedIndex(null)}
          onStageChange={handleStageChange}
        />
      </PageContent>

      <EditCandidateDialog
        candidate={candidate}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </Page>
  )
}
