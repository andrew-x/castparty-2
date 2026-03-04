"use client"

import { useState } from "react"
import { Badge } from "@/components/common/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs"
import { SubmissionDetailSheet } from "@/components/productions/submission-detail-sheet"
import { SubmissionList } from "@/components/productions/submission-list"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"

interface Props {
  submissions: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
}

export function RoleSubmissions({ submissions, pipelineStages }: Props) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(null)

  if (submissions.length === 0) {
    return (
      <p className="text-caption text-muted-foreground">No submissions yet.</p>
    )
  }

  return (
    <>
      <Tabs defaultValue="all">
        <TabsList variant="line" className="flex-wrap">
          <TabsTrigger value="all">
            All{" "}
            <Badge variant="secondary" className="ml-1">
              {submissions.length}
            </Badge>
          </TabsTrigger>
          {pipelineStages.map((stage) => {
            const count = submissions.filter(
              (s) => s.stageId === stage.id,
            ).length
            if (count === 0) return null
            return (
              <TabsTrigger key={stage.id} value={stage.id}>
                {stage.name}{" "}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value="all">
          <SubmissionList
            submissions={submissions}
            onSelect={setSelectedSubmission}
          />
        </TabsContent>
        {pipelineStages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id}>
            <SubmissionList
              submissions={submissions.filter((s) => s.stageId === stage.id)}
              onSelect={setSelectedSubmission}
            />
          </TabsContent>
        ))}
      </Tabs>

      <SubmissionDetailSheet
        submission={selectedSubmission}
        pipelineStages={pipelineStages}
        onClose={() => setSelectedSubmission(null)}
        onStageChange={setSelectedSubmission}
      />
    </>
  )
}
