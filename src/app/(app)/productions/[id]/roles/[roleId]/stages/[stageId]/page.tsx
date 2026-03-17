import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getRoleWithSubmissions } from "@/actions/productions/get-role-with-submissions"
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { StageSortSelect } from "@/components/productions/stage-sort-select"
import { StageSubmissionsGrid } from "@/components/productions/stage-submissions-grid"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roleId: string; stageId: string }>
}) {
  const { roleId, stageId } = await params
  const role = await getRoleWithSubmissions(roleId)
  const stage = role?.pipelineStages.find((s) => s.id === stageId)
  return {
    title:
      stage && role
        ? `${stage.name} — ${role.name} — Castparty`
        : "Stage — Castparty",
  }
}

export default async function StageBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; roleId: string; stageId: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { id, roleId, stageId } = await params
  const { sort } = await searchParams
  const role = await getRoleWithSubmissions(roleId)

  if (!role || role.production.id !== id) {
    notFound()
  }

  const stage = role.pipelineStages.find((s) => s.id === stageId)
  if (!stage) {
    notFound()
  }

  const stageSubmissions = role.submissions.filter((s) => s.stageId === stageId)
  const count = stageSubmissions.length

  return (
    <Page>
      <PageHeader
        title={
          <>
            {stage.name} Stage{" "}
            <span className="font-normal font-sans text-body text-muted-foreground">
              {count} candidate{count !== 1 ? "s" : ""}
            </span>
          </>
        }
        breadcrumbs={[
          { label: "Productions", href: "/productions" },
          { label: role.production.name, href: `/productions/${id}` },
          { label: role.name, href: `/productions/${id}/roles/${roleId}` },
          { label: stage.name },
        ]}
        actions={
          <Suspense>
            <StageSortSelect />
          </Suspense>
        }
      />
      <PageContent>
        <StageSubmissionsGrid
          submissions={stageSubmissions}
          sort={sort ?? "newest"}
          pipelineStages={role.pipelineStages}
          submissionFormFields={role.submissionFormFields}
          feedbackFormFields={role.feedbackFormFields}
          roleId={roleId}
        />
      </PageContent>
    </Page>
  )
}
