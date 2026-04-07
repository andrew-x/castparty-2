"use client"

import { ArrowDownLeftIcon } from "lucide-react"
import type { DashboardEmail } from "@/actions/productions/get-production-dashboard"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/common/empty"
import day from "@/lib/dayjs"

interface Props {
  emails: DashboardEmail[]
}

export function DashboardRecentEmails({ emails }: Props) {
  if (emails.length === 0) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyTitle>No inbound emails yet</EmptyTitle>
          <EmptyDescription>
            Emails received from candidates will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
      {emails.map((email) => (
        <div key={email.id} className="flex items-start gap-block py-block">
          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
            <ArrowDownLeftIcon className="size-3.5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-tight">
            <span className="truncate font-medium text-caption">
              {email.subject}
            </span>
            <span className="text-caption text-muted-foreground">
              {email.candidateName}
            </span>
          </div>
          <span className="shrink-0 text-caption text-muted-foreground">
            {day(email.sentAt).fromNow()}
          </span>
        </div>
      ))}
    </div>
  )
}
