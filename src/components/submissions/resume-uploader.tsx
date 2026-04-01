"use client"

import { FileTextIcon, XIcon } from "lucide-react"
import { useRef } from "react"
import { Button } from "@/components/common/button"

const MAX_FILE_SIZE = 10 * 1024 * 1024

interface Props {
  file: File | null
  onChange: (file: File | null) => void
  error?: string
  placeholder?: string
}

export function ResumeUploader({
  file,
  onChange,
  error,
  placeholder = "Add resume (PDF)",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > MAX_FILE_SIZE) {
      onChange(null)
      return
    }

    onChange(selected)

    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-block">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {file ? (
        <div className="flex items-center gap-element rounded-lg border border-border px-3 py-2">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-foreground text-label">
            {file.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            tooltip="Remove resume"
            onClick={() => onChange(null)}
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-element rounded-lg border-2 border-border border-dashed px-4 py-6 text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
        >
          <FileTextIcon className="size-5" />
          <span className="text-label">{placeholder}</span>
        </button>
      )}

      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  )
}
