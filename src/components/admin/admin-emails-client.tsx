"use client"

import { MailIcon } from "lucide-react"
import Link from "next/link"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import day from "@/lib/dayjs"
import type { StoredEmail } from "@/lib/email-dev-store"

interface Props {
  emails: StoredEmail[]
}

export function AdminEmailsClient({ emails }: Props) {
  if (emails.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MailIcon />
          </EmptyMedia>
          <EmptyTitle>No emails yet</EmptyTitle>
          <EmptyDescription>
            Emails sent in development will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-section">
      <p className="text-label text-muted-foreground">
        {emails.length} {emails.length === 1 ? "email" : "emails"}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow key={email.id}>
              <TableCell>
                <Link
                  href={`/admin/emails/${email.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {email.subject}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {email.to}
              </TableCell>
              <TableCell className="text-caption text-muted-foreground">
                {day(email.sentAt).fromNow()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
