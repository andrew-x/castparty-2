## Design System & UI Copy Audit

### Critical

- **[src/components/productions/roles-manager.tsx:145]**: Raw Tailwind colors used for the "Open" status badge: `bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400`. These bypass the design system entirely. — Replace with semantic token classes (e.g., `bg-success/10 text-success` or define a new `--color-success` token in `globals.scss` and use `bg-success-subtle text-success`).

- **[src/components/common/preview-link-buttons.tsx:40]**: Raw Tailwind color `text-green-600` for "copied" state. — Replace with a semantic token such as `text-success` (define token if needed).

- **[src/components/productions/email-templates-form.tsx:51]**: User-facing copy uses "performer" instead of the mandated "candidate": `"Sent automatically when a performer submits for a role in this production."` — Change to: `"Sent automatically when a candidate submits for a role in this production."`

- **[src/components/productions/email-templates-form.tsx:63]**: User-facing copy uses "performer" instead of "candidate": `"Sent when you select a performer for a role."` — Change to: `"Sent when you select a candidate for a role."`

### Important

- **[src/components/app/top-nav.tsx:109]**: Icon-only `Button` (hamburger menu) uses `sr-only` span instead of the `tooltip` prop. — Add `tooltip="Open menu"` to the Button.

- **[src/components/common/sidebar.tsx:263]**: Icon-only `Button` (sidebar trigger) uses `sr-only` span instead of the `tooltip` prop. — Add `tooltip="Toggle sidebar"` to the Button.

- **[src/components/app/top-nav.tsx:168]**: Arbitrary font-size value `text-[13.5px]` used in `NavLink`. — Replace with the nearest design token `text-label` (0.875rem / 14px) or propose a new token if 13.5px is intentional.

- **[src/components/common/sub-nav.tsx:94]**: Same arbitrary `text-[13.5px]` used in sub-nav links. — Replace with `text-label` or propose a token.

- **[src/components/organizations/org-switcher.tsx:95]**: Arbitrary font-size `text-[13px]` for the user name. — Replace with `text-label` (0.875rem).

- **[src/components/organizations/org-switcher.tsx:98]**: Arbitrary font-size `text-[11px]` for the org name. — Replace with `text-caption` (0.75rem / 12px) or propose a new token.

- **[src/components/productions/feedback-panel.tsx:68-71]**: Rating labels contain em dashes in user-facing UI copy (e.g., `"4 — Strong yes"`). The voice-and-tone rule says "No em dashes anywhere in product copy." — Replace em dashes with hyphens or en dashes: `"4 - Strong yes"`, or restructure as `"4: Strong yes"`.

- **[src/components/productions/feedback-form-preview.tsx:12-15]**: Same em dash issue in duplicate `RATING_LABELS` constant. — Same fix as above; ideally also deduplicate this constant to a single shared location.

- **[src/components/productions/reject-reason-dialog.tsx:138]**: Raw Tailwind typography `text-sm` instead of semantic token. — Replace with `text-label`.

- **[src/components/productions/roles-manager.tsx:128]**: Raw `text-sm` for role name in sidebar. — Replace with `text-label`.

- **[src/components/productions/email-templates-form.tsx:153]**: Raw `text-sm` for template name. — Replace with `text-label`.

- **[src/components/productions/email-templates-form.tsx:164]**: Raw `text-sm` for description text. — Replace with `text-label`.

- **[src/components/productions/consider-for-role-dialog.tsx:165]**: Raw `text-sm` for dialog item text. — Replace with `text-label`.

- **[src/components/productions/consider-for-role-dialog.tsx:221]**: Raw `text-sm` for empty state text. — Replace with `text-label`.

- **[src/components/auth/email-verification-banner.tsx:54]**: Raw `text-sm` for error message. — Replace with `text-label`.

- **[src/components/submissions/submission-form.tsx:360]**: Raw `text-sm` for role name in checkbox. — Replace with `text-label`.

- **[src/components/productions/consider-for-role-dialog.tsx:180]**: Raw `text-xs` for group heading. — Replace with `text-caption`.

### Minor

- **[src/components/organizations/pending-invites-button.tsx:29]**: Arbitrary font-size `text-[10px]` on the notification badge counter. — Replace with `text-caption` or propose a dedicated badge-counter token if 10px is intentional.

- **[src/components/productions/roles-manager.tsx:134]**: Arbitrary `text-[10px]` on "Archived" badge. — Replace with `text-caption` or propose a token.

- **[src/components/productions/roles-manager.tsx:143]**: Arbitrary `text-[10px]` on "Open"/"Closed" badge. — Replace with `text-caption` or propose a token.

- **[src/components/productions/email-templates-form.tsx:234,268]**: Raw `text-sm` used in highlight overlay (invisible text for alignment). — While invisible to users, these should still use `text-label` to stay in sync if the token value ever changes.

- **[src/components/common/calendar.tsx:93,102]**: Arbitrary `text-[0.8rem]` used in calendar weekday headers and day cells. — Replace with `text-caption` (0.75rem) or `text-label` (0.875rem), whichever is the closer match, or propose a token.
