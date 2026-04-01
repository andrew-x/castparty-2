"use client"

import { move } from "@dnd-kit/helpers"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { ImagePlusIcon, StarIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/common/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import { cn } from "@/lib/util"

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic"
const DEFAULT_MAX_FILES = 10
const MAX_FILE_SIZE = 20 * 1024 * 1024

export interface HeadshotFile {
  id: string
  file: File
  previewUrl: string
}

interface Props {
  files: HeadshotFile[]
  onChange: (files: HeadshotFile[]) => void
  error?: string
  maxFiles?: number
  showPrimary?: boolean
}

function SortableThumbnail({
  item,
  index,
  isFirst,
  showPrimary,
  onRemove,
}: {
  item: HeadshotFile
  index: number
  isFirst: boolean
  showPrimary: boolean
  onRemove: () => void
}) {
  const { ref, isDragSource } = useSortable({
    id: item.id,
    index,
  })

  return (
    <div
      ref={ref}
      className={cn(
        "group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-border bg-muted active:cursor-grabbing",
        isDragSource && "opacity-40",
      )}
    >
      {/* biome-ignore lint/performance/noImgElement: blob URLs don't work with next/image */}
      <img
        src={item.previewUrl}
        alt={item.file.name}
        className="size-full object-cover"
        draggable={false}
      />
      {isFirst && showPrimary && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-1 left-1 rounded-full bg-brand p-1">
              <StarIcon className="size-3 fill-white text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent>This will be your main headshot</TooltipContent>
        </Tooltip>
      )}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100"
        onClick={onRemove}
        tooltip="Remove"
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  )
}

export function HeadshotUploader({
  files,
  onChange,
  error,
  maxFiles = DEFAULT_MAX_FILES,
  showPrimary = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected) return

    setLocalError(null)
    const newFiles: HeadshotFile[] = []

    for (const file of Array.from(selected)) {
      if (file.size > MAX_FILE_SIZE) {
        setLocalError(`"${file.name}" exceeds 20MB.`)
        continue
      }
      newFiles.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    const combined = [...files, ...newFiles]
    if (combined.length > maxFiles) {
      setLocalError(`You can upload up to ${maxFiles} headshots.`)
      onChange(combined.slice(0, maxFiles))
    } else {
      onChange(combined)
    }

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleRemove(id: string) {
    const removed = files.find((f) => f.id === id)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    onChange(files.filter((f) => f.id !== id))
    setLocalError(null)
  }

  function handleDragEnd(event: Parameters<DragEndEvent>[0]) {
    if (event.canceled) return
    onChange(move(files, event))
  }

  const displayError = error || localError

  return (
    <div className="flex flex-col gap-block">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {files.length > 0 && (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-element sm:grid-cols-4 md:grid-cols-5">
            {files.map((item, index) => (
              <SortableThumbnail
                key={item.id}
                item={item}
                index={index}
                isFirst={index === 0}
                showPrimary={showPrimary}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </div>
        </DragDropProvider>
      )}

      {files.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-element rounded-lg border-2 border-border border-dashed px-4 py-6 text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
        >
          <ImagePlusIcon className="size-5" />
          <span className="text-label">
            {files.length === 0 ? "Add headshots" : "Add more"}
          </span>
        </button>
      )}

      {files.length > 1 && (
        <p className="text-caption text-muted-foreground">
          {showPrimary
            ? "Drag to reorder. First image is your main headshot."
            : "Drag to reorder."}
        </p>
      )}

      {displayError && (
        <p className="text-caption text-destructive">{displayError}</p>
      )}
    </div>
  )
}
