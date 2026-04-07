"use client"

import {
  ClipboardListIcon,
  HomeIcon,
  ListIcon,
  MailIcon,
  MessageSquareTextIcon,
  SettingsIcon,
  UsersIcon,
  WorkflowIcon,
  XCircleIcon,
} from "lucide-react"
import { SubNav } from "@/components/common/sub-nav"

export function ProductionSubNav({ productionId }: { productionId: string }) {
  const basePath = `/productions/${productionId}`

  return (
    <SubNav
      items={[
        { label: "Home", href: basePath, icon: HomeIcon },
        {
          label: "Submissions",
          href: `${basePath}/submissions`,
          icon: UsersIcon,
        },
        {
          label: "Production Settings",
          href: `${basePath}/settings`,
          icon: SettingsIcon,
        },
        { label: "Role Settings", href: `${basePath}/roles`, icon: ListIcon },
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
        {
          label: "Email templates",
          href: `${basePath}/settings/emails`,
          icon: MailIcon,
        },
      ]}
    />
  )
}
