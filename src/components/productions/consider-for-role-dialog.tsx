"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { CheckIcon, LoaderCircleIcon, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { getOrgRolesGroupedByProduction } from "@/actions/productions/get-org-roles-grouped"
import { copySubmissionToRole } from "@/actions/submissions/copy-submission-to-role"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import { Field, FieldError, FieldGroup } from "@/components/common/field"
import { Input } from "@/components/common/input"
import { formResolver } from "@/lib/schemas/resolve"
import { copySubmissionFormSchema } from "@/lib/schemas/submission"
import { cn } from "@/lib/util"

interface RoleOption {
  id: string
  name: string
  productionId: string
  productionName: string
}

interface Props {
  submissionId: string
  currentRoleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConsiderForRoleDialog({
  submissionId,
  currentRoleId,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [currentProductionId, setCurrentProductionId] = useState<string | null>(
    null,
  )
  const [currentProductionName, setCurrentProductionName] = useState("")
  const [isLoadingRoles, startLoadingRoles] = useTransition()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const { form, action } = useHookFormAction(
    copySubmissionToRole,
    formResolver(copySubmissionFormSchema),
    {
      formProps: { defaultValues: { targetRoleId: "" } },
      actionProps: {
        onSuccess({ data }) {
          if (data) {
            window.open(`/productions/${data.targetProductionId}`, "_blank")
          }
          onOpenChange(false)
          router.refresh()
        },
        onError({ error }) {
          form.setError("root", {
            message: error.serverError ?? "Something went wrong. Try again.",
          })
        },
      },
    },
  )

  const selectedRoleId = form.watch("targetRoleId")

  useEffect(() => {
    if (!open) {
      form.reset({ targetRoleId: "" })
      setSearch("")
      setLoadError(null)
      return
    }

    startLoadingRoles(async () => {
      try {
        const productions = await getOrgRolesGroupedByProduction()
        const options: RoleOption[] = []
        let foundProductionId: string | null = null

        for (const prod of productions) {
          let isCurrentProduction = false
          for (const role of prod.roles) {
            if (role.id === currentRoleId) {
              foundProductionId = prod.id
              isCurrentProduction = true
              continue
            }
            options.push({
              id: role.id,
              name: role.name,
              productionId: prod.id,
              productionName: prod.name,
            })
          }
          if (isCurrentProduction) {
            setCurrentProductionName(prod.name)
          }
        }

        setCurrentProductionId(foundProductionId)
        setRoles(options)
      } catch {
        setLoadError("Could not load roles. Try again.")
      }
    })
  }, [open, currentRoleId, form])

  function onSubmit(values: { targetRoleId: string }) {
    action.execute({ submissionId, targetRoleId: values.targetRoleId })
  }

  const query = search.toLowerCase()

  const filteredRoles = query
    ? roles.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.productionName.toLowerCase().includes(query),
      )
    : roles

  // Group by production, current production first
  const grouped = new Map<string, { name: string; roles: RoleOption[] }>()
  for (const role of filteredRoles) {
    let group = grouped.get(role.productionId)
    if (!group) {
      group = { name: role.productionName, roles: [] }
      grouped.set(role.productionId, group)
    }
    group.roles.push(role)
  }

  const currentGroup = currentProductionId
    ? grouped.get(currentProductionId)
    : undefined
  const otherGroups = [...grouped.entries()].filter(
    ([id]) => id !== currentProductionId,
  )

  function selectRole(roleId: string) {
    form.setValue("targetRoleId", roleId, { shouldValidate: true })
  }

  function renderItem(role: RoleOption) {
    const isSelected = role.id === selectedRoleId
    return (
      <button
        key={role.id}
        type="button"
        onClick={() => selectRole(role.id)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-muted",
        )}
      >
        <span className="min-w-0 truncate">{role.name}</span>
        {isSelected && <CheckIcon className="size-4 shrink-0 text-primary" />}
      </button>
    )
  }

  function renderGroup(name: string, groupRoles: RoleOption[]) {
    return (
      <div key={name}>
        <p className="px-3 py-1.5 text-muted-foreground text-xs">{name}</p>
        {groupRoles.map((r) => renderItem(r))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consider for another role</DialogTitle>
          <DialogDescription>
            Copy this submission to another role. The original submission will
            be kept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : loadError ? (
                <Alert variant="destructive">
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search for a role..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-md border">
                    {filteredRoles.length === 0 ? (
                      <p className="py-4 text-center text-muted-foreground text-sm">
                        No matching roles found
                      </p>
                    ) : (
                      <div className="flex flex-col py-1">
                        {currentGroup &&
                          renderGroup(
                            currentProductionName,
                            currentGroup.roles,
                          )}
                        {otherGroups.map(([, group]) =>
                          renderGroup(group.name, group.roles),
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              <FieldError errors={[form.formState.errors.targetRoleId]} />
            </Field>
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={action.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={action.isPending}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
