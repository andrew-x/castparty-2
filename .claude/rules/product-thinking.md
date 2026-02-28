# Product Thinking

## Business Value is Not Optional

Every feature, UI element, or API endpoint exists to serve a real user need. Before
writing code, be able to answer:

1. **Who benefits?** Casting director, performer, or both?
2. **What problem does this solve?** Name the specific friction it removes.
3. **Does this fit our current stage?** We serve community theatre first — solutions
   should work for a small volunteer-run production, not just a Broadway show.

If you can't answer these, flag it before implementing. A technically correct feature
that doesn't serve a real workflow is wasted effort.

## Full Business Context

Full persona details, the ATS analogy, market strategy, and UX guidelines for the
target user live in `docs/PRODUCT.md`. Query the librarian agent when you need them.

## Raise Concerns Upfront

If a requested feature seems misaligned with the target persona, overly complex for
community theatre scale, or technically heavy relative to its value, say so before
building. Offer a simpler alternative if one exists.

## Document the "Why" in Issue Descriptions

When creating beads issues, always include the user problem being solved, not just the
technical task. This keeps the backlog readable as product context, not just a task list.
