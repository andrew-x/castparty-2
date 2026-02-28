# Tailwind CSS — Documentation Index

Source: https://tailwindcss.com/docs
Type: doc-site index (no llms.txt available — manually curated from sitemap)
Added: 2026-02-27

Tailwind CSS is a utility-first CSS framework. Version 4 is a major rewrite: there is no
`tailwind.config.js` — configuration is CSS-first via the `@theme` directive, and the
framework is imported with `@import "tailwindcss"` rather than the old `@tailwind` directives.
Browser targets are modern (Safari 16.4+, Chrome 111+, Firefox 128+).

## How to use this file

This is a page index, not documentation itself. Find the page that covers your
question, then `WebFetch` that URL with a focused extraction prompt.

---

## Getting Started

- [Installation — Using Vite](https://tailwindcss.com/docs/installation/using-vite): Installing Tailwind CSS v4 as a Vite plugin via `@tailwindcss/vite`.
- [Installation — Using PostCSS](https://tailwindcss.com/docs/installation/using-postcss): Installing Tailwind CSS as a PostCSS plugin for build pipelines that use PostCSS.
- [Installation — Tailwind CLI](https://tailwindcss.com/docs/installation/tailwind-cli): Installing and running Tailwind CSS via the standalone CLI tool (no Node build pipeline needed).
- [Installation — Framework Guides](https://tailwindcss.com/docs/installation/framework-guides): Index of framework-specific installation guides (Next.js, Nuxt, SvelteKit, Laravel, Angular, Astro, and more).
- [Installation — Play CDN](https://tailwindcss.com/docs/installation/play-cdn): Using the Tailwind CSS CDN script tag to try Tailwind directly in the browser with no build step.
- [Editor Setup](https://tailwindcss.com/docs/editor-setup): Setting up IntelliSense, Prettier class-sorting plugin, and IDE integrations for VS Code, Cursor, Zed, and JetBrains.
- [Compatibility](https://tailwindcss.com/docs/compatibility): Browser support requirements for v4 and why CSS preprocessors (Sass, Less, Stylus) are not supported.
- [Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide): Comprehensive v3 → v4 migration guide covering the automated `@tailwindcss/upgrade` tool and 30+ breaking changes.

## Framework Guides

- [Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs): Step-by-step Tailwind CSS installation for Next.js projects.
- [Laravel](https://tailwindcss.com/docs/installation/framework-guides/laravel/vite): Tailwind CSS installation for Laravel projects using Vite.
- [Nuxt](https://tailwindcss.com/docs/installation/framework-guides/nuxt): Tailwind CSS installation for Nuxt (Vue) projects.
- [SolidJS](https://tailwindcss.com/docs/installation/framework-guides/solidjs): Tailwind CSS installation for SolidJS projects.
- [SvelteKit](https://tailwindcss.com/docs/installation/framework-guides/sveltekit): Tailwind CSS installation for SvelteKit projects.
- [Gatsby](https://tailwindcss.com/docs/installation/framework-guides/gatsby): Tailwind CSS installation for Gatsby projects.
- [Angular](https://tailwindcss.com/docs/installation/framework-guides/angular): Tailwind CSS installation for Angular projects.
- [Ruby on Rails](https://tailwindcss.com/docs/installation/framework-guides/ruby-on-rails): Tailwind CSS installation for Ruby on Rails projects.
- [React Router](https://tailwindcss.com/docs/installation/framework-guides/react-router): Tailwind CSS installation for React Router projects.
- [TanStack Start](https://tailwindcss.com/docs/installation/framework-guides/tanstack-start): Tailwind CSS installation for TanStack Start projects.
- [Astro](https://tailwindcss.com/docs/installation/framework-guides/astro): Tailwind CSS installation for Astro projects.
- [Qwik](https://tailwindcss.com/docs/installation/framework-guides/qwik): Tailwind CSS installation for Qwik projects.

## Core Concepts

- [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes): How the utility-first workflow works — composing small, single-purpose classes directly in HTML instead of writing custom CSS.
- [Hover, focus, and other states](https://tailwindcss.com/docs/hover-focus-and-other-states): Using variant prefixes (`hover:`, `focus:`, `active:`, `disabled:`, `group-*`, `peer-*`, etc.) to style elements conditionally.
- [Responsive design](https://tailwindcss.com/docs/responsive-design): Applying utility classes at specific breakpoints with responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).
- [Dark mode](https://tailwindcss.com/docs/dark-mode): Styling for dark mode with the `dark:` variant using media query or class-based strategies.
- [Theme variables](https://tailwindcss.com/docs/theme): Defining design tokens with the v4 `@theme` CSS directive — replaces `tailwind.config.js` theme configuration.
- [Colors](https://tailwindcss.com/docs/colors): Built-in color palette (11 shades per color, 50–950) and customizing the color scheme via `@theme` CSS variables.
- [Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles): Adding one-off styles with arbitrary values `[]`, extending the theme with `@theme`, and writing custom CSS with `@layer`, `@utility`, and `@custom-variant`.
- [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files): How Tailwind scans source files for class names, why dynamic class construction breaks detection, and using `@source` to register additional paths or safelist utilities.
- [Functions and directives](https://tailwindcss.com/docs/functions-and-directives): Reference for all Tailwind CSS directives (`@import`, `@theme`, `@source`, `@utility`, `@variant`, `@custom-variant`, `@apply`, `@reference`, `@config`, `@plugin`) and CSS functions (`--alpha()`, `--spacing()`).

## Base Styles

- [Preflight](https://tailwindcss.com/docs/preflight): Tailwind's opinionated base reset that normalizes cross-browser inconsistencies — removes default margins, resets borders, unsets heading/list styles, and makes images block-level.

## Layout

- [aspect-ratio](https://tailwindcss.com/docs/aspect-ratio): Utility classes for controlling an element's aspect ratio.
- [columns](https://tailwindcss.com/docs/columns): Utility classes for setting the number of CSS columns in a multi-column layout.
- [break-after](https://tailwindcss.com/docs/break-after): Utility classes for controlling page/column breaks after an element.
- [break-before](https://tailwindcss.com/docs/break-before): Utility classes for controlling page/column breaks before an element.
- [break-inside](https://tailwindcss.com/docs/break-inside): Utility classes for controlling whether page/column breaks can occur inside an element.
- [box-decoration-break](https://tailwindcss.com/docs/box-decoration-break): Utility classes for controlling how element box decorations render across multiple lines or columns.
- [box-sizing](https://tailwindcss.com/docs/box-sizing): Utility classes for setting whether element dimensions include or exclude padding and borders.
- [display](https://tailwindcss.com/docs/display): Utility classes for controlling the display type of an element (block, inline, flex, grid, hidden, etc.).
- [float](https://tailwindcss.com/docs/float): Utility classes for floating elements to the left or right of their container.
- [clear](https://tailwindcss.com/docs/clear): Utility classes for controlling how an element interacts with preceding floated elements.
- [isolation](https://tailwindcss.com/docs/isolation): Utility classes for creating a new stacking context to isolate elements from blending effects.
- [object-fit](https://tailwindcss.com/docs/object-fit): Utility classes for controlling how replaced content (images, video) is resized within its container.
- [object-position](https://tailwindcss.com/docs/object-position): Utility classes for controlling the alignment of replaced content within its container.
- [overflow](https://tailwindcss.com/docs/overflow): Utility classes for controlling how content that overflows an element's bounds is handled.
- [overscroll-behavior](https://tailwindcss.com/docs/overscroll-behavior): Utility classes for controlling what happens when a scroll region boundary is reached.
- [position](https://tailwindcss.com/docs/position): Utility classes for setting element positioning context (static, relative, absolute, fixed, sticky).
- [top / right / bottom / left](https://tailwindcss.com/docs/top-right-bottom-left): Utility classes for setting the placement of positioned elements using inset properties.
- [visibility](https://tailwindcss.com/docs/visibility): Utility classes for toggling element visibility while preserving layout space.
- [z-index](https://tailwindcss.com/docs/z-index): Utility classes for controlling the stacking order of positioned elements.

## Flexbox & Grid

- [flex-basis](https://tailwindcss.com/docs/flex-basis): Utility classes for setting the initial size of a flex item before flex grow/shrink is applied.
- [flex-direction](https://tailwindcss.com/docs/flex-direction): Utility classes for controlling the direction flex items are placed in a flex container.
- [flex-wrap](https://tailwindcss.com/docs/flex-wrap): Utility classes for controlling whether flex items wrap onto multiple lines.
- [flex](https://tailwindcss.com/docs/flex): Shorthand utility classes for controlling how flex items grow and shrink (`flex-1`, `flex-auto`, `flex-none`).
- [flex-grow](https://tailwindcss.com/docs/flex-grow): Utility classes for controlling how much a flex item grows relative to its siblings.
- [flex-shrink](https://tailwindcss.com/docs/flex-shrink): Utility classes for controlling how much a flex item shrinks relative to its siblings.
- [order](https://tailwindcss.com/docs/order): Utility classes for controlling the display order of flex and grid items.
- [grid-template-columns](https://tailwindcss.com/docs/grid-template-columns): Utility classes for defining column tracks in a grid layout.
- [grid-column](https://tailwindcss.com/docs/grid-column): Utility classes for controlling how grid items span and are placed across columns.
- [grid-template-rows](https://tailwindcss.com/docs/grid-template-rows): Utility classes for defining row tracks in a grid layout.
- [grid-row](https://tailwindcss.com/docs/grid-row): Utility classes for controlling how grid items span and are placed across rows.
- [grid-auto-flow](https://tailwindcss.com/docs/grid-auto-flow): Utility classes for controlling how auto-placed grid items are inserted into the grid.
- [grid-auto-columns](https://tailwindcss.com/docs/grid-auto-columns): Utility classes for sizing implicitly-created grid columns.
- [grid-auto-rows](https://tailwindcss.com/docs/grid-auto-rows): Utility classes for sizing implicitly-created grid rows.
- [gap](https://tailwindcss.com/docs/gap): Utility classes for setting gutter size between grid and flex items.
- [justify-content](https://tailwindcss.com/docs/justify-content): Utility classes for controlling how flex/grid items are positioned along a container's main axis.
- [justify-items](https://tailwindcss.com/docs/justify-items): Utility classes for controlling how grid items are aligned along their inline axis.
- [justify-self](https://tailwindcss.com/docs/justify-self): Utility classes for controlling how an individual grid item aligns along its inline axis.
- [align-content](https://tailwindcss.com/docs/align-content): Utility classes for controlling how rows are positioned in a multi-row flex/grid container.
- [align-items](https://tailwindcss.com/docs/align-items): Utility classes for controlling how flex/grid items are positioned along a container's cross axis.
- [align-self](https://tailwindcss.com/docs/align-self): Utility classes for controlling how an individual flex/grid item positions itself along the cross axis.
- [place-content](https://tailwindcss.com/docs/place-content): Shorthand utility classes for setting both `align-content` and `justify-content` simultaneously.
- [place-items](https://tailwindcss.com/docs/place-items): Shorthand utility classes for setting both `align-items` and `justify-items` simultaneously.
- [place-self](https://tailwindcss.com/docs/place-self): Shorthand utility classes for setting both `align-self` and `justify-self` on an individual item.

## Spacing

- [padding](https://tailwindcss.com/docs/padding): Utility classes for setting padding on one or more sides of an element.
- [margin](https://tailwindcss.com/docs/margin): Utility classes for setting margin on one or more sides of an element, including auto margins.

## Sizing

- [width](https://tailwindcss.com/docs/width): Utility classes for setting element width, including fixed, percentage, viewport, and fit-content values.
- [min-width](https://tailwindcss.com/docs/min-width): Utility classes for setting an element's minimum width.
- [max-width](https://tailwindcss.com/docs/max-width): Utility classes for setting an element's maximum width.
- [height](https://tailwindcss.com/docs/height): Utility classes for setting element height, including fixed, percentage, viewport, and fit-content values.
- [min-height](https://tailwindcss.com/docs/min-height): Utility classes for setting an element's minimum height.
- [max-height](https://tailwindcss.com/docs/max-height): Utility classes for setting an element's maximum height.
- [inline-size](https://tailwindcss.com/docs/inline-size): Logical property utilities for setting width in the inline direction (writing-mode-aware alternative to `width`).
- [min-inline-size](https://tailwindcss.com/docs/min-inline-size): Logical property utilities for setting minimum width in the inline direction.
- [max-inline-size](https://tailwindcss.com/docs/max-inline-size): Logical property utilities for setting maximum width in the inline direction.
- [block-size](https://tailwindcss.com/docs/block-size): Logical property utilities for setting height in the block direction (writing-mode-aware alternative to `height`).
- [min-block-size](https://tailwindcss.com/docs/min-block-size): Logical property utilities for setting minimum height in the block direction.
- [max-block-size](https://tailwindcss.com/docs/max-block-size): Logical property utilities for setting maximum height in the block direction.

## Typography

- [font-family](https://tailwindcss.com/docs/font-family): Utility classes for setting an element's font family.
- [font-size](https://tailwindcss.com/docs/font-size): Utility classes for setting font size, with companion line-height and letter-spacing defaults.
- [font-smoothing](https://tailwindcss.com/docs/font-smoothing): Utility classes for controlling antialiasing behavior when rendering text.
- [font-style](https://tailwindcss.com/docs/font-style): Utility classes for setting italic or normal font style.
- [font-weight](https://tailwindcss.com/docs/font-weight): Utility classes for setting font weight (thin through black).
- [font-stretch](https://tailwindcss.com/docs/font-stretch): Utility classes for selecting a normal, condensed, or expanded font face from a variable font.
- [font-variant-numeric](https://tailwindcss.com/docs/font-variant-numeric): Utility classes for enabling alternate glyphs for numbers, fractions, and ordinals.
- [font-feature-settings](https://tailwindcss.com/docs/font-feature-settings): Utility classes for enabling low-level OpenType font features.
- [letter-spacing](https://tailwindcss.com/docs/letter-spacing): Utility classes for controlling tracking (space between letters).
- [line-clamp](https://tailwindcss.com/docs/line-clamp): Utility classes for clamping text to a fixed number of lines with an ellipsis overflow.
- [line-height](https://tailwindcss.com/docs/line-height): Utility classes for controlling the leading (space between lines of text).
- [list-style-image](https://tailwindcss.com/docs/list-style-image): Utility classes for using a custom image as the list item marker.
- [list-style-position](https://tailwindcss.com/docs/list-style-position): Utility classes for controlling whether list markers appear inside or outside the content flow.
- [list-style-type](https://tailwindcss.com/docs/list-style-type): Utility classes for setting the bullet or numbering style of list items.
- [text-align](https://tailwindcss.com/docs/text-align): Utility classes for controlling text alignment (left, center, right, justify, start, end).
- [color](https://tailwindcss.com/docs/color): Utility classes for setting text color.
- [text-decoration-line](https://tailwindcss.com/docs/text-decoration-line): Utility classes for adding underline, overline, or line-through text decoration.
- [text-decoration-color](https://tailwindcss.com/docs/text-decoration-color): Utility classes for setting the color of text decoration lines.
- [text-decoration-style](https://tailwindcss.com/docs/text-decoration-style): Utility classes for setting the style of text decoration lines (solid, dashed, dotted, double, wavy).
- [text-decoration-thickness](https://tailwindcss.com/docs/text-decoration-thickness): Utility classes for setting the thickness of text decoration lines.
- [text-underline-offset](https://tailwindcss.com/docs/text-underline-offset): Utility classes for setting the offset distance of underline text decoration.
- [text-transform](https://tailwindcss.com/docs/text-transform): Utility classes for controlling text capitalization (uppercase, lowercase, capitalize, normal).
- [text-overflow](https://tailwindcss.com/docs/text-overflow): Utility classes for controlling how overflowing text is displayed (ellipsis, clip).
- [text-wrap](https://tailwindcss.com/docs/text-wrap): Utility classes for controlling how text wraps within an element (wrap, nowrap, balance, pretty).
- [text-indent](https://tailwindcss.com/docs/text-indent): Utility classes for setting the indentation of the first line of a text block.
- [vertical-align](https://tailwindcss.com/docs/vertical-align): Utility classes for controlling the vertical alignment of inline or table-cell elements.
- [white-space](https://tailwindcss.com/docs/white-space): Utility classes for controlling whitespace handling within an element.
- [word-break](https://tailwindcss.com/docs/word-break): Utility classes for controlling word breaks when text overflows its container.
- [overflow-wrap](https://tailwindcss.com/docs/overflow-wrap): Utility classes for controlling whether the browser may break lines within words to prevent overflow.
- [hyphens](https://tailwindcss.com/docs/hyphens): Utility classes for controlling hyphenation of text when it wraps across lines.
- [content](https://tailwindcss.com/docs/content): Utility classes for setting the `content` property on `::before` and `::after` pseudo-elements.

## Backgrounds

- [background-attachment](https://tailwindcss.com/docs/background-attachment): Utility classes for controlling whether a background image scrolls with the page or is fixed.
- [background-clip](https://tailwindcss.com/docs/background-clip): Utility classes for controlling the bounding box of an element's background (including text clipping effects).
- [background-color](https://tailwindcss.com/docs/background-color): Utility classes for setting element background color.
- [background-image](https://tailwindcss.com/docs/background-image): Utility classes for setting background images, including linear and radial gradients.
- [background-origin](https://tailwindcss.com/docs/background-origin): Utility classes for controlling where an element's background is rendered relative to borders and padding.
- [background-position](https://tailwindcss.com/docs/background-position): Utility classes for controlling the position of a background image.
- [background-repeat](https://tailwindcss.com/docs/background-repeat): Utility classes for controlling how a background image is repeated.
- [background-size](https://tailwindcss.com/docs/background-size): Utility classes for controlling the size of an element's background image (cover, contain, auto).

## Borders

- [border-radius](https://tailwindcss.com/docs/border-radius): Utility classes for rounding the corners of an element.
- [border-width](https://tailwindcss.com/docs/border-width): Utility classes for setting the width of an element's borders.
- [border-color](https://tailwindcss.com/docs/border-color): Utility classes for setting the color of an element's borders.
- [border-style](https://tailwindcss.com/docs/border-style): Utility classes for setting the style of an element's borders (solid, dashed, dotted, double, none).
- [outline-width](https://tailwindcss.com/docs/outline-width): Utility classes for setting the width of an element's outline.
- [outline-color](https://tailwindcss.com/docs/outline-color): Utility classes for setting the color of an element's outline.
- [outline-style](https://tailwindcss.com/docs/outline-style): Utility classes for setting the style of an element's outline.
- [outline-offset](https://tailwindcss.com/docs/outline-offset): Utility classes for setting the offset distance of an element's outline from its border.

## Effects

- [box-shadow](https://tailwindcss.com/docs/box-shadow): Utility classes for adding box shadow effects to elements.
- [text-shadow](https://tailwindcss.com/docs/text-shadow): Utility classes for adding shadow effects to text.
- [opacity](https://tailwindcss.com/docs/opacity): Utility classes for controlling element opacity.
- [mix-blend-mode](https://tailwindcss.com/docs/mix-blend-mode): Utility classes for controlling how an element's content blends with its background.
- [background-blend-mode](https://tailwindcss.com/docs/background-blend-mode): Utility classes for controlling how an element's background image blends with its background color.
- [mask-clip](https://tailwindcss.com/docs/mask-clip): Utility classes for setting the area that is affected by a mask image.
- [mask-composite](https://tailwindcss.com/docs/mask-composite): Utility classes for compositing multiple mask layers together.
- [mask-image](https://tailwindcss.com/docs/mask-image): Utility classes for setting an image or gradient as a mask on an element.
- [mask-mode](https://tailwindcss.com/docs/mask-mode): Utility classes for controlling whether a mask is treated as luminance or alpha.
- [mask-origin](https://tailwindcss.com/docs/mask-origin): Utility classes for setting the origin box for a mask image.
- [mask-position](https://tailwindcss.com/docs/mask-position): Utility classes for controlling the position of a mask image.
- [mask-repeat](https://tailwindcss.com/docs/mask-repeat): Utility classes for controlling how a mask image is repeated.
- [mask-size](https://tailwindcss.com/docs/mask-size): Utility classes for controlling the size of a mask image.
- [mask-type](https://tailwindcss.com/docs/mask-type): Utility classes for controlling whether an SVG `<mask>` element is treated as luminance or alpha.

## Filters

- [filter](https://tailwindcss.com/docs/filter): Overview of CSS filter utilities for applying visual effects to elements.
- [blur](https://tailwindcss.com/docs/filter-blur): Utility classes for applying Gaussian blur to an element.
- [brightness](https://tailwindcss.com/docs/filter-brightness): Utility classes for making an element appear brighter or darker.
- [contrast](https://tailwindcss.com/docs/filter-contrast): Utility classes for adjusting the contrast of an element.
- [drop-shadow](https://tailwindcss.com/docs/filter-drop-shadow): Utility classes for applying a drop shadow filter (works with transparent images, unlike box-shadow).
- [grayscale](https://tailwindcss.com/docs/filter-grayscale): Utility classes for converting an element to grayscale.
- [hue-rotate](https://tailwindcss.com/docs/filter-hue-rotate): Utility classes for rotating the hue of an element's colors.
- [invert](https://tailwindcss.com/docs/filter-invert): Utility classes for inverting the colors of an element.
- [saturate](https://tailwindcss.com/docs/filter-saturate): Utility classes for controlling the color saturation of an element.
- [sepia](https://tailwindcss.com/docs/filter-sepia): Utility classes for applying a sepia tone effect to an element.
- [backdrop-filter](https://tailwindcss.com/docs/backdrop-filter): Overview of backdrop filter utilities for applying effects to the area behind an element.
- [backdrop-blur](https://tailwindcss.com/docs/backdrop-filter-blur): Utility classes for blurring the content behind an element.
- [backdrop-brightness](https://tailwindcss.com/docs/backdrop-filter-brightness): Utility classes for adjusting the brightness of content behind an element.
- [backdrop-contrast](https://tailwindcss.com/docs/backdrop-filter-contrast): Utility classes for adjusting the contrast of content behind an element.
- [backdrop-grayscale](https://tailwindcss.com/docs/backdrop-filter-grayscale): Utility classes for converting the content behind an element to grayscale.
- [backdrop-hue-rotate](https://tailwindcss.com/docs/backdrop-filter-hue-rotate): Utility classes for rotating the hue of content behind an element.
- [backdrop-invert](https://tailwindcss.com/docs/backdrop-filter-invert): Utility classes for inverting the colors of content behind an element.
- [backdrop-opacity](https://tailwindcss.com/docs/backdrop-filter-opacity): Utility classes for adjusting the opacity of content behind an element.
- [backdrop-saturate](https://tailwindcss.com/docs/backdrop-filter-saturate): Utility classes for adjusting the saturation of content behind an element.
- [backdrop-sepia](https://tailwindcss.com/docs/backdrop-filter-sepia): Utility classes for applying a sepia effect to content behind an element.

## Tables

- [border-collapse](https://tailwindcss.com/docs/border-collapse): Utility classes for controlling whether table borders are collapsed or separated.
- [border-spacing](https://tailwindcss.com/docs/border-spacing): Utility classes for setting the spacing between table cell borders when using separated border model.
- [table-layout](https://tailwindcss.com/docs/table-layout): Utility classes for controlling the table layout algorithm (auto or fixed).
- [caption-side](https://tailwindcss.com/docs/caption-side): Utility classes for positioning a table caption above or below the table.

## Transitions & Animation

- [transition-property](https://tailwindcss.com/docs/transition-property): Utility classes for specifying which CSS properties should transition when they change.
- [transition-behavior](https://tailwindcss.com/docs/transition-behavior): Utility classes for controlling whether transitions apply to properties with discrete animation behavior.
- [transition-duration](https://tailwindcss.com/docs/transition-duration): Utility classes for setting the duration of CSS transitions.
- [transition-timing-function](https://tailwindcss.com/docs/transition-timing-function): Utility classes for controlling the easing curve of CSS transitions.
- [transition-delay](https://tailwindcss.com/docs/transition-delay): Utility classes for setting a delay before a CSS transition starts.
- [animation](https://tailwindcss.com/docs/animation): Utility classes for applying CSS animations (spin, ping, pulse, bounce) and defining custom animations.

## Transforms

- [backface-visibility](https://tailwindcss.com/docs/backface-visibility): Utility classes for controlling whether the back face of a 3D-transformed element is visible.
- [perspective](https://tailwindcss.com/docs/perspective): Utility classes for setting the perspective depth for 3D transforms on child elements.
- [perspective-origin](https://tailwindcss.com/docs/perspective-origin): Utility classes for setting the vanishing point for 3D perspective transforms.
- [rotate](https://tailwindcss.com/docs/rotate): Utility classes for rotating elements in 2D or 3D space.
- [scale](https://tailwindcss.com/docs/scale): Utility classes for scaling elements up or down along one or both axes.
- [skew](https://tailwindcss.com/docs/skew): Utility classes for skewing elements along the horizontal and vertical axes.
- [transform](https://tailwindcss.com/docs/transform): Utility classes for enabling and controlling CSS transform on an element.
- [transform-origin](https://tailwindcss.com/docs/transform-origin): Utility classes for setting the origin point for an element's transforms.
- [transform-style](https://tailwindcss.com/docs/transform-style): Utility classes for controlling whether child elements exist in 3D space or are flattened in the plane of the parent.
- [translate](https://tailwindcss.com/docs/translate): Utility classes for translating (moving) elements along the X and Y axes.

## Interactivity

- [accent-color](https://tailwindcss.com/docs/accent-color): Utility classes for setting the accent color of form controls like checkboxes and radio buttons.
- [appearance](https://tailwindcss.com/docs/appearance): Utility classes for suppressing native browser styling on form elements.
- [caret-color](https://tailwindcss.com/docs/caret-color): Utility classes for setting the color of the text input cursor.
- [color-scheme](https://tailwindcss.com/docs/color-scheme): Utility classes for declaring which color schemes an element can render in (affects scrollbars and form controls).
- [cursor](https://tailwindcss.com/docs/cursor): Utility classes for setting the mouse cursor style when hovering over an element.
- [field-sizing](https://tailwindcss.com/docs/field-sizing): Utility classes for letting form fields auto-size themselves based on their content.
- [pointer-events](https://tailwindcss.com/docs/pointer-events): Utility classes for controlling whether an element responds to mouse/touch events.
- [resize](https://tailwindcss.com/docs/resize): Utility classes for controlling whether and how an element is resizable by the user.
- [scroll-behavior](https://tailwindcss.com/docs/scroll-behavior): Utility classes for setting whether scrolling is instantaneous or animates smoothly.
- [scroll-margin](https://tailwindcss.com/docs/scroll-margin): Utility classes for offsetting the scroll snap position of an element within a scroll container.
- [scroll-padding](https://tailwindcss.com/docs/scroll-padding): Utility classes for setting the scroll padding of a scroll container, affecting where snapped elements align.
- [scroll-snap-align](https://tailwindcss.com/docs/scroll-snap-align): Utility classes for setting the snap alignment of an element within a scroll container.
- [scroll-snap-stop](https://tailwindcss.com/docs/scroll-snap-stop): Utility classes for controlling whether a scroll container can skip past snap points.
- [scroll-snap-type](https://tailwindcss.com/docs/scroll-snap-type): Utility classes for enabling scroll snapping on a container and setting its strictness.
- [touch-action](https://tailwindcss.com/docs/touch-action): Utility classes for controlling how an element responds to touch and trackpad gestures.
- [user-select](https://tailwindcss.com/docs/user-select): Utility classes for controlling whether the user can select text in an element.
- [will-change](https://tailwindcss.com/docs/will-change): Utility classes for hinting to the browser that an element will be animated (use sparingly).

## SVG

- [fill](https://tailwindcss.com/docs/fill): Utility classes for setting the fill color of SVG elements.
- [stroke](https://tailwindcss.com/docs/stroke): Utility classes for setting the stroke color of SVG elements.
- [stroke-width](https://tailwindcss.com/docs/stroke-width): Utility classes for setting the stroke width of SVG elements.

## Accessibility

- [forced-color-adjust](https://tailwindcss.com/docs/forced-color-adjust): Utility classes for opting in or out of forced color mode (Windows High Contrast mode).
