"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { tabsListVariants } from "@/components/common/tabs"
import { cn } from "@/lib/util"

interface Props {
  productionId: string
}

const tabs = [
  { label: "Submissions", segment: "" },
  { label: "Settings", segment: "/settings" },
] as const

export function ProductionTabNav({ productionId }: Props) {
  const pathname = usePathname()
  const basePath = `/productions/${productionId}`

  return (
    <nav>
      <div className={cn(tabsListVariants({ variant: "line" }))}>
        {tabs.map((tab) => {
          const href = `${basePath}${tab.segment}`
          const isActive =
            tab.segment === ""
              ? pathname === basePath
              : pathname.startsWith(href)

          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "relative inline-flex h-9 items-center justify-center whitespace-nowrap px-2 py-1 font-medium text-foreground/60 text-sm transition-all hover:text-foreground",
                "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity",
                isActive && "text-foreground after:opacity-100",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
