"use client"

import { KeyIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
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
import day from "@/lib/dayjs"
import { AddUserDialog } from "./add-user-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"

export interface AdminUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: Date
}

interface Props {
  users: AdminUser[]
}

export function AdminUsersClient({ users }: Props) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  function refresh() {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <p className="text-label text-muted-foreground">{users.length} users</p>
        <Button
          size="sm"
          leftSection={<PlusIcon />}
          onClick={() => setAddOpen(true)}
        >
          Add user
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium text-foreground">
                {u.name}
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant={u.emailVerified ? "default" : "secondary"}>
                  {u.emailVerified ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="text-caption text-muted-foreground">
                {day(u.createdAt).format("MMM D, YYYY")}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-element">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPasswordTarget(u)}
                  >
                    <KeyIcon />
                    <span className="sr-only">Change password</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(u)}
                  >
                    <Trash2Icon className="text-destructive" />
                    <span className="sr-only">Delete user</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={refresh}
      />

      <ChangePasswordDialog
        user={passwordTarget}
        open={!!passwordTarget}
        onOpenChange={(open) => {
          if (!open) setPasswordTarget(null)
        }}
        onSuccess={() => setPasswordTarget(null)}
      />

      <DeleteUserDialog
        user={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onSuccess={refresh}
      />
    </div>
  )
}
