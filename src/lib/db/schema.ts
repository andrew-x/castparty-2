import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type {
  CustomForm,
  CustomFormResponse,
  EmailTemplates,
  Representation,
  SystemFieldConfig,
} from "@/lib/types"

// --- BETTER AUTH ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
)

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
)

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
)

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  profile: one(UserProfile, {
    fields: [user.id],
    references: [UserProfile.id],
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    members: many(member),
    invitations: many(invitation),
    productions: many(Production),
    candidates: many(Candidate),
    pipelineStages: many(PipelineStage),
    pipelineUpdates: many(PipelineUpdate),
    emails: many(Email),
    profile: one(OrganizationProfile, {
      fields: [organization.id],
      references: [OrganizationProfile.id],
    }),
  }),
)

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}))

// --- BETTER AUTH ALIASES ---
export const User = user
export const Session = session
export const Account = account
export const Verification = verification
export const Organization = organization
export const Member = member
export const Invitation = invitation

// --- DATA ---
export const UserProfile = pgTable("user_profile", {
  id: text()
    .primaryKey()
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const OrganizationProfile = pgTable("organization_profile", {
  id: text()
    .primaryKey()
    .notNull()
    .references(() => Organization.id, { onDelete: "cascade" }),

  websiteUrl: text().notNull().default(""),
  description: text().notNull().default(""),
  isOrganizationProfileOpen: boolean().default(false).notNull(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const productionStatusEnum = pgEnum("production_status", [
  "open",
  "closed",
  "archive",
])

export const Production = pgTable(
  "production",
  {
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => Organization.id, { onDelete: "cascade" }),

    name: text().notNull(),
    slug: text().notNull(),
    description: text().notNull().default(""),
    status: productionStatusEnum().default("closed").notNull(),

    location: text().notNull().default(""),
    banner: text(),
    submissionFormFields: jsonb().$type<CustomForm[]>().notNull().default([]),
    systemFieldConfig: jsonb().$type<SystemFieldConfig>().notNull().default({
      phone: "optional",
      location: "optional",
      headshots: "optional",
      resume: "optional",
      links: "optional",
      unionStatus: "hidden",
      representation: "hidden",
    }),
    feedbackFormFields: jsonb().$type<CustomForm[]>().notNull().default([]),
    rejectReasons: jsonb().$type<string[]>().notNull().default([]),
    emailTemplates: jsonb().$type<EmailTemplates>(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("production_org_slug_uidx").on(
      table.organizationId,
      table.slug,
    ),
  ],
)

export const Role = pgTable(
  "role",
  {
    id: text().primaryKey(),
    productionId: text()
      .notNull()
      .references(() => Production.id, { onDelete: "cascade" }),

    name: text().notNull(),
    slug: text().notNull(),
    description: text().notNull().default(""),
    referencePhotos: jsonb().$type<string[]>().notNull().default([]),
    status: productionStatusEnum().default("closed").notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("role_production_slug_uidx").on(table.productionId, table.slug),
  ],
)

export const pipelineStageTypeEnum = pgEnum("pipeline_stage_type", [
  "APPLIED",
  "SELECTED",
  "REJECTED",
  "CUSTOM",
])

export const PipelineStage = pgTable("pipeline_stage", {
  id: text().primaryKey(),
  organizationId: text()
    .notNull()
    .references(() => Organization.id, { onDelete: "cascade" }),
  productionId: text()
    .notNull()
    .references(() => Production.id, { onDelete: "cascade" }),

  name: text().notNull(),
  order: integer().notNull(),
  type: pipelineStageTypeEnum().notNull().default("CUSTOM"),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const PipelineUpdate = pgTable("pipeline_update", {
  id: text().primaryKey(),
  organizationId: text()
    .notNull()
    .references(() => Organization.id, { onDelete: "cascade" }),
  productionId: text()
    .notNull()
    .references(() => Production.id, { onDelete: "cascade" }),
  roleId: text()
    .notNull()
    .references(() => Role.id, { onDelete: "cascade" }),

  fromStage: text().references(() => PipelineStage.id, {
    onDelete: "cascade",
  }),
  toStage: text().references(() => PipelineStage.id, { onDelete: "cascade" }),
  submissionId: text()
    .notNull()
    .references(() => Submission.id, { onDelete: "cascade" }),
  changeByUserId: text().references(() => User.id, { onDelete: "set null" }),

  createdAt: timestamp().defaultNow().notNull(),
})

export const Candidate = pgTable(
  "candidate",
  {
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => Organization.id, { onDelete: "cascade" }),

    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull(),
    phone: text().notNull().default(""),
    location: text().notNull().default(""),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("candidate_org_email_uidx").on(
      table.organizationId,
      table.email,
    ),
  ],
)

export const Submission = pgTable("submission", {
  id: text().primaryKey(),
  productionId: text()
    .notNull()
    .references(() => Production.id, { onDelete: "cascade" }),
  roleId: text()
    .notNull()
    .references(() => Role.id, { onDelete: "cascade" }),
  candidateId: text()
    .notNull()
    .references(() => Candidate.id, { onDelete: "cascade" }),
  stageId: text()
    .notNull()
    .references(() => PipelineStage.id, { onDelete: "restrict" }),
  rejectionReason: text(),

  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text().notNull(),
  phone: text().notNull().default(""),
  location: text().notNull().default(""),

  answers: jsonb().$type<CustomFormResponse[]>().notNull().default([]),
  links: text().array().notNull().default([]),
  unionStatus: text().array().notNull().default([]),
  representation: jsonb().$type<Representation | null>().default(null),
  resumeText: text(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const feedbackRatingEnum = pgEnum("feedback_rating", [
  "STRONG_NO",
  "NO",
  "YES",
  "STRONG_YES",
])

export const fileTypeEnum = pgEnum("file_type", [
  "HEADSHOT",
  "RESUME",
  "VIDEO",
  "CUSTOM_FIELD",
])

export const File = pgTable(
  "file",
  {
    id: text().primaryKey(),
    submissionId: text().references(() => Submission.id, {
      onDelete: "cascade",
    }),
    candidateId: text().references(() => Candidate.id, {
      onDelete: "cascade",
    }),
    formFieldId: text(),

    type: fileTypeEnum().notNull(),
    url: text().notNull(),
    key: text().notNull(),
    path: text().notNull(),
    filename: text().notNull(),
    contentType: text().notNull(),
    size: integer().notNull(),
    order: integer().notNull().default(0),

    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("file_submissionId_idx").on(table.submissionId),
    index("file_candidateId_idx").on(table.candidateId),
    index("file_formFieldId_idx").on(table.formFieldId),
  ],
)

export const Feedback = pgTable(
  "feedback",
  {
    id: text().primaryKey(),
    submissionId: text()
      .notNull()
      .references(() => Submission.id, { onDelete: "cascade" }),
    submittedByUserId: text()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    stageId: text()
      .notNull()
      .references(() => PipelineStage.id, { onDelete: "restrict" }),

    formFields: jsonb().$type<CustomForm[]>().notNull().default([]),
    answers: jsonb().$type<CustomFormResponse[]>().notNull().default([]),
    rating: feedbackRatingEnum().notNull(),
    notes: text().notNull().default(""),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("feedback_submissionId_idx").on(table.submissionId),
    index("feedback_submittedByUserId_idx").on(table.submittedByUserId),
  ],
)

export const Email = pgTable(
  "email",
  {
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => Organization.id, { onDelete: "cascade" }),
    submissionId: text().references(() => Submission.id, {
      onDelete: "cascade",
    }),
    sentByUserId: text().references(() => User.id, { onDelete: "set null" }),

    direction: text()
      .$type<"inbound" | "outbound">()
      .notNull()
      .default("outbound"),
    fromEmail: text(),
    toEmail: text().notNull(),
    subject: text().notNull(),
    bodyText: text().notNull(),
    bodyHtml: text().notNull(),
    templateType: text(),
    resendEmailId: text(),

    sentAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("email_submissionId_idx").on(table.submissionId),
    index("email_organizationId_idx").on(table.organizationId),
    uniqueIndex("email_resendEmailId_idx").on(table.resendEmailId),
  ],
)

export const Comment = pgTable(
  "comment",
  {
    id: text().primaryKey(),
    submissionId: text()
      .notNull()
      .references(() => Submission.id, { onDelete: "cascade" }),
    submittedByUserId: text()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),

    content: text().notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("comment_submissionId_idx").on(table.submissionId),
    index("comment_submittedByUserId_idx").on(table.submittedByUserId),
  ],
)

// --- DATA RELATIONS ---
export const userProfileRelations = relations(UserProfile, ({ one }) => ({
  user: one(User, {
    fields: [UserProfile.id],
    references: [User.id],
  }),
}))

export const organizationProfileRelations = relations(
  OrganizationProfile,
  ({ one }) => ({
    organization: one(Organization, {
      fields: [OrganizationProfile.id],
      references: [Organization.id],
    }),
  }),
)

export const productionRelations = relations(Production, ({ one, many }) => ({
  organization: one(Organization, {
    fields: [Production.organizationId],
    references: [Organization.id],
  }),
  roles: many(Role),
  pipelineStages: many(PipelineStage),
  pipelineUpdates: many(PipelineUpdate),
  submissions: many(Submission),
}))

export const roleRelations = relations(Role, ({ one, many }) => ({
  production: one(Production, {
    fields: [Role.productionId],
    references: [Production.id],
  }),
  submissions: many(Submission),
  pipelineUpdates: many(PipelineUpdate),
}))

export const candidateRelations = relations(Candidate, ({ one, many }) => ({
  organization: one(Organization, {
    fields: [Candidate.organizationId],
    references: [Organization.id],
  }),
  submissions: many(Submission),
  files: many(File),
}))

export const submissionRelations = relations(Submission, ({ one, many }) => ({
  production: one(Production, {
    fields: [Submission.productionId],
    references: [Production.id],
  }),
  role: one(Role, {
    fields: [Submission.roleId],
    references: [Role.id],
  }),
  candidate: one(Candidate, {
    fields: [Submission.candidateId],
    references: [Candidate.id],
  }),
  stage: one(PipelineStage, {
    fields: [Submission.stageId],
    references: [PipelineStage.id],
  }),
  pipelineUpdates: many(PipelineUpdate),
  files: many(File),
  feedback: many(Feedback),
  comments: many(Comment),
  emails: many(Email),
}))

export const fileRelations = relations(File, ({ one }) => ({
  submission: one(Submission, {
    fields: [File.submissionId],
    references: [Submission.id],
  }),
  candidate: one(Candidate, {
    fields: [File.candidateId],
    references: [Candidate.id],
  }),
}))

export const pipelineStageRelations = relations(
  PipelineStage,
  ({ one, many }) => ({
    organization: one(Organization, {
      fields: [PipelineStage.organizationId],
      references: [Organization.id],
    }),
    production: one(Production, {
      fields: [PipelineStage.productionId],
      references: [Production.id],
    }),
    submissions: many(Submission),
    pipelineUpdatesFrom: many(PipelineUpdate, { relationName: "fromStage" }),
    pipelineUpdatesTo: many(PipelineUpdate, { relationName: "toStage" }),
    feedback: many(Feedback),
  }),
)

export const pipelineUpdateRelations = relations(PipelineUpdate, ({ one }) => ({
  organization: one(Organization, {
    fields: [PipelineUpdate.organizationId],
    references: [Organization.id],
  }),
  production: one(Production, {
    fields: [PipelineUpdate.productionId],
    references: [Production.id],
  }),
  role: one(Role, {
    fields: [PipelineUpdate.roleId],
    references: [Role.id],
  }),
  submission: one(Submission, {
    fields: [PipelineUpdate.submissionId],
    references: [Submission.id],
  }),
  fromStage: one(PipelineStage, {
    fields: [PipelineUpdate.fromStage],
    references: [PipelineStage.id],
    relationName: "fromStage",
  }),
  toStage: one(PipelineStage, {
    fields: [PipelineUpdate.toStage],
    references: [PipelineStage.id],
    relationName: "toStage",
  }),
  changedBy: one(user, {
    fields: [PipelineUpdate.changeByUserId],
    references: [user.id],
  }),
}))

export const feedbackRelations = relations(Feedback, ({ one }) => ({
  submission: one(Submission, {
    fields: [Feedback.submissionId],
    references: [Submission.id],
  }),
  submittedBy: one(User, {
    fields: [Feedback.submittedByUserId],
    references: [User.id],
  }),
  stage: one(PipelineStage, {
    fields: [Feedback.stageId],
    references: [PipelineStage.id],
  }),
}))

export const commentRelations = relations(Comment, ({ one }) => ({
  submission: one(Submission, {
    fields: [Comment.submissionId],
    references: [Submission.id],
  }),
  submittedBy: one(User, {
    fields: [Comment.submittedByUserId],
    references: [User.id],
  }),
}))

export const emailRelations = relations(Email, ({ one }) => ({
  organization: one(Organization, {
    fields: [Email.organizationId],
    references: [Organization.id],
  }),
  submission: one(Submission, {
    fields: [Email.submissionId],
    references: [Submission.id],
  }),
  sentBy: one(User, {
    fields: [Email.sentByUserId],
    references: [User.id],
  }),
}))
