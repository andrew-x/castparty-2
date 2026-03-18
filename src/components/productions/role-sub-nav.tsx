"use client"

import {
  ClipboardListIcon,
  MessageSquareTextIcon,
  SettingsIcon,
  UsersIcon,
  WorkflowIcon,
  XCircleIcon,
} from "lucide-react"
import { SubNav } from "@/components/common/sub-nav"

export function RoleSubNav({
  productionId,
  roleId,
}: {
  productionId: string
  roleId: string
}) {
  const basePath = `/productions/${productionId}/roles/${roleId}`

  return (
    <SubNav
      items={[
        { label: "Submissions", href: basePath, icon: UsersIcon },
        { label: "General", href: `${basePath}/settings`, icon: SettingsIcon },
        {
          label: "Pipeline",
          href: `${basePath}/settings/pipeline`,
          icon: WorkflowIcon,
        },
        {
          label: "Submission form",
          href: `${basePath}/settings/submission-form`,
          icon: ClipboardListIcon,
        },
        {
          label: "Feedback form",
          href: `${basePath}/settings/feedback-form`,
          icon: MessageSquareTextIcon,
        },
        {
          label: "Reject reasons",
          href: `${basePath}/settings/reject-reasons`,
          icon: XCircleIcon,
        },
      ]}
    />
  )
}
