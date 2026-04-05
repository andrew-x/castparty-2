"use client"

import { CheckIcon, TriangleAlertIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useRef, useState } from "react"
import { mergeCandidate } from "@/actions/candidates/merge-candidate"
import { searchCandidates } from "@/actions/candidates/search-candidates"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import { Input } from "@/components/common/input"
import { cn } from "@/lib/util"

interface CandidateOption {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Props {
  candidate: { id: string; firstName: string; lastName: string; email: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MergeCandidateDialog({ candidate, open, onOpenChange }: Props) {
  const router = useRouter()
  const [results, setResults] = useState<CandidateOption[]>([])
  const [selected, setSelected] = useState<CandidateOption | null>(null)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const sourceName = `${candidate.firstName} ${candidate.lastName}`

  const action = useAction(mergeCandidate, {
    onSuccess({ data }) {
      if (data?.destinationCandidateId) {
        onOpenChange(false)
        router.push(`/candidates/${data.destinationCandidateId}`)
      }
    },
    onError({ error: err }) {
      setError(err.serverError ?? "Something went wrong. Try again.")
    },
  })

  useEffect(() => {
    if (!open) {
      setResults([])
      setSelected(null)
      setQuery("")
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      const data = await searchCandidates(trimmed, candidate.id)
      setResults(data)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, candidate.id])

  function handleMerge() {
    if (!selected) return
    setError(null)
    action.execute({
      sourceCandidateId: candidate.id,
      destinationCandidateId: selected.id,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge candidate</DialogTitle>
          <DialogDescription>
            Choose a candidate to merge {sourceName} into.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-block">
          <Input
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
            }}
          />

          <div className="h-48 overflow-y-auto rounded-md border">
            {results.length > 0 ? (
              <ul className="flex flex-col">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-accent",
                        selected?.id === c.id && "bg-accent",
                      )}
                      onClick={() => setSelected(c)}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-label font-medium">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {c.email}
                        </span>
                      </div>
                      {selected?.id === c.id && (
                        <CheckIcon className="size-4 shrink-0 text-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <p className="flex h-full items-center justify-center text-label text-muted-foreground">
                No candidates found
              </p>
            ) : (
              <p className="flex h-full items-center justify-center text-label text-muted-foreground">
                Type to search for a candidate
              </p>
            )}
          </div>

          {selected && (
            <Alert>
              <TriangleAlertIcon />
              <AlertDescription>
                This cannot be undone. All submissions and files will be moved
                to the selected candidate, and this candidate will be deleted.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!selected}
            loading={action.isPending}
            onClick={handleMerge}
          >
            Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
