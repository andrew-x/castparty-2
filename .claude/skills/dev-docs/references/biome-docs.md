# Biome — Documentation Index

Source: https://biomejs.dev
Type: doc-site index (no llms.txt available — manually curated from sitemap)
Added: 2026-03-04

Biome is a fast linter, formatter, and code assistant for JavaScript, TypeScript,
JSX, JSON, CSS, and more. It replaces ESLint + Prettier with a single unified
toolchain. This project uses Biome v2.4.4.

## How to use this file

This is a page index, not documentation itself. Find the page that covers your
question, then `WebFetch` that URL with a focused extraction prompt. For linter
rules, each rule page documents the rule's purpose, examples of valid/invalid
code, and configuration options.

---

## Getting Started & Guides

- [Getting started](https://biomejs.dev/guides/getting-started/): Installation, first run, and basic CLI usage for formatting and linting.
- [Configure Biome](https://biomejs.dev/guides/configure-biome/): How biome.json/biome.jsonc works — file structure, extends, overrides, and per-tool config.
- [Manual installation](https://biomejs.dev/guides/manual-installation/): Installing Biome without the init command, platform-specific binaries.
- [Big projects](https://biomejs.dev/guides/big-projects/): Tips for using Biome in large monorepos and multi-package projects.
- [Integrate in VCS](https://biomejs.dev/guides/integrate-in-vcs/): Git integration — using Biome with pre-commit hooks and CI.
- [Migrate from ESLint & Prettier](https://biomejs.dev/guides/migrate-eslint-prettier/): Step-by-step migration guide from ESLint/Prettier to Biome.
- [Upgrade to Biome v2](https://biomejs.dev/guides/upgrade-to-biome-v2/): Migration guide from Biome v1 to v2, covering breaking changes.
- [Investigate slowness](https://biomejs.dev/guides/investigate-slowness/): Diagnosing and fixing performance issues with Biome.

## Editor Integration

- [First-party extensions](https://biomejs.dev/guides/editors/first-party-extensions/): Official VS Code and other editor extensions for Biome.
- [Third-party extensions](https://biomejs.dev/guides/editors/third-party-extensions/): Community-maintained editor plugins.
- [Create an extension](https://biomejs.dev/guides/editors/create-an-extension/): Building a custom editor extension for Biome.

## Formatter

- [Formatter overview](https://biomejs.dev/formatter/): How the Biome formatter works — supported languages, enabling/disabling, ignore patterns.
- [Differences with Prettier](https://biomejs.dev/formatter/differences-with-prettier/): Detailed comparison of Biome formatter output vs Prettier, including intentional divergences.
- [Option philosophy](https://biomejs.dev/formatter/option-philosophy/): Why Biome limits formatting options and its design philosophy on code style choices.

## Linter

- [Linter overview](https://biomejs.dev/linter/): How the linter works — enabling rules, severity levels, recommended rules, and configuration.
- [Domains](https://biomejs.dev/linter/domains/): Domain-based rule grouping (react, next, typescript, etc.) — how to enable/disable rule sets by domain.
- [Plugins](https://biomejs.dev/linter/plugins/): GritQL-based linter plugin system for writing custom lint rules.
- [Rules & sources mapping](https://biomejs.dev/linter/rules-sources/): Maps Biome lint rules to their ESLint equivalents and other source linters.

### Linter — Rules by Language

- [JavaScript rules](https://biomejs.dev/linter/javascript/rules/): All lint rules applicable to JavaScript and TypeScript files.
- [JavaScript rule sources](https://biomejs.dev/linter/javascript/sources/): ESLint and TypeScript-ESLint rule equivalence mapping for JS/TS rules.
- [CSS rules](https://biomejs.dev/linter/css/rules/): All lint rules applicable to CSS files.
- [CSS rule sources](https://biomejs.dev/linter/css/sources/): Stylelint rule equivalence mapping for CSS rules.
- [JSON rules](https://biomejs.dev/linter/json/rules/): Lint rules for JSON files.
- [JSON rule sources](https://biomejs.dev/linter/json/sources/): Source mapping for JSON lint rules.
- [GraphQL rules](https://biomejs.dev/linter/graphql/rules/): Lint rules for GraphQL files.
- [HTML rules](https://biomejs.dev/linter/html/rules/): Lint rules for HTML files.

### Linter — Individual Rules (JavaScript / TypeScript / React / Next.js)

Each rule page documents: what the rule catches, valid/invalid code examples, auto-fix
availability, and configuration options. Only rules relevant to this project's stack
(JS, TS, React, Next.js, accessibility) are listed below. Visit the full rules-by-language
pages above for the complete list.

#### Correctness — Catch bugs

- [noChildrenProp](https://biomejs.dev/linter/rules/no-children-prop/): Disallow passing children as a prop in JSX.
- [noConstAssign](https://biomejs.dev/linter/rules/no-const-assign/): Disallow reassigning const variables.
- [noDangerouslySetInnerHtml](https://biomejs.dev/linter/rules/no-dangerously-set-inner-html/): Warn on dangerouslySetInnerHTML usage.
- [noDangerouslySetInnerHtmlWithChildren](https://biomejs.dev/linter/rules/no-dangerously-set-inner-html-with-children/): Disallow combining dangerouslySetInnerHTML with children.
- [noFloatingPromises](https://biomejs.dev/linter/rules/no-floating-promises/): Require promises to be awaited or explicitly handled.
- [noMisusedPromises](https://biomejs.dev/linter/rules/no-misused-promises/): Detect promises used in incorrect contexts (e.g., conditionals).
- [noNestedComponentDefinitions](https://biomejs.dev/linter/rules/no-nested-component-definitions/): Disallow defining React components inside other components.
- [noRenderReturnValue](https://biomejs.dev/linter/rules/no-render-return-value/): Disallow using the return value of ReactDOM.render.
- [noUnreachable](https://biomejs.dev/linter/rules/no-unreachable/): Disallow unreachable code after return, throw, break, or continue.
- [noUnusedImports](https://biomejs.dev/linter/rules/no-unused-imports/): Remove unused import statements (auto-fixable).
- [noUnusedVariables](https://biomejs.dev/linter/rules/no-unused-variables/): Detect declared but unused variables.
- [useExhaustiveDependencies](https://biomejs.dev/linter/rules/use-exhaustive-dependencies/): Enforce exhaustive deps array in React hooks (useEffect, useMemo, etc.).
- [useHookAtTopLevel](https://biomejs.dev/linter/rules/use-hook-at-top-level/): Enforce Rules of Hooks — hooks must be called at top level.
- [useJsxKeyInIterable](https://biomejs.dev/linter/rules/use-jsx-key-in-iterable/): Require key prop on elements in iterables (map, forEach, etc.).
- [useValidTypeof](https://biomejs.dev/linter/rules/use-valid-typeof/): Require typeof comparisons use valid string literals.
- [useIsNan](https://biomejs.dev/linter/rules/use-is-nan/): Require Number.isNaN() instead of comparison with NaN.
- [noConstantCondition](https://biomejs.dev/linter/rules/no-constant-condition/): Disallow constant expressions in conditions.
- [noUnsafeOptionalChaining](https://biomejs.dev/linter/rules/no-unsafe-optional-chaining/): Disallow unsafe optional chaining in arithmetic/comparison contexts.
- [noImportAssign](https://biomejs.dev/linter/rules/no-import-assign/): Disallow reassigning imported bindings.

#### Style — Code consistency

- [noVar](https://biomejs.dev/linter/rules/no-var/): Require let or const instead of var.
- [useConst](https://biomejs.dev/linter/rules/use-const/): Prefer const for variables that are never reassigned.
- [useImportType](https://biomejs.dev/linter/rules/use-import-type/): Enforce `import type` for type-only imports in TypeScript.
- [useExportType](https://biomejs.dev/linter/rules/use-export-type/): Enforce `export type` for type-only exports in TypeScript.
- [useTemplate](https://biomejs.dev/linter/rules/use-template/): Prefer template literals over string concatenation.
- [useSelfClosingElements](https://biomejs.dev/linter/rules/use-self-closing-elements/): Enforce self-closing tags for void elements and empty JSX.
- [useFragmentSyntax](https://biomejs.dev/linter/rules/use-fragment-syntax/): Prefer `<>...</>` shorthand over `<React.Fragment>`.
- [useOptionalChain](https://biomejs.dev/linter/rules/use-optional-chain/): Prefer optional chaining (?.) over && chains.
- [useNullishCoalescing](https://biomejs.dev/linter/rules/use-nullish-coalescing/): Prefer ?? over || for nullish defaults.
- [useConsistentArrayType](https://biomejs.dev/linter/rules/use-consistent-array-type/): Enforce consistent array type syntax (Array<T> vs T[]).
- [useConsistentTypeDefinitions](https://biomejs.dev/linter/rules/use-consistent-type-definitions/): Enforce consistent type vs interface usage.
- [useNamingConvention](https://biomejs.dev/linter/rules/use-naming-convention/): Enforce naming conventions for variables, functions, classes, types, etc.
- [useFilenamingConvention](https://biomejs.dev/linter/rules/use-filenaming-convention/): Enforce file naming conventions (camelCase, kebab-case, etc.).
- [noDefaultExport](https://biomejs.dev/linter/rules/no-default-export/): Disallow default exports (prefer named exports).
- [useArrowFunction](https://biomejs.dev/linter/rules/use-arrow-function/): Prefer arrow functions over function expressions.
- [useShorthandFunctionType](https://biomejs.dev/linter/rules/use-shorthand-function-type/): Prefer shorthand function type syntax in TypeScript.

#### Suspicious — Detect likely mistakes

- [noExplicitAny](https://biomejs.dev/linter/rules/no-explicit-any/): Disallow explicit `any` type in TypeScript.
- [noDoubleEquals](https://biomejs.dev/linter/rules/no-double-equals/): Require === and !== instead of == and !=.
- [noDebugger](https://biomejs.dev/linter/rules/no-debugger/): Disallow the debugger statement.
- [noConsole](https://biomejs.dev/linter/rules/no-console/): Disallow console.* calls.
- [noDuplicateJsxProps](https://biomejs.dev/linter/rules/no-duplicate-jsx-props/): Disallow duplicate props in JSX elements.
- [noDuplicateObjectKeys](https://biomejs.dev/linter/rules/no-duplicate-object-keys/): Disallow duplicate keys in object literals.
- [noDuplicateCase](https://biomejs.dev/linter/rules/no-duplicate-case/): Disallow duplicate case labels in switch statements.
- [noShadow](https://biomejs.dev/linter/rules/no-shadow/): Disallow variable declarations that shadow variables in outer scopes.
- [noRedeclare](https://biomejs.dev/linter/rules/no-redeclare/): Disallow redeclaring variables in the same scope.
- [noAsyncPromiseExecutor](https://biomejs.dev/linter/rules/no-async-promise-executor/): Disallow async functions as Promise executor.
- [noSuspiciousSemicolonInJsx](https://biomejs.dev/linter/rules/no-suspicious-semicolon-in-jsx/): Detect misplaced semicolons in JSX (often a typo).
- [noReactPropAssignments](https://biomejs.dev/linter/rules/no-react-prop-assignments/): Disallow direct mutation of React props.

#### Accessibility (a11y)

- [useAltText](https://biomejs.dev/linter/rules/use-alt-text/): Require alt attribute on img, area, input[type=image], and object.
- [useAnchorContent](https://biomejs.dev/linter/rules/use-anchor-content/): Require anchor elements have content.
- [useButtonType](https://biomejs.dev/linter/rules/use-button-type/): Require explicit type attribute on button elements.
- [useValidAnchor](https://biomejs.dev/linter/rules/use-valid-anchor/): Enforce valid anchor element usage (href, onClick).
- [useValidAriaProps](https://biomejs.dev/linter/rules/use-valid-aria-props/): Ensure ARIA attributes are valid.
- [useValidAriaRole](https://biomejs.dev/linter/rules/use-valid-aria-role/): Ensure role attribute values are valid ARIA roles.
- [useValidAriaValues](https://biomejs.dev/linter/rules/use-valid-aria-values/): Ensure ARIA attribute values are correct.
- [noAriaHiddenOnFocusable](https://biomejs.dev/linter/rules/no-aria-hidden-on-focusable/): Disallow aria-hidden on focusable elements.
- [useHeadingContent](https://biomejs.dev/linter/rules/use-heading-content/): Require heading elements (h1-h6) have content.
- [useHtmlLang](https://biomejs.dev/linter/rules/use-html-lang/): Require lang attribute on the html element.
- [useMediaCaption](https://biomejs.dev/linter/rules/use-media-caption/): Require captions for audio/video elements.
- [useKeyWithClickEvents](https://biomejs.dev/linter/rules/use-key-with-click-events/): Require keyboard event handlers alongside onClick.
- [noAccessKey](https://biomejs.dev/linter/rules/no-access-key/): Disallow the accessKey attribute (poor accessibility).
- [noPositiveTabindex](https://biomejs.dev/linter/rules/no-positive-tabindex/): Disallow positive tabindex values.
- [noRedundantRoles](https://biomejs.dev/linter/rules/no-redundant-roles/): Disallow redundant ARIA roles already implied by the element.
- [useFocusableInteractive](https://biomejs.dev/linter/rules/use-focusable-interactive/): Require interactive ARIA role elements to be focusable.

#### Next.js-Specific Rules

- [noBeforeInteractiveScriptOutsideDocument](https://biomejs.dev/linter/rules/no-before-interactive-script-outside-document/): Disallow beforeInteractive strategy for next/script outside _document.
- [noDocumentImportInPage](https://biomejs.dev/linter/rules/no-document-import-in-page/): Disallow importing next/document outside _document.
- [noHeadElement](https://biomejs.dev/linter/rules/no-head-element/): Use next/head instead of a native head element.
- [noHeadImportInDocument](https://biomejs.dev/linter/rules/no-head-import-in-document/): Disallow importing next/head inside _document.
- [noImgElement](https://biomejs.dev/linter/rules/no-img-element/): Use next/image instead of the native img element.
- [useNextAsyncClientComponent](https://biomejs.dev/linter/rules/no-next-async-client-component/): Disallow async client components in Next.js App Router.
- [useGoogleFontDisplay](https://biomejs.dev/linter/rules/use-google-font-display/): Require font-display property for Google Fonts.
- [useGoogleFontPreconnect](https://biomejs.dev/linter/rules/use-google-font-preconnect/): Require preconnect for Google Font requests.
- [useInlineScriptId](https://biomejs.dev/linter/rules/use-inline-script-id/): Require id attribute on next/script with inline content.

#### Performance

- [noAccumulatingSpread](https://biomejs.dev/linter/rules/no-accumulating-spread/): Warn against spreading in a loop (O(n^2) performance).
- [noBarrelFile](https://biomejs.dev/linter/rules/no-barrel-file/): Disallow barrel files (index.ts re-exporting everything).
- [noReExportAll](https://biomejs.dev/linter/rules/no-re-export-all/): Disallow `export * from` — prefer named re-exports.
- [noDelete](https://biomejs.dev/linter/rules/no-delete/): Disallow the delete operator (deoptimizes objects).

#### TypeScript-Specific

- [noNonNullAssertion](https://biomejs.dev/linter/rules/no-non-null-assertion/): Disallow non-null assertion operator (!).
- [noInferrableTypes](https://biomejs.dev/linter/rules/no-inferrable-types/): Disallow explicit types where TypeScript can infer them.
- [noUnsafeDeclarationMerging](https://biomejs.dev/linter/rules/no-unsafe-declaration-merging/): Disallow unsafe declaration merging between classes and interfaces.
- [noEmptyInterface](https://biomejs.dev/linter/rules/no-empty-interface/): Disallow empty interfaces (use type alias or omit).
- [noEmptyTypeParameters](https://biomejs.dev/linter/rules/no-empty-type-parameters/): Disallow empty type parameter lists.
- [useEnumInitializers](https://biomejs.dev/linter/rules/use-enum-initializers/): Require explicit values for enum members.
- [noConfusingVoidType](https://biomejs.dev/linter/rules/no-confusing-void-type/): Disallow void type in confusing positions.
- [noNamespace](https://biomejs.dev/linter/rules/no-namespace/): Disallow TypeScript namespaces (prefer modules).

## Assist (Code Actions)

- [Assist overview](https://biomejs.dev/assist/): Code actions and auto-fixes — organize imports, sort properties, and more.
- [organizeImports](https://biomejs.dev/assist/actions/organize-imports/): Automatically sort and group import statements.
- [useSortedAttributes](https://biomejs.dev/assist/actions/use-sorted-attributes/): Sort JSX/HTML attributes alphabetically.
- [useSortedKeys](https://biomejs.dev/assist/actions/use-sorted-keys/): Sort object keys alphabetically.
- [useSortedProperties](https://biomejs.dev/assist/actions/use-sorted-properties/): Sort CSS properties alphabetically.
- [useSortedInterfaceMembers](https://biomejs.dev/assist/actions/use-sorted-interface-members/): Sort TypeScript interface members alphabetically.
- [noDuplicateClasses](https://biomejs.dev/assist/actions/no-duplicate-classes/): Remove duplicate CSS classes in class attributes.

## Analyzer

- [Suppressions](https://biomejs.dev/analyzer/suppressions/): How to suppress diagnostics with `// biome-ignore` comments.

## Reference

- [CLI reference](https://biomejs.dev/reference/cli/): All CLI commands (check, format, lint, ci, migrate) with flags and options.
- [Configuration reference](https://biomejs.dev/reference/configuration/): Complete biome.json schema — all formatter, linter, assist, files, and override options.
- [Diagnostics](https://biomejs.dev/reference/diagnostics/): Understanding Biome diagnostic output — severity levels, error codes, and formatting.
- [Environment variables](https://biomejs.dev/reference/environment-variables/): Environment variables that control Biome behavior (BIOME_LOG_DIR, etc.).
- [GritQL reference](https://biomejs.dev/reference/gritql/): GritQL query language for writing custom lint rules and code transforms.
- [Reporters](https://biomejs.dev/reference/reporters/): Output reporter formats (default, JSON, GitHub, GitLab, etc.).
- [VS Code extension](https://biomejs.dev/reference/vscode/): VS Code extension settings and commands reference.
- [Zed extension](https://biomejs.dev/reference/zed/): Zed editor extension settings reference.

## Recipes (Integration Guides)

- [Continuous integration](https://biomejs.dev/recipes/continuous-integration/): Setting up Biome in CI pipelines (GitHub Actions, GitLab CI, etc.).
- [Git hooks](https://biomejs.dev/recipes/git-hooks/): Running Biome as a pre-commit hook with Husky, lint-staged, or lefthook.
- [Renovate](https://biomejs.dev/recipes/renovate/): Configuring Renovate to auto-update Biome.
- [Badges](https://biomejs.dev/recipes/badges/): Adding Biome badges to your README.

## Internals

- [Philosophy](https://biomejs.dev/internals/philosophy/): Biome's design philosophy and goals.
- [Architecture](https://biomejs.dev/internals/architecture/): How Biome works internally — parser, analyzer, formatter pipeline.
- [Language support](https://biomejs.dev/internals/language-support/): Which languages and file types Biome supports and to what extent.
- [Versioning](https://biomejs.dev/internals/versioning/): Biome's versioning and stability policy.
- [Changelog](https://biomejs.dev/internals/changelog/): Full release changelog.
