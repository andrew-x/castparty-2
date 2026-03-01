---
globs: ["src/**/*.tsx", "src/**/*.jsx"]
---

# Voice & Tone (UI Copy)

## Voice

Castparty sounds like a competent friend who volunteers at your theatre. Friendly,
direct, never condescending, never corporate.

## Language Rules

**Plain language over jargon.** Use words people use in rehearsal rooms, not software
terms. "Add a performer" not "Create a talent record." "Audition slots" not
"Availability windows."

**Short and direct.** Button labels 1-3 words. Descriptions one sentence max. If you
need a paragraph to explain a feature, the feature might be too complicated.

**Active voice, second person.** "You haven't added any performers yet" not "No
performers have been added to this production."

**No exclamation marks** in the product UI. Marketing and emails can be warmer, but
the app stays calm.

**No emoji** in the product UI.

**No em dashes** anywhere in product copy.

**Don't anthropomorphize the product.** Castparty doesn't think, feel, or want things.

## Error & Confirmation Messages

Error messages say what happened and what to do next:
> "We couldn't save your changes. Check your connection and try again."

No "Oops!" and no error codes.

Confirmation messages are brief:
> "Changes saved."

Not "Your changes have been successfully saved."

## Domain Terminology

Use theatre terminology correctly. "Callback" not "second audition." "Cast list" not
"assignment roster." If you're unsure about a term, flag it rather than guessing.
Getting domain language wrong is the fastest way to lose credibility with this audience.

See `docs/PRODUCT.md` for the full ATS-to-casting terminology mapping.

## Consistent Role Nouns

Use these terms consistently across all screens:

| Role | Term | Don't use |
|------|------|-----------|
| Organizer-side users | **production team** | admins, managers, organizers |
| Talent-side users | **candidate** | actor, auditionee, talent, performer |

Don't alternate between synonyms across different screens.
