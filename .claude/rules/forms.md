---
paths:
  - "src/components/**/*-form.tsx"
  - "src/components/**/*-dialog.tsx"
  - "src/lib/schemas/**/*.ts"
  - "src/actions/**/*.ts"
---

# Form Conventions

## Always use `useHookFormAction` for action-connected forms

When building a form that submits to a `next-safe-action` action, use the
`useHookFormAction` adapter hook. Never wire `useForm` + `useAction` separately.

```tsx
// Correct — single hook handles both form state and action execution
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { formResolver } from "@/lib/schemas/resolve"

const { form, action } = useHookFormAction(
  myAction,
  formResolver(myFormSchema),
  {
    formProps: { defaultValues: { name: "", email: "" } },
    actionProps: {
      onSuccess() { /* ... */ },
      onError({ error }) {
        form.setError("root", {
          message: error.serverError ?? "Something went wrong. Try again.",
        })
      },
    },
  },
)

// Wrong — separate hooks with manual wiring
const form = useForm({ resolver: zodResolver(schema), defaultValues: { ... } })
const { execute, isPending } = useAction(myAction, { onSuccess, onError })
```

## Schema location

**Shared schemas** — when a schema is used by both a form component and an action,
or by multiple files, extract it to `src/lib/schemas/[feature].ts`. Split into a
**form schema** (user-input fields only) and an **action schema** (extends with IDs
and server-only refinements).

```ts
// src/lib/schemas/production.ts
export const updateProductionFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
  status: productionStatusSchema,
})

export const updateProductionActionSchema = updateProductionFormSchema.extend({
  productionId: z.string().min(1),
})
```

**Single-use schemas** — when a schema is only used in one file (e.g., an action's
`inputSchema` that no form references, or a dialog's local validation), it's fine
to define it inline. Extract to `src/lib/schemas/` if it later becomes shared.

**Never duplicate** — if a schema already exists in `src/lib/schemas/`, import it
rather than redefining the same shape inline.

## Submit handlers

**Use `handleSubmitWithAction`** when the form fields match the action input exactly
(no extra IDs or transformations needed).

**Use `form.handleSubmit((v) => action.execute({ ...v, extraId }))`** when you need
to inject IDs from props/context or transform the data before sending.

## Loading and error state

- **Loading:** Use `action.isPending` (not a separate variable).
- **Server errors:** Use `form.setError("root", ...)` in `onError` for non-validation
  server errors. Display with `form.formState.errors.root`.
- **Validation errors:** Automatically mapped to fields by the adapter via `zodResolver`.

## Use `formResolver` instead of `zodResolver`

Always use `formResolver` from `@/lib/schemas/resolve` instead of `zodResolver`
directly. This wrapper centralises the type cast needed because form schemas
intentionally differ from action schemas (fewer fields).

```tsx
import { formResolver } from "@/lib/schemas/resolve"

// Correct
formResolver(myFormSchema),

// Wrong — raw zodResolver requires an `as any` cast in every form
zodResolver(myFormSchema) as any,
```

## Exception: auth forms

Forms using Better Auth (`authClient`) don't use `next-safe-action` and therefore
don't use `useHookFormAction`. Standard `useForm` is fine for those.
