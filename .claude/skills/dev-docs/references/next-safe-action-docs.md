# next-safe-action — Documentation Index

Source: https://next-safe-action.dev/docs
Type: doc-site index (no llms.txt available — manually curated from sitemap)
Added: 2026-02-27

This library provides type-safe Server Actions for Next.js with input/output
validation, middleware, and React hooks. Requires Next.js 14+, React 18.2+,
TypeScript 5+, and a Standard Schema-compatible validation library.

## How to use this file

This is a page index, not documentation itself. Find the page that covers your
question, then `WebFetch` that URL with a focused extraction prompt. Pages are
small — usually one concept each.

---

## Getting Started

- [Getting started](https://next-safe-action.dev/docs/getting-started): Installation, client setup, defining your first action, and executing it.

## Define Actions

- [Create the client](https://next-safe-action.dev/docs/define-actions/create-the-client): How to create a safe action client instance with initialization options like error handling, metadata schemas, and validation error formatting.
- [Instance methods](https://next-safe-action.dev/docs/define-actions/instance-methods): Methods on the client — `use()`, `metadata()`, `inputSchema()`, `outputSchema()`, `action()`, `stateAction()`.
- [Middleware](https://next-safe-action.dev/docs/define-actions/middleware): Composable middleware for authorization, logging, and other cross-cutting concerns at instance and action levels.
- [Validation errors](https://next-safe-action.dev/docs/define-actions/validation-errors): Customizing validation error format and creating custom validation errors with utility functions.
- [Action result object](https://next-safe-action.dev/docs/define-actions/action-result-object): Structure of action results — optional keys for data, validation errors, and server errors.
- [Action utils](https://next-safe-action.dev/docs/define-actions/action-utils): Server-side utilities — `throwServerError`, `throwValidationErrors`, and callbacks like `onSuccess()`, `onError()`, `onSettled()`.
- [Bind arguments](https://next-safe-action.dev/docs/define-actions/bind-arguments): Using `bindArgsSchemas` to pass additional arguments via Next.js `bind` method.
- [Extend previous schemas](https://next-safe-action.dev/docs/define-actions/extend-previous-schemas): Reusable action templates by progressively extending schemas through multiple `inputSchema()` calls.

## Execute Actions

- [Direct execution](https://next-safe-action.dev/docs/execute-actions/direct-execution): Simplest method — import and call actions directly in `onClick()` or `onSubmit()`.
- [useAction hook](https://next-safe-action.dev/docs/execute-actions/hooks/useaction): Hook that waits for action execution to finish, provides result and execution status.
- [useOptimisticAction hook](https://next-safe-action.dev/docs/execute-actions/hooks/useoptimisticaction): Hook for optimistic UI updates — reflects changes before server response.
- [useStateAction hook](https://next-safe-action.dev/docs/execute-actions/hooks/usestateaction): DEPRECATED in v8 — use React's native `useActionState()` instead.
- [Hook callbacks](https://next-safe-action.dev/docs/execute-actions/hooks/hook-callbacks): Optional callbacks (`onExecute`, `onSuccess`, `onError`) for custom logic based on execution status.

## Recipes

- [Form actions](https://next-safe-action.dev/docs/recipes/form-actions): Patterns for using safe actions with HTML forms.
- [File uploads](https://next-safe-action.dev/docs/recipes/upload-files): Handling file uploads through safe actions.
- [i18n](https://next-safe-action.dev/docs/recipes/i18n): Internationalization patterns with safe actions.
- [Playground](https://next-safe-action.dev/docs/recipes/playground): Interactive examples.

## Integrations

- [React Hook Form](https://next-safe-action.dev/docs/integrations/react-hook-form): Using next-safe-action with React Hook Form.

## Types

- [Infer types](https://next-safe-action.dev/docs/types/infer-types): Type inference utilities for action inputs, outputs, and results.

## Other

- [Troubleshooting](https://next-safe-action.dev/docs/troubleshooting): Common issues and solutions.
- [Migrations](https://next-safe-action.dev/docs/migrations/v7-to-v8): Latest migration guide (v7 to v8).
