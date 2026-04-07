import { MailIcon } from "lucide-react"
import Link from "next/link"
import type { RecentInboundEmail } from "@/actions/dashboard/get-recent-emails"
import day from "@/lib/dayjs"

interface Props {
  emails: RecentInboundEmail[]
}

export function EmailsWidget({ emails }: Props) {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border">
      <div className="border-b px-block py-element">
        <h2 className="font-medium text-label">Recent Inbound Emails</h2>
      </div>
      {emails.length === 0 ? (
        <p className="px-block py-section text-center text-caption text-muted-foreground">
          No inbound emails yet
        </p>
      ) : (
        <div className="flex max-h-128 min-h-48 flex-col overflow-y-auto">
          {emails.map((email) => {
            const inner = (
              <div className="flex items-start gap-element px-block py-element">
                <MailIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-tight">
                  <div className="flex items-baseline justify-between gap-element">
                    <span className="truncate font-medium text-foreground text-label">
                      {email.fromEmail ?? "Unknown sender"}
                    </span>
                    <span className="shrink-0 text-caption text-muted-foreground">
                      {day(email.sentAt).fromNow()}
                    </span>
                  </div>
                  <p className="truncate text-caption text-muted-foreground">
                    {email.subject}
                  </p>
                </div>
              </div>
            )

            if (email.submissionId && email.productionId) {
              return (
                <Link
                  key={email.id}
                  href={`/productions/${email.productionId}?submission=${email.submissionId}`}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/50"
                >
                  {inner}
                </Link>
              )
            }

            return (
              <div key={email.id} className="border-b last:border-b-0">
                {inner}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
