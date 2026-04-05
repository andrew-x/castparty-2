"use server"

import { and, count, eq, max, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { extractText, getDocumentProxy } from "unpdf"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { Candidate, File, Submission } from "@/lib/db/schema"
import logger from "@/lib/logger"
import { checkFileExists, moveFileByKey, r2Root } from "@/lib/r2"
import { updateSubmissionActionSchema } from "@/lib/schemas/submission"
import { generateId } from "@/lib/util"

export const updateSubmission = secureActionClient
  .metadata({ action: "update-submission" })
  .inputSchema(updateSubmissionActionSchema)
  .action(
    async ({
      parsedInput: {
        submissionId,
        firstName,
        lastName,
        email,
        phone,
        location,
        links,
        videoUrl,
        unionStatus,
        representation,
        newHeadshots,
        newResume,
      },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Load submission with ownership chain
      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true, candidateId: true },
        with: {
          candidate: { columns: { email: true } },
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

      // --- Pre-validation (before any side effects) ---

      // Check email conflict before moving files
      if (email !== submission.candidate.email) {
        const conflict = await db.query.Candidate.findFirst({
          where: (c) =>
            and(
              eq(c.organizationId, orgId),
              eq(c.email, email),
              ne(c.id, submission.candidateId),
            ),
          columns: { id: true },
        })
        if (conflict) {
          throw new Error(
            "This email belongs to a different candidate in your organization.",
          )
        }
      }

      // Validate headshot capacity
      let headshotStartOrder = 0
      if (newHeadshots.length > 0) {
        const [{ value: existingCount }] = await db
          .select({ value: count() })
          .from(File)
          .where(
            and(eq(File.submissionId, submissionId), eq(File.type, "HEADSHOT")),
          )

        if (existingCount + newHeadshots.length > 10) {
          throw new Error("Maximum 10 headshots allowed.")
        }

        const tempPrefix = `${r2Root}/temp/headshots/`
        for (const headshot of newHeadshots) {
          if (!headshot.key.startsWith(tempPrefix)) {
            throw new Error("Invalid file key.")
          }
        }

        for (const headshot of newHeadshots) {
          const exists = await checkFileExists(headshot.key)
          if (!exists)
            throw new Error("Headshot upload not found. Try uploading again.")
        }

        const [{ value: maxOrder }] = await db
          .select({ value: max(File.order) })
          .from(File)
          .where(
            and(eq(File.submissionId, submissionId), eq(File.type, "HEADSHOT")),
          )
        headshotStartOrder = (maxOrder ?? -1) + 1
      }

      // Validate resume
      if (newResume) {
        const existingResume = await db.query.File.findFirst({
          where: (f) =>
            and(eq(f.submissionId, submissionId), eq(f.type, "RESUME")),
          columns: { id: true },
        })

        if (existingResume) {
          throw new Error("A resume already exists for this submission.")
        }

        const tempPrefix = `${r2Root}/temp/resumes/`
        if (!newResume.key.startsWith(tempPrefix)) {
          throw new Error("Invalid file key.")
        }

        const resumeExists = await checkFileExists(newResume.key)
        if (!resumeExists)
          throw new Error("Resume upload not found. Try uploading again.")
      }

      // --- Side effects: move files then persist everything atomically ---

      // Move headshot files from temp to permanent storage
      let headshotFileRecords: {
        id: string
        submissionId: string
        type: "HEADSHOT"
        url: string
        key: string
        path: string
        filename: string
        contentType: string
        size: number
        order: number
      }[] = []

      if (newHeadshots.length > 0) {
        headshotFileRecords = await Promise.all(
          newHeadshots.map(async (headshot, index) => {
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
              order: headshotStartOrder + index,
            }
          }),
        )
      }

      // Move resume file from temp to permanent storage
      let resumeFileRecord: {
        id: string
        submissionId: string
        type: "RESUME"
        url: string
        key: string
        path: string
        filename: string
        contentType: string
        size: number
        order: number
      } | null = null

      if (newResume) {
        const moved = await moveFileByKey(newResume.key, "resumes")
        resumeFileRecord = {
          id: generateId("file"),
          submissionId,
          type: "RESUME" as const,
          url: moved.url,
          key: moved.key,
          path: moved.path,
          filename: newResume.filename,
          contentType: newResume.contentType,
          size: newResume.size,
          order: 0,
        }
      }

      // Persist all DB changes in a single transaction
      await db.transaction(async (tx) => {
        // Insert new file records
        if (headshotFileRecords.length > 0) {
          await tx.insert(File).values(headshotFileRecords)
        }

        if (resumeFileRecord) {
          await tx.insert(File).values(resumeFileRecord)
        }

        // Update this submission's fields
        await tx
          .update(Submission)
          .set({
            links,
            videoUrl: videoUrl || null,
            unionStatus,
            representation,
            updatedAt: day().toDate(),
          })
          .where(eq(Submission.id, submissionId))

        // Update candidate info
        await tx
          .update(Candidate)
          .set({
            firstName,
            lastName,
            email,
            phone: phone ?? "",
            location: location ?? "",
            updatedAt: day().toDate(),
          })
          .where(eq(Candidate.id, submission.candidateId))
      })

      // Parse PDF text from the uploaded resume (best-effort, after transaction)
      if (resumeFileRecord) {
        try {
          const response = await fetch(resumeFileRecord.url)
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
