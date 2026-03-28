// Development-only in-memory store for previewing emails without sending them.
// Stored on globalThis so the array survives HMR reloads.

import day from "@/lib/dayjs"
import { generateId, IS_DEV } from "@/lib/util"

export interface StoredEmail {
  id: string
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  sentAt: Date
}

const MAX_EMAILS = 200

const globalStore = globalThis as unknown as { __devEmails?: StoredEmail[] }

function getStore(): StoredEmail[] {
  if (!IS_DEV) return []
  if (!globalStore.__devEmails) {
    globalStore.__devEmails = []
  }
  return globalStore.__devEmails
}

export function addEmail(email: Omit<StoredEmail, "id" | "sentAt">): void {
  if (!IS_DEV) return
  const store = getStore()
  store.unshift({
    ...email,
    id: generateId("email"),
    sentAt: day().toDate(),
  })
  if (store.length > MAX_EMAILS) {
    store.length = MAX_EMAILS
  }
}

export function getEmails(): StoredEmail[] {
  if (!IS_DEV) return []
  return getStore()
}

export function getEmailById(id: string): StoredEmail | undefined {
  if (!IS_DEV) return undefined
  return getStore().find((e) => e.id === id)
}
