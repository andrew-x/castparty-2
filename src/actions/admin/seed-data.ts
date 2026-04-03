"use server"

import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { adminActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import db from "@/lib/db/db"
import {
  Candidate,
  Comment,
  Feedback,
  File,
  member,
  OrganizationProfile,
  organization,
  PipelineStage,
  PipelineUpdate,
  Production,
  Role,
  Submission,
  user,
} from "@/lib/db/schema"
import { nameToSlug } from "@/lib/slug"
import type {
  CustomForm,
  CustomFormResponse,
  EmailTemplates,
  Representation,
  SystemFieldConfig,
} from "@/lib/types"
import { generateId } from "@/lib/util"

// --- Constants ---

const DEV_USER_EMAIL = "dev@test.com"
const DEV_USER_PASSWORD = "password"
const DEV_USER_NAME = "Dev User"

const PRODUCTION_CONFIGS = [
  { name: "A Midsummer Night's Dream", status: "open" as const },
  { name: "The Glass Menagerie", status: "open" as const },
  { name: "Our Town", status: "closed" as const },
  { name: "Little Shop of Horrors", status: "archive" as const },
]

const ROLE_NAMES_BY_PRODUCTION: Record<string, string[]> = {
  "A Midsummer Night's Dream": ["Titania", "Oberon", "Puck", "Hermia"],
  "The Glass Menagerie": ["Amanda", "Tom", "Laura"],
  "Our Town": ["Stage Manager", "Emily Webb", "George Gibbs"],
  "Little Shop of Horrors": ["Seymour", "Audrey", "Orin"],
}

const STAGE_TEMPLATES = [
  { name: "Applied", type: "APPLIED" as const, order: 0 },
  { name: "Callback", type: "CUSTOM" as const, order: 1 },
  { name: "Final Read", type: "CUSTOM" as const, order: 2 },
  { name: "Selected", type: "SELECTED" as const, order: 3 },
  { name: "Rejected", type: "REJECTED" as const, order: 4 },
]

const REJECT_REASONS = [
  "Not the right fit for this role",
  "Schedule conflict with rehearsal dates",
  "Role has been filled",
]

const SYSTEM_FIELD_CONFIGS: SystemFieldConfig[] = [
  {
    phone: "required",
    location: "required",
    headshots: "required",
    resume: "optional",
    video: "hidden",
    links: "optional",
    unionStatus: "hidden",
    representation: "hidden",
  },
  {
    phone: "optional",
    location: "optional",
    headshots: "optional",
    resume: "optional",
    video: "optional",
    links: "optional",
    unionStatus: "optional",
    representation: "optional",
  },
  {
    phone: "optional",
    location: "optional",
    headshots: "required",
    resume: "required",
    video: "hidden",
    links: "hidden",
    unionStatus: "hidden",
    representation: "hidden",
  },
  {
    phone: "hidden",
    location: "hidden",
    headshots: "optional",
    resume: "hidden",
    video: "hidden",
    links: "hidden",
    unionStatus: "hidden",
    representation: "hidden",
  },
]

const UNION_OPTIONS = [
  "AEA",
  "EMC",
  "SAG-AFTRA",
  "CAEA",
  "ACTRA",
  "AGMA",
  "UDA",
]

const FEEDBACK_RATINGS = ["STRONG_NO", "NO", "YES", "STRONG_YES"] as const

// --- Helpers ---

function makeSubmissionFormFields(): CustomForm[] {
  return [
    {
      id: generateId("ff"),
      type: "TEXT",
      label: "Special skills",
      description:
        "List any relevant skills (singing, dancing, instruments, etc.)",
      required: false,
      options: [],
    },
    {
      id: generateId("ff"),
      type: "SELECT",
      label: "Experience level",
      description: "How much theatre experience do you have?",
      required: true,
      options: ["Beginner", "Some experience", "Experienced", "Professional"],
    },
  ]
}

function makeFeedbackFormFields(): CustomForm[] {
  return [
    {
      id: generateId("fbf"),
      type: "TEXTAREA",
      label: "Notes",
      description: "General feedback on this audition",
      required: false,
      options: [],
    },
    {
      id: generateId("fbf"),
      type: "SELECT",
      label: "Vocal range",
      description: "Assessed vocal range",
      required: false,
      options: ["Soprano", "Alto", "Tenor", "Baritone", "Bass"],
    },
  ]
}

function makeEmailTemplates(): EmailTemplates {
  return {
    submissionReceived: {
      subject: "We received your submission",
      body: "Thank you for auditioning. We'll be in touch with next steps.",
    },
    rejected: {
      subject: "Update on your audition",
      body: "Thank you for auditioning. Unfortunately, we've decided to go in a different direction for this role.",
    },
    selected: {
      subject: "You've been cast!",
      body: "Congratulations! We'd like to offer you a role in our production. Please reply to confirm.",
    },
  }
}

function makeAnswers(formFields: CustomForm[]): CustomFormResponse[] {
  return formFields.map((field) => {
    switch (field.type) {
      case "TEXT":
        return {
          fieldId: field.id,
          textValue: faker.lorem.sentence(),
          booleanValue: null,
          optionValues: null,
          fileValues: null,
        }
      case "TEXTAREA":
        return {
          fieldId: field.id,
          textValue: faker.lorem.paragraph(),
          booleanValue: null,
          optionValues: null,
          fileValues: null,
        }
      case "SELECT":
        return {
          fieldId: field.id,
          textValue: null,
          booleanValue: null,
          optionValues: [faker.helpers.arrayElement(field.options)],
          fileValues: null,
        }
      default:
        return {
          fieldId: field.id,
          textValue: faker.lorem.word(),
          booleanValue: null,
          optionValues: null,
          fileValues: null,
        }
    }
  })
}

function pickStageIndex(): number {
  const roll = Math.random()
  if (roll < 0.5) return 0 // APPLIED
  if (roll < 0.75) return 1 // Callback
  if (roll < 0.9) return 2 // Final Read
  if (roll < 0.95) return 3 // SELECTED
  return 4 // REJECTED
}

function makeRepresentation(): Representation {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: "national" }),
  }
}

// --- Main Action ---

export const seedDataAction = adminActionClient
  .metadata({ action: "seed-data" })
  .action(async () => {
    // 1. Create dev user via Better Auth (outside transaction)
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: DEV_USER_NAME,
        email: DEV_USER_EMAIL,
        password: DEV_USER_PASSWORD,
      },
    })
    const userId = signUpResult.user.id

    // Mark email as verified and promote to admin
    await db
      .update(user)
      .set({ emailVerified: true, role: "admin" })
      .where(eq(user.id, userId))

    // 2. Build all data in memory, then bulk insert in a transaction
    const orgId = generateId("org")
    const orgName = `${faker.company.name()} Theatre Company`
    const orgSlug = nameToSlug(orgName)
    const now = new Date()

    // Collect rows per table
    const productionRows: (typeof Production.$inferInsert)[] = []
    const roleRows: (typeof Role.$inferInsert)[] = []
    const stageRows: (typeof PipelineStage.$inferInsert)[] = []
    const candidateRows: (typeof Candidate.$inferInsert)[] = []
    const submissionRows: (typeof Submission.$inferInsert)[] = []
    const pipelineUpdateRows: (typeof PipelineUpdate.$inferInsert)[] = []
    const feedbackRows: (typeof Feedback.$inferInsert)[] = []
    const commentRows: (typeof Comment.$inferInsert)[] = []
    const fileRows: (typeof File.$inferInsert)[] = []

    // --- Productions, Roles, Pipeline Stages ---
    const productionData: {
      id: string
      submissionFormFields: CustomForm[]
      feedbackFormFields: CustomForm[]
      roles: { id: string; name: string }[]
      stages: { id: string; type: string; order: number }[]
      rejectReasons: string[]
    }[] = []

    for (let i = 0; i < PRODUCTION_CONFIGS.length; i++) {
      const config = PRODUCTION_CONFIGS[i]
      const prodId = generateId("prod")
      const submissionFormFields = makeSubmissionFormFields()
      const feedbackFormFields = makeFeedbackFormFields()

      productionRows.push({
        id: prodId,
        organizationId: orgId,
        name: config.name,
        slug: nameToSlug(config.name),
        description: faker.lorem.paragraph(),
        status: config.status,
        location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
        submissionFormFields,
        systemFieldConfig: SYSTEM_FIELD_CONFIGS[i],
        feedbackFormFields,
        rejectReasons: REJECT_REASONS,
        emailTemplates: makeEmailTemplates(),
      })

      const roleNames = ROLE_NAMES_BY_PRODUCTION[config.name] ?? []
      const roles: { id: string; name: string }[] = []
      for (const roleName of roleNames) {
        const roleId = generateId("role")
        roleRows.push({
          id: roleId,
          productionId: prodId,
          name: roleName,
          slug: nameToSlug(roleName),
          description: faker.lorem.sentence(),
          status: config.status === "archive" ? "archive" : config.status,
        })
        roles.push({ id: roleId, name: roleName })
      }

      const stages: { id: string; type: string; order: number }[] = []
      for (const tmpl of STAGE_TEMPLATES) {
        const stageId = generateId("stg")
        stageRows.push({
          id: stageId,
          organizationId: orgId,
          productionId: prodId,
          name: tmpl.name,
          order: tmpl.order,
          type: tmpl.type,
        })
        stages.push({ id: stageId, type: tmpl.type, order: tmpl.order })
      }

      productionData.push({
        id: prodId,
        submissionFormFields,
        feedbackFormFields,
        roles,
        stages,
        rejectReasons: REJECT_REASONS,
      })
    }

    // --- Candidates ---
    const candidates: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
      location: string
    }[] = []

    for (let i = 0; i < 50; i++) {
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const candId = generateId("cand")
      const candEmail = faker.internet
        .email({ firstName, lastName })
        .toLowerCase()
      const phone = faker.phone.number({ style: "national" })
      const location = `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`

      candidateRows.push({
        id: candId,
        organizationId: orgId,
        firstName,
        lastName,
        email: candEmail,
        phone,
        location,
      })

      candidates.push({
        id: candId,
        firstName,
        lastName,
        email: candEmail,
        phone,
        location,
      })
    }

    // --- Submissions, Pipeline Updates, Feedback, Comments, Files ---
    for (const cand of candidates) {
      const numSubmissions = faker.number.int({ min: 1, max: 2 })
      const selectedProductions = faker.helpers.arrayElements(
        productionData,
        numSubmissions,
      )

      for (const prod of selectedProductions) {
        const role = faker.helpers.arrayElement(prod.roles)
        const stageIndex = pickStageIndex()
        const targetStage = prod.stages[stageIndex]
        const subId = generateId("sub")

        const unionStatus =
          Math.random() < 0.3
            ? faker.helpers.arrayElements(UNION_OPTIONS, { min: 1, max: 2 })
            : []

        const representation: Representation | null =
          Math.random() < 0.15 ? makeRepresentation() : null

        const rejectionReason =
          targetStage.type === "REJECTED"
            ? faker.helpers.arrayElement(prod.rejectReasons)
            : null

        submissionRows.push({
          id: subId,
          productionId: prod.id,
          roleId: role.id,
          candidateId: cand.id,
          stageId: targetStage.id,
          rejectionReason,
          firstName: cand.firstName,
          lastName: cand.lastName,
          email: cand.email,
          phone: cand.phone,
          location: cand.location,
          answers: makeAnswers(prod.submissionFormFields),
          links: Math.random() < 0.4 ? [faker.internet.url()] : [],
          unionStatus,
          representation,
        })

        // Pipeline updates: trace path from APPLIED to current stage
        if (stageIndex > 0) {
          const appliedStage = prod.stages[0]
          pipelineUpdateRows.push({
            id: generateId("pu"),
            organizationId: orgId,
            productionId: prod.id,
            roleId: role.id,
            submissionId: subId,
            fromStage: null,
            toStage: appliedStage.id,
            changeByUserId: userId,
          })

          for (let s = 1; s <= stageIndex; s++) {
            pipelineUpdateRows.push({
              id: generateId("pu"),
              organizationId: orgId,
              productionId: prod.id,
              roleId: role.id,
              submissionId: subId,
              fromStage: prod.stages[s - 1].id,
              toStage: prod.stages[s].id,
              changeByUserId: userId,
            })
          }
        }

        if (Math.random() < 0.3) {
          feedbackRows.push({
            id: generateId("fb"),
            submissionId: subId,
            submittedByUserId: userId,
            stageId: targetStage.id,
            formFields: prod.feedbackFormFields,
            answers: makeAnswers(prod.feedbackFormFields),
            rating: faker.helpers.arrayElement(FEEDBACK_RATINGS),
            notes: faker.lorem.sentence(),
          })
        }

        if (Math.random() < 0.2) {
          commentRows.push({
            id: generateId("cmt"),
            submissionId: subId,
            submittedByUserId: userId,
            content: faker.lorem.sentence(),
          })
        }

        const headshotSeed = faker.number.int({ min: 1, max: 1000 })
        fileRows.push({
          id: generateId("file"),
          submissionId: subId,
          candidateId: cand.id,
          type: "HEADSHOT",
          url: `https://picsum.photos/seed/${headshotSeed}/400/500`,
          key: `seed/headshots/${cand.id}.jpg`,
          path: `headshots/${cand.id}.jpg`,
          filename: `${cand.firstName.toLowerCase()}-${cand.lastName.toLowerCase()}-headshot.jpg`,
          contentType: "image/jpeg",
          size: faker.number.int({ min: 100000, max: 2000000 }),
          order: 0,
        })

        if (Math.random() < 0.6) {
          fileRows.push({
            id: generateId("file"),
            submissionId: subId,
            candidateId: cand.id,
            type: "RESUME",
            url: `https://example.com/seed/resumes/${cand.id}.pdf`,
            key: `seed/resumes/${cand.id}.pdf`,
            path: `resumes/${cand.id}.pdf`,
            filename: `${cand.firstName.toLowerCase()}-${cand.lastName.toLowerCase()}-resume.pdf`,
            contentType: "application/pdf",
            size: faker.number.int({ min: 50000, max: 500000 }),
            order: 0,
          })
        }
      }
    }

    // 3. Bulk insert in dependency order within a single transaction
    await db.transaction(async (tx) => {
      await tx
        .insert(organization)
        .values({ id: orgId, name: orgName, slug: orgSlug, createdAt: now })
      await tx.insert(OrganizationProfile).values({
        id: orgId,
        websiteUrl: faker.internet.url(),
        description: faker.lorem.paragraph(),
        isOrganizationProfileOpen: true,
      })
      await tx.insert(member).values({
        id: generateId("mem"),
        organizationId: orgId,
        userId,
        role: "owner",
        createdAt: now,
      })

      await tx.insert(Production).values(productionRows)
      await tx.insert(Role).values(roleRows)
      await tx.insert(PipelineStage).values(stageRows)
      await tx.insert(Candidate).values(candidateRows)
      await tx.insert(Submission).values(submissionRows)

      if (pipelineUpdateRows.length > 0)
        await tx.insert(PipelineUpdate).values(pipelineUpdateRows)
      if (feedbackRows.length > 0)
        await tx.insert(Feedback).values(feedbackRows)
      if (commentRows.length > 0) await tx.insert(Comment).values(commentRows)
      if (fileRows.length > 0) await tx.insert(File).values(fileRows)
    })

    revalidatePath("/", "layout")
    return { success: true }
  })
