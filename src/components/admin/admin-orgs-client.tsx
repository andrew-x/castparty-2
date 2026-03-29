"use client"

import { ExternalLinkIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DeleteOrgDialog } from "@/components/admin/delete-org-dialog"
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
import { cn } from "@/lib/util"

export interface AdminOrg {
  id: string
  name: string
  slug: string
  createdAt: Date
  memberCount: number | null
  productionCount: number | null
}

interface Props {
  orgs: AdminOrg[]
}

export function AdminOrgsClient({ orgs }: Props) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<AdminOrg | null>(null)

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <p className="text-label text-muted-foreground">
          {orgs.length} {orgs.length === 1 ? "organization" : "organizations"}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Productions</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgs.map((org) => {
            const isOrphaned = !org.memberCount
            return (
              <TableRow
                key={org.id}
                className={cn(isOrphaned && "bg-destructive/5")}
              >
                <TableCell className="font-medium text-foreground">
                  {org.name}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/s/${org.slug}`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {org.slug}
                    <ExternalLinkIcon className="size-3" />
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {org.memberCount ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {org.productionCount ?? 0}
                </TableCell>
                <TableCell className="text-caption text-muted-foreground">
                  {day(org.createdAt).format("MMM D, YYYY")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(org)}
                      tooltip="Delete organization"
                    >
                      <Trash2Icon className="text-destructive" />
                      <span className="sr-only">Delete organization</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <DeleteOrgDialog
        org={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onSuccess={() => {
          setDeleteTarget(null)
          router.refresh()
        }}
      />
    </div>
  )
}
