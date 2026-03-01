import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

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
  updatedAt: timestamp().defaultNow().notNull(),
})

export const OrganizationProfile = pgTable("organization_profile", {
  id: text()
    .primaryKey()
    .notNull()
    .references(() => Organization.id, { onDelete: "cascade" }),

  websiteUrl: text(),
  description: text(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
})

export const Production = pgTable("production", {
  id: text().primaryKey(),
  organizationId: text()
    .notNull()
    .references(() => Organization.id, { onDelete: "cascade" }),

  name: text().notNull(),
  description: text(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
})

export const Role = pgTable("role", {
  id: text().primaryKey(),
  productionId: text()
    .notNull()
    .references(() => Production.id, { onDelete: "cascade" }),

  name: text().notNull(),
  description: text(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
})

export const Candidate = pgTable("candidate", {
  id: text().primaryKey(),
  organizationId: text()
    .notNull()
    .references(() => Organization.id, { onDelete: "cascade" }),

  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text().notNull(),
  phone: text(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
})

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

  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text().notNull(),
  phone: text(),
  resumeUrl: text(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
})

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
  submissions: many(Submission),
}))

export const roleRelations = relations(Role, ({ one, many }) => ({
  production: one(Production, {
    fields: [Role.productionId],
    references: [Production.id],
  }),
  submissions: many(Submission),
}))

export const candidateRelations = relations(Candidate, ({ one, many }) => ({
  organization: one(Organization, {
    fields: [Candidate.organizationId],
    references: [Organization.id],
  }),
  submissions: many(Submission),
}))

export const submissionRelations = relations(Submission, ({ one }) => ({
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
}))
