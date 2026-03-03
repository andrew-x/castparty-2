---
name: dev-docs
description: >
  Research and retrieve accurate, version-matched developer documentation for
  libraries, npm packages, frameworks, tools, APIs, and services. Invoke this skill
  whenever you need to look up how a library works, find the API for a specific
  function, check configuration options, understand a framework's conventions,
  verify what methods or props are available, or troubleshoot how to use a
  dependency. Call this skill instead of guessing. Trigger on prompts like
  "how do I use X", "what's the API for X", "look up the docs for X",
  "check the latest docs for X", "does X support Y", or any time you're about
  to write code using an unfamiliar or version-sensitive library.
---

# Developer Documentation Researcher

Your job is to return focused, version-accurate information -- not raw docs dumps.
The caller has a specific question; find the right passage and hand back exactly what
they need.

## Project Dependencies

Check `package.json` to see which versions of libraries this project uses. Run:

```bash
cat package.json | python3 -c "import json,sys; d=json.load(sys.stdin); deps={**d.get('dependencies',{}), **d.get('devDependencies',{})}; [print(f'{k}: {v}') for k,v in sorted(deps.items())]"
```

## Bundled Reference Docs

This project has bundled documentation indexes in `.agents/skills/dev-docs/references/`.
Check what's available:

```bash
ls .agents/skills/dev-docs/references/
```

### Available indexes

- **nextjs-llms.txt** -- Next.js 16 full docs index. This project uses the **App Router** -- stick to URLs under `/docs/app/` and ignore `/docs/pages/` unless asked.
- **shadcn-llms.txt** -- shadcn/ui component library docs index
- **better-auth-llms.txt** -- Better Auth authentication library docs index
- **drizzle-llms.txt** -- Drizzle ORM docs index
- **next-safe-action-docs.md** -- next-safe-action type-safe Server Actions library
- **tailwindcss-docs.md** -- Tailwind CSS v4 utility-first CSS framework

### Quick-link libraries

- **Day.js** -- `https://day.js.org/docs/en/installation/installation`
- **Biome** -- `https://biomejs.dev/guides/getting-started/`
- **Lucide React** -- `https://lucide.dev/guide/packages/lucide-react`

## Research Workflow

### Step 1: Confirm the version

Check `package.json` or the lock file for the exact installed version:

```bash
grep -A2 '"<package-name>@' bun.lock | head -5
```

### Step 2: Check bundled references first

Read the bundled index file, find the specific docs page URL that covers the question,
then fetch only that page. Bundled docs are preferred -- they're curated and version-verified.

### Step 3: Research from official sources (if needed)

If bundled docs don't cover the question, research in this order -- stop as soon as you
have enough to answer:

1. **Official documentation site** -- find the version-specific page
2. **npm registry** -- `https://www.npmjs.com/package/<name>`
3. **GitHub repository at the specific tag** -- `https://github.com/<org>/<repo>/tree/v<version>/docs`
4. **Community sources** (MDN, guides) -- verify against official sources

## Output Format

Return a tight, structured summary:

```
## <Library>@<exact-version> -- <question answered in one line>

**Source:** <URL>

### API

<Method signature, props, config key -- the exact syntax>

### Example

<working code example, 5-20 lines>

### Notes

- <Version-specific caveat, if any>
- <Breaking change relevant to this version, if any>
```

## What NOT to Do

- Don't paste entire documentation pages
- Don't invent API behavior -- if you can't find it, say so
- Don't document a different version than what the project uses
- Don't fetch more sources than needed
