import { GlobeIcon, UserIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import { getPublicOrg } from "@/actions/submissions/get-public-org"
import { getPublicOrgProfile } from "@/actions/submissions/get-public-org-profile"
import { getPublicProduction } from "@/actions/submissions/get-public-production"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/common/accordion"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { Separator } from "@/components/common/separator"
import { CollapsibleDescription } from "@/components/submissions/collapsible-description"
import { FloatingApplyButton } from "@/components/submissions/floating-apply-button"
import { NotFoundEntity } from "@/components/submissions/not-found-entity"
import { SubmissionForm } from "@/components/submissions/submission-form"
import { sanitizeDescription } from "@/lib/sanitize"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; productionSlug: string }>
}): Promise<Metadata> {
  const { orgSlug, productionSlug } = await params
  const org = await getPublicOrg(orgSlug)
  if (!org) return { title: "Auditions — Castparty" }
  const production = await getPublicProduction(org.id, productionSlug)
  return {
    title: production
      ? `${production.name} — Auditions`
      : "Auditions — Castparty",
  }
}

export default async function SubmitProductionPage({
  params,
}: {
  params: Promise<{ orgSlug: string; productionSlug: string }>
}) {
  const { orgSlug, productionSlug } = await params

  const org = await getPublicOrg(orgSlug)
  if (!org) return <NotFoundEntity entity="organization" />

  const [production, orgProfile] = await Promise.all([
    getPublicProduction(org.id, productionSlug),
    getPublicOrgProfile(org.id),
  ])
  if (!production) return <NotFoundEntity entity="production" />
  if (production.status !== "open")
    return <NotFoundEntity entity="production" />

  const hasRoles = production.roles.length > 0
  const hasOrgInfo = orgProfile.description || orgProfile.websiteUrl

  const expandableRoles = production.roles.filter((role) => {
    const photos = (role.referencePhotos as string[] | null) ?? []
    return role.description || photos.length > 0
  })

  const staticRoles = production.roles.filter((role) => {
    const photos = (role.referencePhotos as string[] | null) ?? []
    return !role.description && photos.length === 0
  })

  return (
    <div className="mx-auto flex w-full max-w-page-wide flex-col gap-section">
      {/* Full-width banner */}
      {production.banner && (
        <div className="overflow-hidden rounded-lg">
          <Image
            src={production.banner}
            alt={`${production.name} banner`}
            width={1200}
            height={675}
            className="aspect-video w-full object-cover"
            priority
          />
        </div>
      )}

      {hasRoles ? (
        <>
          {/* Two-column layout */}
          <div className="grid gap-section md:grid-cols-[1fr_minmax(340px,0.75fr)]">
            {/* Left column — production context */}
            <div className="flex flex-col gap-section">
              {/* Production header */}
              <div>
                <h1 className="font-serif text-title">{production.name}</h1>
                <div className="mt-1 flex items-center gap-1.5">
                  {org.logo && (
                    <Image
                      src={org.logo}
                      alt={`${org.name} logo`}
                      width={20}
                      height={20}
                      className="size-5 rounded object-cover"
                    />
                  )}
                  <span className="text-caption text-muted-foreground">
                    by {org.name}
                  </span>
                </div>
              </div>

              {/* Collapsible description */}
              {production.description && (
                <CollapsibleDescription
                  html={sanitizeDescription(production.description)}
                />
              )}

              {/* Roles */}
              <div className="flex flex-col gap-block">
                <h2 className="font-semibold text-caption text-muted-foreground uppercase tracking-wide">
                  Roles
                </h2>

                {/* Expandable roles in accordion */}
                {expandableRoles.length > 0 && (
                  <Accordion type="multiple">
                    {expandableRoles.map((role) => {
                      const photos =
                        (role.referencePhotos as string[] | null) ?? []
                      return (
                        <AccordionItem key={role.id} value={role.id}>
                          <AccordionTrigger>{role.name}</AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col gap-block">
                              {role.description && (
                                <div
                                  className="prose-description text-muted-foreground"
                                  // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitize-html allowlist
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizeDescription(
                                      role.description,
                                    ),
                                  }}
                                />
                              )}
                              {photos.length > 0 && (
                                <div className="flex gap-element">
                                  {photos.map((photo) => (
                                    <Image
                                      key={photo}
                                      src={photo}
                                      alt={`${role.name} reference`}
                                      width={120}
                                      height={120}
                                      className="size-24 rounded-lg object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                )}

                {/* Static roles (no description or photos) */}
                {staticRoles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-lg border px-4 py-3 font-medium text-label"
                  >
                    {role.name}
                  </div>
                ))}
              </div>

              {/* Organization info */}
              {hasOrgInfo && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-block">
                    <div className="flex items-center gap-2">
                      {org.logo && (
                        <Image
                          src={org.logo}
                          alt={`${org.name} logo`}
                          width={32}
                          height={32}
                          className="size-8 rounded-lg object-cover"
                        />
                      )}
                      <h2 className="font-medium text-body">{org.name}</h2>
                    </div>
                    {orgProfile.description && (
                      <div
                        className="prose-description text-muted-foreground"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitize-html allowlist
                        dangerouslySetInnerHTML={{
                          __html: sanitizeDescription(orgProfile.description),
                        }}
                      />
                    )}
                    {orgProfile.websiteUrl && (
                      <a
                        href={orgProfile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-label text-muted-foreground hover:text-foreground"
                      >
                        <GlobeIcon className="size-3.5" />
                        {orgProfile.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right column — sticky form */}
            <div className="md:sticky md:top-page md:self-start">
              <div id="submission-form">
                <SubmissionForm
                  orgId={org.id}
                  productionId={production.id}
                  availableRoles={production.roles}
                  submissionFormFields={production.submissionFormFields}
                  systemFieldConfig={production.systemFieldConfig}
                />
              </div>
            </div>
          </div>

          {/* Mobile floating CTA */}
          <FloatingApplyButton targetId="submission-form" />
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserIcon />
            </EmptyMedia>
            <EmptyTitle>No roles listed</EmptyTitle>
            <EmptyDescription>
              This production has no roles open for submission.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
