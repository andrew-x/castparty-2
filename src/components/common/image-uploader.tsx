"use client"

import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/common/button"
import { cn } from "@/lib/util"

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ImageUploaderProps {
  value: string | null
  onChange: (url: string | null, key: string | null) => void
  presignAction: (input: {
    file: { filename: string; contentType: string; size: number }
  }) => Promise<{
    data?: { key: string; presignedUrl: string; publicUrl: string }
  }>
  maxSizeMb: number
  aspectHint?: string
  maxWidth?: number
  label: string
}

interface MultiImageUploaderProps {
  value: { url: string; key: string }[]
  onChange: (items: { url: string; key: string }[]) => void
  presignAction: (input: {
    files: { filename: string; contentType: string; size: number }[]
  }) => Promise<{
    data?: {
      files: { key: string; presignedUrl: string; publicUrl: string }[]
    }
  }>
  maxFiles: number
  maxSizeMb: number
  label: string
}

// ─── ImageUploader ───────────────────────────────────────────────────────────

export function ImageUploader({
  value,
  onChange,
  presignAction,
  maxSizeMb,
  aspectHint,
  maxWidth,
  label,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!inputRef.current) return
    // Reset so the same file can be re-selected after removal
    inputRef.current.value = ""
    if (!file) return

    setError(null)

    const maxBytes = maxSizeMb * 1024 * 1024
    if (file.size > maxBytes) {
      setError(`File exceeds ${maxSizeMb}MB limit.`)
      return
    }

    setUploading(true)
    try {
      const result = await presignAction({
        file: {
          filename: file.name,
          contentType: file.type,
          size: file.size,
        },
      })

      if (!result?.data) throw new Error("Failed to get upload URL.")

      const { key, presignedUrl, publicUrl } = result.data

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!uploadRes.ok) throw new Error("Upload failed.")

      onChange(publicUrl, key)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-block"
      style={maxWidth ? { maxWidth } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleFileSelect}
      />

      {value ? (
        // Thumbnail with remove button
        <div
          className={cn(
            "group relative overflow-hidden rounded-lg border border-border bg-muted",
            // Apply aspect ratio class based on hint, defaulting to square
            aspectHint === "16:9"
              ? "aspect-video"
              : aspectHint === "4:3"
                ? "aspect-4/3"
                : "aspect-square",
          )}
          style={
            // For arbitrary aspect ratios not covered by Tailwind classes, fall back
            // to an inline style. For the common hints we cover with Tailwind above.
            aspectHint &&
            aspectHint !== "16:9" &&
            aspectHint !== "4:3" &&
            aspectHint !== "1:1"
              ? { aspectRatio: aspectHint.replace(":", "/") }
              : undefined
          }
        >
          {/* biome-ignore lint/performance/noImgElement: blob URLs and temp URLs don't work with next/image */}
          <img src={value} alt={label} className="size-full object-cover" />

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2Icon className="size-6 animate-spin text-foreground" />
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100"
            onClick={() => onChange(null, null)}
            tooltip="Remove"
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      ) : (
        // Drop zone
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex items-center justify-center gap-element rounded-lg border-2 border-border border-dashed px-4 py-6 text-muted-foreground transition-colors hover:border-brand hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
            aspectHint === "16:9"
              ? "aspect-video"
              : aspectHint === "4:3"
                ? "aspect-4/3"
                : "",
          )}
          style={
            aspectHint &&
            aspectHint !== "16:9" &&
            aspectHint !== "4:3" &&
            aspectHint !== "1:1"
              ? { aspectRatio: aspectHint.replace(":", "/") }
              : undefined
          }
        >
          {uploading ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <>
              <ImagePlusIcon className="size-5" />
              <span className="text-label">{label}</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  )
}

// ─── MultiImageUploader ──────────────────────────────────────────────────────

export function MultiImageUploader({
  value,
  onChange,
  presignAction,
  maxFiles,
  maxSizeMb,
  label,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    // Convert to array BEFORE resetting input — FileList is a live reference
    // that empties when the input value is cleared
    const files = Array.from(selected)
    if (inputRef.current) inputRef.current.value = ""

    setError(null)

    const maxBytes = maxSizeMb * 1024 * 1024

    // Validate sizes
    for (const file of files) {
      if (file.size > maxBytes) {
        setError(`"${file.name}" exceeds ${maxSizeMb}MB limit.`)
        return
      }
    }

    // Enforce maxFiles
    const remaining = maxFiles - value.length
    const toUpload = files.slice(0, remaining)
    if (files.length > remaining) {
      setError(`You can upload up to ${maxFiles} images.`)
    }

    if (toUpload.length === 0) return

    setUploading(true)
    try {
      const result = await presignAction({
        files: toUpload.map((f) => ({
          filename: f.name,
          contentType: f.type,
          size: f.size,
        })),
      })

      if (!result?.data?.files) throw new Error("Failed to get upload URLs.")

      // Upload all files in parallel
      await Promise.all(
        result.data.files.map(({ presignedUrl }, i) =>
          fetch(presignedUrl, {
            method: "PUT",
            body: toUpload[i],
            headers: { "Content-Type": toUpload[i].type },
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to upload "${toUpload[i].name}".`)
          }),
        ),
      )

      const newItems = result.data.files.map(({ key, publicUrl }) => ({
        key,
        url: publicUrl,
      }))

      onChange([...value, ...newItems])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  function handleRemove(key: string) {
    onChange(value.filter((item) => item.key !== key))
    setError(null)
  }

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

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-element sm:grid-cols-4 md:grid-cols-5">
          {value.map((item) => (
            <div
              key={item.key}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* biome-ignore lint/performance/noImgElement: blob URLs and temp URLs don't work with next/image */}
              <img src={item.url} alt="" className="size-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100"
                onClick={() => handleRemove(item.key)}
                tooltip="Remove"
              >
                <XIcon className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-element rounded-lg border-2 border-border border-dashed px-4 py-6 text-muted-foreground transition-colors hover:border-brand hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {uploading ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <>
              <ImagePlusIcon className="size-5" />
              <span className="text-label">
                {value.length === 0 ? label : "Add more"}
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  )
}
