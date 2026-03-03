# Design System: Friendlier Border Radius + cursor-pointer Fix

## Context

The current base border radius (`--radius: 0.25rem` / 4px) feels sharp and corporate. Increasing it will give the app a friendlier, more approachable feel — fitting for community theatre users. Additionally, several interactive components in the design system are missing `cursor: pointer`, making them feel unresponsive (the dialog X button being the most visible example).

## Changes

### 1. Increase base border radius

**File:** `src/styles/globals.scss` (line 8)

Change `--radius: 0.25rem` to `--radius: 0.5rem` (8px).

This cascades through all calculated variants:

| Token | Before (4px base) | After (8px base) |
|-------|-------------------|-------------------|
| `--radius-sm` | 0px | 4px |
| `--radius-md` | 2px | 6px |
| `--radius-lg` | 4px | 8px |
| `--radius-xl` | 8px | 12px |
| `--radius-2xl` | 12px | 16px |

No component files need to change — they all reference the tokens.

### 2. Global cursor-pointer for all interactive elements

**File:** `src/styles/globals.scss` — add a rule after the `:root` block (after line 41)

```css
/* Interactive elements should always show pointer cursor */
button:not(:disabled),
[role="checkbox"]:not(:disabled),
[role="radio"]:not(:disabled),
[role="switch"]:not(:disabled),
[role="tab"]:not(:disabled),
[role="menuitem"],
[role="menuitemcheckbox"],
[role="menuitemradio"],
[role="option"],
[role="combobox"],
summary:not(:disabled) {
  cursor: pointer;
}
```

This fixes cursor-pointer globally for:
- **Dialog/Sheet close buttons** (render as `<button>`)
- **Checkbox** (renders as `<button role="checkbox">`)
- **Switch** (renders as `<button role="switch">`)
- **Radio group items** (render as `<button role="radio">`)
- **Toggle / ToggleGroup items** (render as `<button>`)
- **Navigation menu triggers** (render as `<button>`)
- **Dropdown/combobox items** (render with role attributes)

The `:not(:disabled)` selector ensures disabled elements still show `cursor-not-allowed` via their Tailwind utilities. Future components automatically get cursor-pointer without needing to add it per-component.

## Files modified

1. `src/styles/globals.scss` — 2 edits (radius value + global cursor rule)

No component files need changes.

## Verification

1. Run `bun run build` to confirm no build errors
2. Manually check in browser:
   - Buttons, inputs, cards, dialogs all show increased border radius
   - Dialog X close button shows pointer cursor on hover
   - Checkbox, switch, radio all show pointer cursor
   - Disabled variants still show `not-allowed` cursor
