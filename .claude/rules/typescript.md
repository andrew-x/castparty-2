---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Conventions

## Prefer `interface` over `type`

Use `interface` for object shapes, component props, and API contracts.
Use `type` only when `interface` cannot express it:
- Union types: `type Status = "active" | "inactive"`
- Intersection types built from non-object shapes
- Mapped types and conditional types

## No `any`

Use `unknown` when the type is genuinely unknown, then narrow with guards.
`any` disables type checking — avoid it entirely.
