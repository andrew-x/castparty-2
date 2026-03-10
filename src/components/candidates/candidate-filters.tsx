"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
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

interface FilterOption {
  id: string
  name: string
  roles: { id: string; name: string }[]
}

interface Props {
  productions: FilterOption[]
}

interface ComboboxOption {
  value: string
  label: string
}

function buildOptions(productions: FilterOption[]) {
  const byKey = new Map<string, ComboboxOption>()

  for (const prod of productions) {
    byKey.set(`p:${prod.id}`, { value: `p:${prod.id}`, label: prod.name })
    for (const role of prod.roles) {
      byKey.set(`r:${role.id}`, {
        value: `r:${role.id}`,
        label: `${prod.name} / ${role.name}`,
      })
    }
  }

  return byKey
}

function initFromParams(
  searchParams: URLSearchParams,
  byKey: Map<string, ComboboxOption>,
): ComboboxOption[] {
  const values: ComboboxOption[] = []
  for (const id of searchParams
    .get("productions")
    ?.split(",")
    .filter(Boolean) ?? []) {
    const opt = byKey.get(`p:${id}`)
    if (opt) values.push(opt)
  }
  for (const id of searchParams.get("roles")?.split(",").filter(Boolean) ??
    []) {
    const opt = byKey.get(`r:${id}`)
    if (opt) values.push(opt)
  }
  return values
}

export function CandidateFilters({ productions }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const anchorRef = useComboboxAnchor()

  const byKey = buildOptions(productions)
  const [selected, setSelected] = useState<ComboboxOption[]>(() =>
    initFromParams(new URLSearchParams(searchParams.toString()), byKey),
  )

  function handleValueChange(values: ComboboxOption[]) {
    setSelected(values)

    const params = new URLSearchParams(searchParams.toString())
    const productionIds: string[] = []
    const roleIds: string[] = []

    for (const v of values) {
      if (v.value.startsWith("p:")) productionIds.push(v.value.slice(2))
      else if (v.value.startsWith("r:")) roleIds.push(v.value.slice(2))
    }

    if (productionIds.length > 0) {
      params.set("productions", productionIds.join(","))
    } else {
      params.delete("productions")
    }

    if (roleIds.length > 0) {
      params.set("roles", roleIds.join(","))
    } else {
      params.delete("roles")
    }

    params.set("page", "1")
    router.replace(`?${params.toString()}`)
  }

  if (productions.length === 0) return null

  return (
    <Combobox
      multiple
      value={selected}
      onValueChange={handleValueChange}
      getOptionLabel={(opt: ComboboxOption) => opt.label}
    >
      <ComboboxChips ref={anchorRef} className="min-w-72 max-w-md">
        {selected.map((chip) => (
          <ComboboxChip key={chip.value} value={chip}>
            {chip.label}
          </ComboboxChip>
        ))}
        <ComboboxChipsInput placeholder="Filter by production or role" />
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxList>
          <ComboboxEmpty>No matches found</ComboboxEmpty>
          {productions.map((prod) => (
            <>
              <ComboboxItem key={prod.id} value={byKey.get(`p:${prod.id}`)}>
                {prod.name}
              </ComboboxItem>
              {prod.roles.map((role) => (
                <ComboboxItem key={role.id} value={byKey.get(`r:${role.id}`)}>
                  {prod.name} / {role.name}
                </ComboboxItem>
              ))}
            </>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
