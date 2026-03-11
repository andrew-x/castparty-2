"use client"

import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import day from "@/lib/dayjs"
import type { StoredEmail } from "@/lib/email-dev-store"

interface Props {
  email: StoredEmail
}

export function AdminEmailDetailClient({ email }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function resize() {
      const el = iframeRef.current
      if (!el) return
      const doc = el.contentDocument
      if (doc?.body) {
        el.style.height = `${doc.body.scrollHeight}px`
      }
    }

    iframe.addEventListener("load", resize)
    return () => iframe.removeEventListener("load", resize)
  }, [])

  return (
    <div className="flex flex-col gap-section">
      <Link
        href="/admin/emails"
        className="flex items-center gap-element text-label text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to emails
      </Link>

      <div className="flex flex-col gap-block">
        <h2 className="font-serif text-foreground text-heading">
          {email.subject}
        </h2>
        <div className="flex gap-group text-label text-muted-foreground">
          <span>To: {email.to}</span>
          <span>{day(email.sentAt).format("MMM D, YYYY [at] h:mm A")}</span>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        srcDoc={email.html}
        sandbox="allow-same-origin allow-popups allow-top-navigation-by-user-activation"
        title="Email preview"
        className="w-full rounded-lg border"
      />
    </div>
  )
}
