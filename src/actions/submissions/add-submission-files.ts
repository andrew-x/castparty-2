"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { extractText, getDocumentProxy } from "unpdf"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { File, Submission } from "@/lib/db/schema"
import logger from "@/lib/logger"
import { checkFileExists, moveFileByKey, r2Root } from "@/lib/r2"
import { addSubmissionFilesSchema } from "@/lib/schemas/submission"
import { generateId } from "@/lib/util"

export const addSubmissionFiles = secureActionClient
  .metadata({ action: "add-submission-files" })
  .inputSchema(addSubmissionFilesSchema)
  .action(
    async ({
      parsedInput: { submissionId, headshots, resume },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

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

      if (!submission || submission.role.production.organizationId !== orgId) {
        throw new Error("Submission not found.")
      }

      // Add headshots
      if (headshots.length > 0) {
        const tempPrefix = `${r2Root}/temp/headshots/`
        for (const headshot of headshots) {
          if (!headshot.key.startsWith(tempPrefix)) {
            throw new Error("Invalid file key.")
          }
        }

        // Count existing headshots to determine order offset and validate limit
        const existingHeadshots = await db.query.File.findMany({
          where: (f) =>
            and(eq(f.submissionId, submissionId), eq(f.type, "HEADSHOT")),
          columns: { order: true },
        })

        if (existingHeadshots.length + headshots.length > 10) {
          throw new Error("A submission can have at most 10 headshots.")
        }

        const maxOrder = existingHeadshots.reduce(
          (max, f) => Math.max(max, f.order ?? 0),
          -1,
        )

        for (const headshot of headshots) {
          const exists = await checkFileExists(headshot.key)
          if (!exists)
            throw new Error("Headshot upload not found. Try uploading again.")
        }

        const fileRecords = await Promise.all(
          headshots.map(async (headshot, index) => {
            const moved = await moveFileByKey(headshot.key, "headshots")
            return {
              id: generateId("file"),
              submissionId,
              type: "HEADSHOT" as const,
              url: moved.url,
              key: moved.key,
              path: moved.path,
              filename: headshot.filename,
              contentType: headshot.contentType,
              size: headshot.size,
              order: maxOrder + 1 + index,
            }
          }),
        )

        await db.insert(File).values(fileRecords)
      }

      // Add resume (only if none exists)
      if (resume) {
        const existingResume = await db.query.File.findFirst({
          where: (f) =>
            and(eq(f.submissionId, submissionId), eq(f.type, "RESUME")),
          columns: { id: true },
        })

        if (existingResume) {
          throw new Error("This submission already has a resume.")
        }

        const tempPrefix = `${r2Root}/temp/resumes/`
        if (!resume.key.startsWith(tempPrefix)) {
          throw new Error("Invalid file key.")
        }

        const resumeExists = await checkFileExists(resume.key)
        if (!resumeExists)
          throw new Error("Resume upload not found. Try uploading again.")

        const moved = await moveFileByKey(resume.key, "resumes")

        await db.insert(File).values({
          id: generateId("file"),
          submissionId,
          type: "RESUME",
          url: moved.url,
          key: moved.key,
          path: moved.path,
          filename: resume.filename,
          contentType: resume.contentType,
          size: resume.size,
          order: 0,
        })

        // Parse PDF text
        try {
          const response = await fetch(moved.url)
          const buffer = await response.arrayBuffer()
          const pdf = await getDocumentProxy(new Uint8Array(buffer))
          const { text } = await extractText(pdf, { mergePages: true })
          if (text.trim()) {
            await db
              .update(Submission)
              .set({ resumeText: text.trim() })
              .where(eq(Submission.id, submissionId))
          }
        } catch (err) {
          logger.error("PDF parsing failed", err)
        }
      }

      revalidatePath("/", "layout")
      return { id: submissionId }
    },
  )
