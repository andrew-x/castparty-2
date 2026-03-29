"use client"

import type { LucideIcon } from "lucide-react"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/common/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import { cn } from "@/lib/util"

export interface SubNavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface Props {
  items: SubNavItem[]
}

export function SubNav({ items }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string) {
    return pathname === href
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-border border-r transition-[width] duration-200",
        collapsed ? "w-12" : "w-48",
      )}
    >
      <div
        className={cn(
          "flex border-border border-b p-2",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          tooltip={collapsed ? "Expand nav" : "Collapse nav"}
          className="text-muted-foreground"
        >
          {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
        </Button>
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-tight pt-2",
          collapsed ? "items-center px-1.5" : "px-2",
        )}
      >
        {items.map((item) => {
          const active = isActive(item.href)

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-label transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                active ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
