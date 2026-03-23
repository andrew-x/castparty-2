"use client"

import type * as React from "react"
import { Button } from "@/components/common/button"
import {
  TEMPLATE_VARIABLE_LABELS,
  TEMPLATE_VARIABLES,
} from "@/lib/email-template"

interface Props {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  onInsert: (value: string) => void
}

export function VariableInsertButtons({ inputRef, onInsert }: Props) {
  function insertVariable(variableName: string) {
    const token = `{{${variableName}}}`
    const el = inputRef.current

    if (!el) {
      return
    }

    const isFocused = document.activeElement === el
    const start = isFocused
      ? (el.selectionStart ?? el.value.length)
      : el.value.length
    const end = isFocused
      ? (el.selectionEnd ?? el.value.length)
      : el.value.length
    const before = el.value.slice(0, start)
    const after = el.value.slice(end)
    const next = `${before}${token}${after}`

    onInsert(next)

    // Restore focus and move cursor to after the inserted token
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="flex flex-wrap gap-tight">
      {TEMPLATE_VARIABLES.map((variable) => (
        <Button
          key={variable}
          type="button"
          variant="outline"
          size="xs"
          onClick={() => insertVariable(variable)}
        >
          {TEMPLATE_VARIABLE_LABELS[variable]}
        </Button>
      ))}
    </div>
  )
}
