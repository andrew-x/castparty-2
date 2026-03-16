"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"

export function StageSortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sort = searchParams.get("sort") ?? "newest"

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value === "newest") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <Select value={sort} onValueChange={handleChange}>
      <SelectTrigger size="sm" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest first</SelectItem>
        <SelectItem value="oldest">Oldest first</SelectItem>
        <SelectItem value="name-asc">Name A–Z</SelectItem>
        <SelectItem value="name-desc">Name Z–A</SelectItem>
      </SelectContent>
    </Select>
  )
}
