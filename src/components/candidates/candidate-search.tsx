"use client"

import { SearchIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Input } from "@/components/common/input"

const DEBOUNCE_MS = 300

export function CandidateSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  function handleChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = value.trim()

      if (trimmed) {
        params.set("search", trimmed)
      } else {
        params.delete("search")
      }
      params.set("page", "1")

      router.replace(`?${params.toString()}`)
    }, DEBOUNCE_MS)
  }

  return (
    <div className="relative max-w-xs">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search candidates"
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
