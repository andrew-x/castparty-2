# Design System & UI Copy Audit

## Critical
None

## Important
- **[/Users/andrew/conductor/workspaces/castparty/cheyenne/src/components/candidates/candidate-card.tsx:81]**: Arbitrary font size `text-[11px]` bypasses the typography scale. The closest design token is `text-caption` (0.75rem / 12px). — Use `text-caption` instead, or propose a new sub-caption token if 11px is intentionally distinct from 12px.
- **[/Users/andrew/conductor/workspaces/castparty/cheyenne/src/components/candidates/candidate-detail.tsx:127]**: Same arbitrary `text-[11px]` font size as above. — Use `text-caption` or propose a new token.

## Minor
- **[/Users/andrew/conductor/workspaces/castparty/cheyenne/src/app/not-found.tsx:15]**: Arbitrary font sizes `text-[10rem]` and `sm:text-[12rem]` for the decorative "404" text. No existing typography token covers this (the largest is `text-display` at 4.5rem). — Propose a `text-hero` or `text-404` token in `globals.scss` for the oversized decorative size, or accept this as a one-off decorative exception and document the decision.

## No Issues
The following checklist items passed with no findings:
- **Raw Tailwind colors** — No `bg-{color}-{shade}`, `text-{color}-{shade}`, `border-{color}-{shade}`, or `ring-{color}-{shade}` found in any target files.
- **Arbitrary color values** — No `bg-[#...]`, `text-[#...]`, `border-[#...]` anywhere.
- **Typography tokens in app/feature components** — All headings, body text, labels, and captions in `src/app/` and `src/components/!(common)/` use semantic tokens (`text-display`, `text-title`, `text-heading`, `text-body-lg`, `text-body`, `text-label`, `text-caption`). Raw Tailwind size classes (`text-sm`, `text-lg`, etc.) appear only inside `src/components/common/` as part of component-internal defaults.
- **Spacing tokens** — Application components and pages use `gap-section`, `gap-group`, `gap-block`, `gap-element`, `px-page`, `py-page`, `p-section` consistently. Raw gap/padding values in `src/app/` and `src/components/!(common)/` are limited to micro-spacing for icon+text alignment (`gap-1.5`, `gap-0.5`) where no semantic token applies.
- **Text color tokens** — All text uses `text-foreground`, `text-muted-foreground`, or semantic color tokens (`text-destructive`, `text-success-text`, `text-brand-light`). No raw color classes.
- **Icon-only buttons have `tooltip`** — Every `size="icon"` Button across the codebase includes a `tooltip` prop (or wrapped Tooltip for calendar day cells).
- **Button `leftSection`/`rightSection`** — All text+icon Buttons use the section props. No inline icon-as-child pattern found in feature components.
- **Component imports** — No direct imports from `@radix-ui`, `cmdk`, `sonner`, or other third-party UI packages in feature components or pages. All UI primitives come from `@/components/common/`. (Direct `lucide-react` icon imports are correct since there is no common wrapper for icons.)
- **No exclamation marks** in UI copy.
- **No emoji** in UI copy.
- **No em dashes in product copy** — Em dashes in rendered UI are limited to: (1) comparison-view null placeholders (a single `—` character for "no data," which is standard), and (2) HTML `<title>` metadata separators (`"Name — Castparty"`). In-code comments use em dashes as well but those are not user-facing. No em dashes appear in visible on-screen product copy.
- **Active voice, second person** — UI text follows the pattern ("You haven't...", not "No X have been..."). No passive constructions found.
- **Domain terminology** — No instances of "actor," "performer," "auditionee," or "talent" for candidate-side users. "Admin" and "manager" appear only in their correct contexts (org role names, "Stage Manager" placeholder, "agent or manager" for representation).
- **No "Oops"** or verbose confirmations ("successfully") found.
- **No anthropomorphization** of the product.
- **`cursor-pointer`** — Covered globally by the CSS rule in `globals.scss` for buttons and interactive ARIA roles, plus the Button CVA base class.
