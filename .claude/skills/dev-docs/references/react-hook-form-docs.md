# react-hook-form — Documentation Index

Source: https://react-hook-form.com
Type: doc-site index (no llms.txt available — manually curated)
Added: 2026-03-04

Performant, flexible, and extensible form library for React. Uses uncontrolled
inputs by default for minimal re-renders. Provides hooks for form state management,
field arrays, controlled components, and validation.

## How to use this file

This is a page index, not documentation itself. Find the page that covers your
question, then `WebFetch` that URL with a focused extraction prompt.

---

## Getting Started

- [Get Started](https://react-hook-form.com/get-started): Installation, quick start, schema validation integration (Yup, Zod, Joi, etc.), React Native support, and basic usage patterns.

## API Reference — useForm

Top-level hook that returns all form methods and state.

- [useForm](https://react-hook-form.com/docs/useform): Core hook overview — configuration options (mode, defaultValues, resolver, criteriaMode, shouldFocusError, etc.) and returned methods/state.
- [register](https://react-hook-form.com/docs/useform/register): Register an input or select element and apply validation rules (required, min, max, pattern, validate, etc.).
- [unregister](https://react-hook-form.com/docs/useform/unregister): Unregister a single input or array of inputs after mounting. Useful for dynamically removed fields.
- [formState](https://react-hook-form.com/docs/useform/formstate): Reactive form state object — isDirty, isValid, isSubmitting, isSubmitSuccessful, errors, touchedFields, dirtyFields, submitCount, etc.
- [watch](https://react-hook-form.com/docs/useform/watch): Subscribe to input changes and re-render. Can watch all, specific, or multiple fields.
- [handleSubmit](https://react-hook-form.com/docs/useform/handlesubmit): Wraps a submit handler with validation. Receives form data on success; supports async handlers.
- [reset](https://react-hook-form.com/docs/useform/reset): Reset entire form state, field references, and subscriptions. Accepts optional new values and fine-grained reset options.
- [resetField](https://react-hook-form.com/docs/useform/resetfield): Reset an individual field's state (value, error, dirty/touched status) with fine-grained options.
- [setError](https://react-hook-form.com/docs/useform/seterror): Manually set one or more errors. Useful for server-side validation errors.
- [clearErrors](https://react-hook-form.com/docs/useform/clearerrors): Manually clear errors — all, specific field, or array of fields.
- [setValue](https://react-hook-form.com/docs/useform/setvalue): Programmatically set a registered field's value. Options to trigger validation and dirty state.
- [setFocus](https://react-hook-form.com/docs/useform/setfocus): Programmatically focus a registered input by name.
- [getValues](https://react-hook-form.com/docs/useform/getvalues): Read form values without triggering re-renders or subscribing to changes (unlike watch).
- [getFieldState](https://react-hook-form.com/docs/useform/getfieldstate): Get individual field state (isDirty, isTouched, invalid, error) in a type-safe way. Requires v7.25.0+.
- [trigger](https://react-hook-form.com/docs/useform/trigger): Manually trigger validation for the entire form or specific fields.
- [control](https://react-hook-form.com/docs/useform/control): Internal control object passed to Controller, useController, useWatch, and useFieldArray. Do not access its properties directly.
- [Form (beta)](https://react-hook-form.com/docs/useform/form): Optional Form component for progressive enhancement. Sends data as FormData (POST) by default; supports application/json via headers prop.

## API Reference — useController

Hook for building controlled input components with React Hook Form.

- [useController](https://react-hook-form.com/docs/usecontroller): Hook that powers controlled inputs — returns field props (value, onChange, onBlur, ref) and fieldState (error, isDirty, isTouched). Use one per component.
- [Controller](https://react-hook-form.com/docs/usecontroller/controller): Declarative wrapper component around useController. Renders controlled inputs via a render prop.

## API Reference — useFormContext

- [useFormContext](https://react-hook-form.com/docs/useformcontext): Access form methods in nested components without prop drilling. Requires FormProvider wrapper.
- [FormProvider](https://react-hook-form.com/docs/formprovider): Context provider component that wraps the form and passes all useForm methods to child components via useFormContext.

## API Reference — useFormState

- [useFormState](https://react-hook-form.com/docs/useformstate): Subscribe to form state at the hook level for optimized re-renders. Isolates re-rendering from the parent component.
- [ErrorMessage](https://react-hook-form.com/docs/useformstate/errormessage): Component to render a field's error message. Requires separate install: `@hookform/error-message`.

## API Reference — useWatch

- [useWatch](https://react-hook-form.com/docs/usewatch): Watch specified inputs and re-render at the hook level (better performance than form-level watch). Returns defaultValue on first render.

## API Reference — useFieldArray

- [useFieldArray](https://react-hook-form.com/docs/usefieldarray): Manage dynamic field arrays (append, prepend, insert, remove, swap, move, update, replace). Each instance must have a unique name.

## Guides

- [Advanced Usage](https://react-hook-form.com/advanced-usage): Accessible inputs, wizard/multi-step forms, smart form components, field arrays, error handling patterns, integrating with global state, and working with virtualized lists.
- [FAQs](https://react-hook-form.com/faqs): Common questions — watch vs. getValues, handling modals/tabs, class components, form reset, controlled vs. uncontrolled, performance tips.
- [TypeScript Support](https://react-hook-form.com/ts): Exported TypeScript types, generic type parameters for useForm, and type-safe form patterns.

## Tools

- [Form Builder](https://react-hook-form.com/form-builder): Visual GUI tool for generating forms with validation — produces code you can copy.
- [DevTools](https://react-hook-form.com/dev-tools): Browser devtools for inspecting form state. Install `@hookform/devtools` as a dev dependency.

## Resources

- [Articles](https://react-hook-form.com/resources/articles): Community articles on validation, Zod integration, testing, multi-step forms, etc.
- [Videos](https://react-hook-form.com/resources/videos): Tutorial videos covering basics, TypeScript, Material UI integration, useFieldArray, FormProvider, and more.
- [Newsletters](https://react-hook-form.com/resources/newsletters): Project newsletters and updates.
- [3rd Party Bindings](https://react-hook-form.com/resources/3rd-party-bindings): Community adapters and bindings for UI libraries and frameworks.
