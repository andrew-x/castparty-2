"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Comment } from "@/lib/db/schema"
import { createCommentActionSchema } from "@/lib/schemas/comment"
import { generateId } from "@/lib/util"

export const createComment = secureActionClient
  .metadata({ action: "create-comment" })
  .inputSchema(createCommentActionSchema)
  .action(async ({ parsedInput: { submissionId, content }, ctx: { user } }) => {
    const submission = await db.query.Submission.findFirst({
      where: (s) => eq(s.id, submissionId),
      columns: { id: true },
      with: {
        role: {
          columns: { id: true },
          with: {
            production: {
              columns: { organizationId: true },
            },
          },
        },
      },
    })

    if (!submission) {
      throw new Error("Submission not found.")
    }

    if (
      submission.role.production.organizationId !== user.activeOrganizationId
    ) {
      throw new Error("You don't have access to this submission.")
    }

    await db.insert(Comment).values({
      id: generateId("cmt"),
      submissionId,
      submittedByUserId: user.id,
      content,
    })

    revalidatePath("/", "layout")
    return { success: true }
  })
