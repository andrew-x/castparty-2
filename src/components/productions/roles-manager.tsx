"use client"

import { PlusIcon, UserIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { CreateRoleDialog } from "@/components/productions/create-role-dialog"
import { RoleSettingsForm } from "@/components/productions/role-settings-form"
import { cn } from "@/lib/util"

interface RoleItem {
  id: string
  name: string
  slug: string
  description: string
  isOpen: boolean
}

interface Props {
  productionId: string
  orgSlug: string
  productionSlug: string
  roles: RoleItem[]
}

export function RolesManager({
  productionId,
  orgSlug,
  productionSlug,
  roles,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)

  const roleSlug = searchParams.get("role")
  const selectedRole =
    roles.find((r) => r.slug === roleSlug) ?? roles[0] ?? null

  function handleRoleClick(slug: string) {
    router.replace(`?role=${slug}`, { scroll: false })
  }

  function handleRoleCreated(slug: string) {
    router.replace(`?role=${slug}`, { scroll: false })
  }

  if (roles.length === 0) {
    return (
      <>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserIcon />
            </EmptyMedia>
            <EmptyTitle>No roles yet</EmptyTitle>
            <EmptyDescription>
              Add the roles you're casting for to start receiving auditions.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              leftSection={<PlusIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New role
            </Button>
          </EmptyContent>
        </Empty>
        <CreateRoleDialog
          productionId={productionId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={handleRoleCreated}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex min-h-0 flex-1">
        {/* Left panel — role list */}
        <div className="flex w-64 shrink-0 flex-col border-r">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-medium text-label">Roles</h2>
            <Button
              variant="ghost"
              size="sm"
              leftSection={<PlusIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {roles.map((role) => {
              const isActive = selectedRole?.slug === role.slug
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleClick(role.slug)}
                  className={cn(
                    "flex w-full items-center gap-2 border-l-2 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    isActive
                      ? "border-l-brand bg-muted/50"
                      : "border-l-transparent",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-sm">
                    {role.name}
                  </span>
                  <Badge
                    variant={role.isOpen ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px]",
                      role.isOpen
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {role.isOpen ? "Open" : "Closed"}
                  </Badge>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right panel — role settings */}
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          {selectedRole && (
            <RoleSettingsForm
              key={selectedRole.id}
              roleId={selectedRole.id}
              orgSlug={orgSlug}
              productionSlug={productionSlug}
              currentName={selectedRole.name}
              currentSlug={selectedRole.slug}
              currentDescription={selectedRole.description}
              currentIsOpen={selectedRole.isOpen}
            />
          )}
        </div>
      </div>

      <CreateRoleDialog
        productionId={productionId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleRoleCreated}
      />
    </>
  )
}
