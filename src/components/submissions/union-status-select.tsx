"use client"

import { useRef, useState } from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/common/combobox"
import { UNION_OPTIONS } from "@/lib/types"

interface Props {
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}

export function UnionStatusSelect({ value, onChange, disabled }: Props) {
  const [inputValue, setInputValue] = useState("")
  const anchor = useComboboxAnchor()
  const inputRef = useRef<HTMLInputElement>(null)

  // All standard options plus any custom values already selected
  const allOptions = [
    ...(UNION_OPTIONS as readonly string[]),
    ...value.filter(
      (v) =>
        !(UNION_OPTIONS as readonly string[]).some(
          (opt) => opt.toLowerCase() === v.toLowerCase(),
        ),
    ),
  ]

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return
    const trimmed = inputValue.trim()
    if (!trimmed) return

    // Only add as custom entry if not already selected and not an existing option
    const isExistingOption = allOptions.some(
      (opt) => opt.toLowerCase() === trimmed.toLowerCase(),
    )
    if (!isExistingOption && !value.includes(trimmed)) {
      e.preventDefault()
      onChange([...value, trimmed])
      setInputValue("")
    }
  }

  return (
    <Combobox
      multiple
      value={value}
      onValueChange={onChange}
      onInputValueChange={(val) => setInputValue(val)}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor}>
        {value.map((v) => (
          <ComboboxChip key={v}>{v}</ComboboxChip>
        ))}
        <ComboboxChipsInput
          ref={inputRef}
          placeholder={value.length === 0 ? "Select or type a union..." : ""}
          onKeyDown={handleKeyDown}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          {inputValue.trim() && (
            <ComboboxEmpty>
              Press Enter to add &ldquo;{inputValue.trim()}&rdquo;
            </ComboboxEmpty>
          )}
          {allOptions
            .filter((opt) =>
              opt.toLowerCase().includes(inputValue.toLowerCase()),
            )
            .map((opt) => (
              <ComboboxItem key={opt} value={opt}>
                {opt}
              </ComboboxItem>
            ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
