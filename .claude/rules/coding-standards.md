# Coding Standards

## Developer Ergonomics First

Optimize for the developer reading the code, not just the machine executing it.
Maintainable, readable, and easy-to-work-with code is the default goal.
When brevity conflicts with clarity, choose clarity.

## Self-Documenting Code

Let naming, structure, and types communicate intent. Add comments only for:

- **Non-obvious logic** — e.g., a workaround for a library or browser quirk
- **Non-conventional patterns** — intentional deviation from the norm (explain why)
- **Especially complex algorithms or state machines**

Don't comment what the code clearly does. Comment *why* it does it.

## Trim whitespace on text input

All `z.string()` schemas that accept user text input (names, emails, descriptions,
titles) must include `.trim()` before validation rules like `.min()` or `.email()`.
This prevents storing values with leading/trailing whitespace.

```ts
// Correct — trim before validate
name: z.string().trim().min(1, "Name is required.").max(100)
email: z.string().trim().email("Enter a valid email.")
description: z.string().trim().optional()

// Wrong — whitespace passes validation
name: z.string().min(1, "Name is required.")
```

**Exceptions (do NOT trim):**
- Passwords — whitespace may be intentional
- IDs and tokens — these are not user-entered text
- Code/content fields where whitespace is semantically significant

## Use dayjs for all date/time work

Never use native `Date` objects or `new Date()`. Use `dayjs` for all date creation,
parsing, formatting, and comparison. Always import from the project wrapper — never
from `"dayjs"` directly — because the wrapper pre-loads required plugins:

```ts
// Correct — uses the project wrapper with plugins pre-loaded
import day from "@/lib/dayjs";

const now = day();
const formatted = day(someDate).format("LL");

// Wrong — native Date
const now = new Date();

// Wrong — imports dayjs directly, missing plugins
import dayjs from "dayjs";
```
