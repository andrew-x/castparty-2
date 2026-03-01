"use client"

import {
  ArrowRightLeftIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import { ChangeRoleDialog } from "./change-role-dialog"
import { InviteMemberDialog } from "./invite-member-dialog"
import { RemoveMemberDialog } from "./remove-member-dialog"
import { TransferOwnershipDialog } from "./transfer-ownership-dialog"

export interface OrgMember {
  id: string
  role: string
  userId: string
  userName: string
  userEmail: string
  userImage: string | null
  createdAt: Date
}

interface Props {
  organizationId: string
  members: OrgMember[]
  currentUserRole: string
  currentUserId: string
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function MembersTable({
  organizationId,
  members,
  currentUserRole,
  currentUserId,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState<OrgMember | null>(null)
  const [transferTarget, setTransferTarget] = useState<OrgMember | null>(null)
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null)

  const isOwner = currentUserRole === "owner"
  const isAdmin = currentUserRole === "admin"
  const canManage = isOwner || isAdmin

  function canChangeRole(m: OrgMember) {
    if (m.role === "owner") return false
    if (m.userId === currentUserId) return false
    if (isOwner) return true
    if (isAdmin && m.role === "member") return true
    return false
  }

  function canRemove(m: OrgMember) {
    if (m.role === "owner") return false
    if (m.userId === currentUserId) return false
    if (isOwner) return true
    if (isAdmin && m.role === "member") return true
    return false
  }

  function canTransfer(m: OrgMember) {
    return isOwner && m.userId !== currentUserId
  }

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <p className="text-label text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
        {canManage && (
          <Button
            size="sm"
            leftSection={<PlusIcon />}
            onClick={() => setInviteOpen(true)}
          >
            Invite
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canManage && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium text-foreground">
                {m.userName}
                {m.userId === currentUserId && (
                  <span className="ml-1 text-caption text-muted-foreground">
                    (you)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {m.userEmail}
              </TableCell>
              <TableCell>
                <Badge variant={roleBadgeVariant[m.role] ?? "outline"}>
                  {roleLabel(m.role)}
                </Badge>
              </TableCell>
              {canManage && (
                <TableCell>
                  <div className="flex items-center justify-end gap-element">
                    {canChangeRole(m) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setRoleTarget(m)}
                          >
                            <ShieldIcon />
                            <span className="sr-only">Change role</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Change role</TooltipContent>
                      </Tooltip>
                    )}
                    {canTransfer(m) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setTransferTarget(m)}
                          >
                            <ArrowRightLeftIcon />
                            <span className="sr-only">Transfer ownership</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Transfer ownership</TooltipContent>
                      </Tooltip>
                    )}
                    {canRemove(m) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setRemoveTarget(m)}
                          >
                            <Trash2Icon className="text-destructive" />
                            <span className="sr-only">Remove member</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove member</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InviteMemberDialog
        organizationId={organizationId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />

      <ChangeRoleDialog
        organizationId={organizationId}
        member={
          roleTarget
            ? {
                id: roleTarget.id,
                userName: roleTarget.userName,
                role: roleTarget.role,
              }
            : null
        }
        open={!!roleTarget}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null)
        }}
      />

      <TransferOwnershipDialog
        organizationId={organizationId}
        member={
          transferTarget
            ? { id: transferTarget.id, userName: transferTarget.userName }
            : null
        }
        open={!!transferTarget}
        onOpenChange={(open) => {
          if (!open) setTransferTarget(null)
        }}
      />

      <RemoveMemberDialog
        organizationId={organizationId}
        member={
          removeTarget
            ? { id: removeTarget.id, userName: removeTarget.userName }
            : null
        }
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
      />
    </div>
  )
}
