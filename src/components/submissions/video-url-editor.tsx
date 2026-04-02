"use client"

import { PlusIcon, VideoIcon, XIcon } from "lucide-react"
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"
import { VideoEmbed } from "@/components/submissions/video-embed"

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
}

export function VideoUrlEditor({ value, onChange }: Props) {
  function handleAdd() {
    onChange([...value, ""])
  }

  function handleChange(index: number, newValue: string) {
    const updated = [...value]
    updated[index] = newValue
    onChange(updated)
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function handleBlur(index: number) {
    const url = value[index]
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      const updated = [...value]
      updated[index] = `https://${url}`
      onChange(updated)
    }
  }

  return (
    <div className="flex flex-col gap-element">
      {value.map((url, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: editable list items have no stable ID
        <div key={index} className="flex flex-col gap-element">
          <div className="flex items-center gap-element">
            <VideoIcon className="size-4 shrink-0 text-muted-foreground" />
            <Input
              type="url"
              value={url}
              onChange={(e) => handleChange(index, e.target.value)}
              onBlur={() => handleBlur(index)}
              placeholder="https://..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tooltip="Remove video"
              onClick={() => handleRemove(index)}
            >
              <XIcon />
            </Button>
          </div>
          {url && <VideoEmbed url={url} className="ml-8" />}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        leftSection={<PlusIcon />}
        onClick={handleAdd}
      >
        Add video
      </Button>
    </div>
  )
}
