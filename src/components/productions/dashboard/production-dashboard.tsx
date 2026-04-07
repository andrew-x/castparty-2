"use client"

import { InboxIcon } from "lucide-react"
import { useState } from "react"
import type {
  DashboardComment,
  DashboardEmail,
  DashboardFeedback,
  DashboardRole,
  DashboardStage,
  DashboardSubmission,
} from "@/actions/productions/get-production-dashboard"
import { Button } from "@/components/common/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { ShareLink } from "@/components/common/share-link"
import { DashboardFunnelChart } from "@/components/productions/dashboard/funnel-chart"
import { DashboardInboundChart } from "@/components/productions/dashboard/inbound-chart"
import { DashboardRecentActivity } from "@/components/productions/dashboard/recent-activity"
import { DashboardRecentEmails } from "@/components/productions/dashboard/recent-emails"
import { DashboardRejectReasonsChart } from "@/components/productions/dashboard/reject-reasons-chart"

interface Props {
  submissions: DashboardSubmission[]
  pipelineStages: DashboardStage[]
  roles: DashboardRole[]
  rejectReasons: string[]
  recentEmails: DashboardEmail[]
  recentActivity: (DashboardComment | DashboardFeedback)[]
  productionStatus: string
  shareUrl: string
  shareHref: string
}

export function ProductionDashboard({
  submissions,
  pipelineStages,
  roles,
  recentEmails,
  recentActivity,
  productionStatus,
  shareUrl,
  shareHref,
}: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState("all")

  if (submissions.length === 0) {
    return (
      <Empty className="min-h-80">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>You don't have any submissions yet</EmptyTitle>
          <EmptyDescription>
            Share your submission link to start receiving candidates.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ShareLink
            title="Submission link"
            description="Share this link with candidates to collect submissions."
            url={shareUrl}
            href={shareHref}
          />
        </EmptyContent>
      </Empty>
    )
  }

  const isAllRoles = selectedRoleId === "all"
  const filtered = isAllRoles
    ? submissions
    : submissions.filter((s) => s.roleId === selectedRoleId)
  const filteredEmails = isAllRoles
    ? recentEmails
    : recentEmails.filter((e) => e.roleId === selectedRoleId)
  const filteredActivity = isAllRoles
    ? recentActivity
    : recentActivity.filter((a) => a.roleId === selectedRoleId)

  return (
    <div className="flex flex-col gap-block">
      {roles.length > 1 && (
        <div className="flex flex-wrap items-center gap-element">
          <Button
            size="xs"
            variant={selectedRoleId === "all" ? "default" : "outline"}
            onClick={() => setSelectedRoleId("all")}
          >
            All
          </Button>
          {roles.map((role) => (
            <Button
              key={role.id}
              size="xs"
              variant={selectedRoleId === role.id ? "default" : "outline"}
              onClick={() => setSelectedRoleId(role.id)}
            >
              {role.name}
            </Button>
          ))}
        </div>
      )}

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardFunnelChart
            submissions={filtered}
            pipelineStages={pipelineStages}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-block md:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Inbound submissions (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardInboundChart
              submissions={filtered}
              productionStatus={productionStatus}
            />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Reject reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardRejectReasonsChart
              submissions={filtered}
              pipelineStages={pipelineStages}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-block md:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Recent inbound emails</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardRecentEmails emails={filteredEmails} />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardRecentActivity activity={filteredActivity} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
