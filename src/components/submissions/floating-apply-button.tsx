"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/common/button"
import { cn } from "@/lib/util"

interface Props {
  targetId: string
}

export function FloatingApplyButton({ targetId }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [targetId])

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t bg-background/80 px-page py-3 backdrop-blur-sm transition-opacity duration-200 md:hidden",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Button
        className="w-full"
        onClick={() => {
          document
            .getElementById(targetId)
            ?.scrollIntoView({ behavior: "smooth" })
        }}
      >
        Go to form
      </Button>
    </div>
  )
}
