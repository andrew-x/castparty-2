"use client"

import { PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"
import { SocialIcon } from "@/components/common/social-icons"

interface Props {
  value: string[]
  onChange: (links: string[]) => void
}

export function LinksEditor({ value, onChange }: Props) {
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
      {value.map((link, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: editable list items have no stable ID
        <div key={index} className="flex items-center gap-element">
          <SocialIcon url={link} className="shrink-0 text-muted-foreground" />
          <Input
            type="url"
            value={link}
            onChange={(e) => handleChange(index, e.target.value)}
            onBlur={() => handleBlur(index)}
            placeholder="https://..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tooltip="Remove link"
            onClick={() => handleRemove(index)}
          >
            <XIcon />
          </Button>
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
        Add link
      </Button>
    </div>
  )
}
