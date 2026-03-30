# Rich Text Descriptions with Tiptap

## Context

Production and role descriptions are currently plain text (`<Textarea>` → stored as strings → rendered as `<p>` tags). Casting directors need basic formatting (bold, italic, lists) to write clear, structured descriptions for candidates. We're adding Tiptap as a rich text editor, storing HTML strings, and rendering them safely on submission pages.

Bonus fix: the production settings form is missing the description field entirely — we'll add it.

## Packages to Install

```bash
bun add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/pm sanitize-html
bun add -d @types/sanitize-html
```

- **@tiptap/react** + **@tiptap/starter-kit** + **@tiptap/pm** — Editor with Bold, Italic, BulletList, OrderedList, History out of the box
- **@tiptap/extension-placeholder** — Placeholder text in empty editor
- **sanitize-html** — Server-safe HTML sanitizer (works in RSC, no DOM needed)

## New Files

### 1. `src/components/common/rich-text-editor.tsx` (client component)

Reusable Tiptap editor replacing `<Textarea>` for description fields.

- **Props:** `value: string`, `onChange: (html: string) => void`, `placeholder?: string`, `id?: string`, `aria-invalid?: boolean`
- **Extensions:** StarterKit (disable heading, code, codeBlock, blockquote, horizontalRule, strike) + Placeholder
- **Toolbar:** Fixed bar above editor with 4 toggle buttons using lucide icons: Bold, Italic, BulletList, OrderedList
- **Styling:** Match existing Textarea appearance (border, rounded-md, focus ring). Inner `.ProseMirror` gets list styles (`[&_ul]:ml-4 [&_ul]:list-disc` etc.)
- **Value sync:** On mount/external change → `editor.commands.setContent()` only if content differs. On editor update → `onChange(editor.getHTML())`, emitting `""` for empty content (`<p></p>`)
- **react-hook-form:** Works with Controller via `value`/`onChange` — same pattern as Textarea

### 2. `src/lib/sanitize.ts`

```ts
import sanitizeHtml from "sanitize-html"

const OPTIONS = {
  allowedTags: ["p", "strong", "em", "ul", "ol", "li", "br"],
  allowedAttributes: {},
  allowedSchemes: [],
}

export function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, OPTIONS)
}
```

### 3. `src/lib/strip-html.ts`

For preview contexts (role cards, line-clamped descriptions):

```ts
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}
```

## Modified Files

### Phase 1: Schemas & Actions

**`src/lib/schemas/production.ts`**
- Remove `.trim()` from description fields in `roleItemSchema` and `createProductionFormSchema` (HTML is editor-generated, not user-typed text)
- Add `description: z.string().optional().default("")` to `updateProductionFormSchema`
- It flows to `updateProductionActionSchema` via `.extend()`

**`src/lib/schemas/role.ts`**
- Remove `.trim()` from description in `createRoleFormSchema`, `updateRoleFormSchema`, `updateRoleActionSchema`

**`src/actions/productions/update-production.ts`**
- Add `description` to destructured `parsedInput`
- Add `description` to the `.set()` call

### Phase 2: Editor Component + Styles

**`src/components/common/rich-text-editor.tsx`** — New file (see above)

**`src/styles/globals.scss`** — Add `.prose-description` utility:
```scss
.prose-description {
  p + p { @apply mt-2; }
  strong { @apply font-semibold; }
  ul { @apply ml-4 list-disc; }
  ol { @apply ml-4 list-decimal; }
  li { @apply mt-1; }
}
```

### Phase 3: Forms

**`src/components/productions/create-production-form.tsx`**
- Import `RichTextEditor` instead of `Textarea`
- Line ~231: Replace production description `<Textarea>` with `<RichTextEditor>`
- Line ~419: Replace inline role description `<Textarea>` with `<RichTextEditor>`

**`src/components/productions/production-settings-form.tsx`**
- Add `currentDescription: string` to Props
- Add `description` to defaultValues
- Add `<RichTextEditor>` Controller block between name and location
- Include `description` in `hasChanges` check and `action.execute()` call

**`src/app/(app)/productions/[id]/(production)/settings/page.tsx`**
- Pass `currentDescription={production.description}` to `ProductionSettingsForm`

**`src/components/productions/role-settings-form.tsx`**
- Replace `<Textarea>` with `<RichTextEditor>` for description field

### Phase 4: Rendering on Submission Pages

**`src/app/s/[orgSlug]/[productionSlug]/page.tsx`**
- Production description (line 50-54): Replace `<p>` with `<div dangerouslySetInnerHTML={{ __html: sanitizeDescription(...) }} />`
- Role descriptions in cards (line 84-88): Use `stripHtml()` (compact preview context)

**`src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`**
- Role description (line 55-59): Replace `<p>` with `<div dangerouslySetInnerHTML>` + `sanitizeDescription()`

**`src/components/submissions/submission-form.tsx`**
- Line 363-366: Replace `{role.description}` with `{stripHtml(role.description)}` (line-clamped checkbox list)

**`src/app/(app)/productions/[id]/(production)/layout.tsx`**
- Pass sanitized HTML as ReactNode to PageHeader's `description` prop (PageHeader already handles ReactNode descriptions with a `<div>` wrapper)

## Subagents

- **Explore agent** — Already used for initial codebase exploration (completed)
- **Plan agent** — Already used for design (completed)
- **Code reviewer agent** — Spawn after implementation to review all changes
- **Librarian agent** — Spawn after implementation to update feature docs

## Verification

1. `bun run build` — Ensure no type errors
2. `bun run lint` — Ensure Biome is happy
3. Manual checks (tell user what to verify):
   - Create a new production with bold/italic/list description → verify it saves
   - Edit a production's description in settings → verify it persists
   - Edit a role's description → verify it persists
   - Visit the submission page `/s/[org]/[production]` → verify rich HTML renders
   - Visit the role submission page `/s/[org]/[production]/[role]` → verify rich HTML renders
   - Check role cards show plain text previews (no raw HTML tags)
