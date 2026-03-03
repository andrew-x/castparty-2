"use client"

import { PlusIcon, ShieldIcon, Trash2Icon, XIcon } from "lucide-react"
import { useState } from "react"
import type { OrgInvitation } from "@/actions/organizations/get-org-invitations"
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

import { CancelInvitationDialog } from "./cancel-invitation-dialog"
import { ChangeRoleDialog } from "./change-role-dialog"
import { InviteMemberDialog } from "./invite-member-dialog"
import { RemoveMemberDialog } from "./remove-member-dialog"

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
  pendingInvitations: OrgInvitation[]
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
  pendingInvitations,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState<OrgMember | null>(null)
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null)
  const [cancelTarget, setCancelTarget] = useState<OrgInvitation | null>(null)

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
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRoleTarget(m)}
                        tooltip="Change role"
                      >
                        <ShieldIcon />
                        <span className="sr-only">Change role</span>
                      </Button>
                    )}
                    {canRemove(m) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRemoveTarget(m)}
                        tooltip="Remove member"
                      >
                        <Trash2Icon className="text-destructive" />
                        <span className="sr-only">Remove member</span>
                      </Button>
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
        canTransferOwnership={isOwner}
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

      {pendingInvitations.length > 0 && (
        <>
          <p className="text-label text-muted-foreground">
            {pendingInvitations.length} pending{" "}
            {pendingInvitations.length === 1 ? "invitation" : "invitations"}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-foreground">{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[inv.role] ?? "outline"}>
                      {roleLabel(inv.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setCancelTarget(inv)}
                        tooltip="Cancel invitation"
                      >
                        <XIcon className="text-destructive" />
                        <span className="sr-only">Cancel invitation</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      <CancelInvitationDialog
        organizationId={organizationId}
        invitation={
          cancelTarget
            ? { id: cancelTarget.id, email: cancelTarget.email }
            : null
        }
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
      />
    </div>
  )
}
