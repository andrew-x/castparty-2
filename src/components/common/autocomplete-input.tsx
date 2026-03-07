"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/common/input"
import { cn } from "@/lib/util"

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  id?: string
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  minChars?: number
  maxResults?: number
  emptyMessage?: string
}

function AutocompleteInput({
  value,
  onChange,
  options,
  id,
  placeholder,
  disabled,
  "aria-invalid": ariaInvalid,
  minChars = 2,
  maxResults = 20,
  emptyMessage = "No results",
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const trimmed = value.trim().toLowerCase()
  const filtered =
    trimmed.length >= minChars
      ? options
          .filter((opt) => opt.toLowerCase().startsWith(trimmed))
          .slice(0, maxResults)
      : []

  const showDropdown = open && trimmed.length >= minChars

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault()
      onChange(filtered[highlightIndex])
      setOpen(false)
      setHighlightIndex(-1)
    } else if (e.key === "Escape") {
      setOpen(false)
      setHighlightIndex(-1)
    }
  }

  function handleSelect(option: string) {
    onChange(option)
    setOpen(false)
    setHighlightIndex(-1)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlightIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={showDropdown && filtered.length > 0}
        aria-autocomplete="list"
        aria-controls={id ? `${id}-listbox` : undefined}
      />
      {showDropdown && (
        <div
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className={cn(
            "absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md",
            filtered.length === 0 && "p-2",
          )}
        >
          {filtered.length === 0 ? (
            <div className="text-label text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((option, i) => (
              <div
                key={option}
                role="option"
                tabIndex={-1}
                aria-selected={i === highlightIndex}
                className={cn(
                  "cursor-pointer rounded-sm px-2 py-1.5 text-label",
                  i === highlightIndex && "bg-muted",
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(option)
                }}
                onMouseEnter={() => setHighlightIndex(i)}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export { AutocompleteInput }
