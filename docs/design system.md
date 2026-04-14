# Design System

## Scope

This document describes the implemented design system across the current codebase, with one explicit exception: `components/pokedex.js` was excluded from this audit as requested. The detail experience is still referenced where the rest of the application interacts with it, but the internal design language of that file is intentionally not documented here.

## Product Character

The application uses a bold, poster-like Pokedex aesthetic built from:

- Hard rectangular edges instead of rounded UI.
- High-contrast black borders and strong outlines.
- Uppercase typography for controls, labels, and utility text.
- Bright primary accent colors inspired by Pokemon branding.
- A light paper-like background with a subtle dot grid texture.
- Minimal but noticeable motion used for loading, reveal, hover, and modal entry.

The result is less "soft app dashboard" and more "printed collector interface": tactile, graphic, and intentionally rigid.

## Technical Foundation

### Rendering model

- The app is a static single-page application with no build step.
- HTML is provided by `index.html` and `layout.js`.
- JavaScript is organized as ES modules.
- Shared UI is rendered through template strings, then hydrated with event listeners.
- Styling is primarily custom CSS split by concern in `styles/`.

### Styling strategy

- The design system is implemented through CSS custom properties in `styles/base.css`.
- Component and section styles are separated into `header.css`, `controls.css`, `card.css`, `modal.css`, and `types.css`.
- Tailwind is loaded from CDN in `index.html`, but the actual system is overwhelmingly custom-class driven rather than utility-first.

### Architecture

- `layout.js` defines the persistent shell.
- `router.js` coordinates home and modal detail behavior.
- `app/pages/home.js` owns grid, search, sort, pagination, and empty/error/loading states.
- `app/pages/detail.js` owns detail loading flow and modal state handoff.
- `components/card.js` and `components/modal.js` provide reusable UI building blocks.
- Services, hooks, constants, and utils back the UI with stable data formatting and state conventions.

## Core Principles

### 1. Use strong shapes

Default corners are square. Borders are visible. UI elements should feel cut from cards, stickers, or printed labels rather than floating glass panels.

### 2. Prefer semantic styling over decorative excess

Color is used to convey hierarchy, Pokemon type, loading emphasis, or action state. The system does not rely on ornamental gradients, blur, or transparency-heavy chrome.

### 3. Make utility text feel system-like

Labels, IDs, result counts, and sort controls are uppercase with increased letter spacing. This gives metadata a "catalog" tone.

### 4. Keep surfaces bright and readable

The palette starts from warm off-white backgrounds and dark text. Accent colors are saturated, but the layout itself stays highly legible.

### 5. Motion should communicate

Animation is brief and tied to state changes:

- Card reveal on initial render.
- Image scale on hover.
- Button press translation.
- Spinner motion during async loading.
- Modal fade and scale on open.

## Design Tokens

### Color tokens

Defined in `styles/base.css`:

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg` | `#fdfbf7` | Global page background, tiles, and some tags |
| `--fg` | `#121212` | Primary foreground, borders, headings, control text |
| `--red` | `#D02020` | Primary action color, especially load-more CTA and emphasis |
| `--blue` | `#1040C0` | Focus-state accent for text input |
| `--yellow` | `#F0C020` | Highlight surfaces, hover fills, results count badge, footer band |
| `--border` | `#121212` | Standard border token |
| `--muted` | `#E0E0E0` | Loading bars, spinner track, low-emphasis surfaces |
| `--card` | `#ffffff` | Primary card surface |
| `--text` | `#121212` | Standard text token |

### Structural tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--radius` | `0px` | Global default corner radius |
| `--radius-sm` | `0px` | Small-radius token, currently also square |
| `--shadow` | `4px 4px 0px 0px #121212` | Retro offset shadow |
| `--shadow-lg` | `8px 8px 0px 0px #121212` | Larger offset shadow |
| `--header-height` | `64px` | Sticky header sizing |
| `--home-footer-height` | dynamic | Used to preserve layout height when footer is shown |

### Type color system

Pokemon-type coloring is a formal subsystem, implemented in both:

- `constants/type-colors.js` for JavaScript-driven backgrounds.
- `styles/types.css` for badge utility classes such as `.t-fire` or `.t-water`.

This dual implementation creates consistency between:

- Card image background washes.
- Type pills.
- Weakness or type-related UI tags.

Special handling exists for light colors like electric, ice, and rock, where foreground text is darkened for readability.

### Stat color system

Defined in `constants/stat-meta.js`:

- `hp`: `#FF595E`
- `attack`: `#FF924C`
- `defense`: `#FFCA3A`
- `special-attack`: `#6A4C93`
- `special-defense`: `#52B788`
- `speed`: `#4CC9F0`

These colors are intended for data visualization, especially stat bars in the detail flow.

## Typography

### Primary font

- `Outfit` is the primary font family.
- It is loaded from Google Fonts in `index.html`.
- Tailwind is configured so `font-sans` would also map to `Outfit`, though the codebase mainly uses plain CSS.

### Typographic tone

The system uses typography to split content into two layers:

- Display and metadata text: bold, uppercase, tighter or negative tracking.
- Descriptive/supporting text: still clean and strong, but less emphasized.

### Typical usage patterns

| Pattern | Characteristics |
| --- | --- |
| App title | Heavy weight, uppercase, tight tracking |
| Card names | Bold or black, uppercase |
| Numeric IDs | Small, condensed-feeling via tracking, subdued opacity |
| Labels | Small uppercase, high letter spacing |
| Body-support text | Standard case or lightly transformed where needed |

### Copy formatting conventions

- Pokemon names are normalized with `capitalize()` to replace hyphens and uppercase the initial letter.
- IDs are normalized with `formatId()` into `#001` style output.
- Dynamic text inserted into user-visible states is escaped with `escapeHtml()` to preserve safety.

## Layout System

### Page shell

The app layout is built from three persistent regions:

1. Sticky header.
2. Main content container.
3. Modal overlay layer.

### Container model

- `.container` max width is `1280px`.
- The shell uses flex column layout to keep the home content and footer aligned vertically.
- The minimum height calculation accounts for both sticky header height and dynamic footer height.

### Content spacing

- Desktop home padding: `28px 20px 0`.
- Mobile home padding: `20px 12px 0`.
- Spacing is generally compact-to-medium, favoring density without feeling cramped.

### Responsive behavior

The system currently uses focused responsive adjustments rather than many breakpoints:

- `540px` is the main mobile breakpoint.
- Header title scales down.
- Home padding tightens.
- Load-more CTA becomes width-constrained and centered.
- Modal viewport sizing tightens.
- Large image and headline sizes reduce in the detail view.

## Backgrounds, Borders, and Surfaces

### Global background

The app background combines:

- A warm off-white fill.
- A subtle radial dot pattern sized at `24px`.

This gives the page a printed-paper or index-card atmosphere without introducing visual noise.

### Surface treatment

Common surfaces include:

- White cards for primary UI blocks.
- Warm off-white tiles for informational blocks.
- Yellow strips or badges for emphasis.

### Borders

Borders are a defining part of the system:

- Standard border thickness is `2px`.
- More important section divisions use `4px`.
- Borders are almost always dark and explicit.

### Shadows

The system uses offset shadows sparingly to create a graphic, almost comic-panel feel:

- Small tiles and icon buttons use tighter offset shadows.
- Loading panels use larger offset shadows.
- Not every surface uses shadows; many rely on border and flat fill alone.

## Motion and Interaction

### Motion language

Animation timing is short and snappy. Preferred behaviors:

- Ease-out translation for buttons and cards.
- Scale-plus-fade for modal open.
- Linear infinite rotation for spinners.
- Shimmer for skeleton states.

### Standard interaction rules

- Hover often changes fill color or slightly lifts a component.
- Active state usually translates by `2px, 2px` to simulate a pressed physical object.
- Disabled state reduces contrast and removes elevated styling.

### Implemented keyframes

| Animation | Usage |
| --- | --- |
| `spin` | Loading spinners |
| `fadeUp` | Card entrance |
| `shimmer` | Skeleton placeholders |

## Component System

### App Shell

#### Header

Implemented in `layout.js` and styled by `styles/header.css`.

Characteristics:

- Sticky positioning at top of viewport.
- White background with black bottom border.
- Compact 64px height.
- Icon plus uppercase wordmark.
- High z-index to remain above page content.

Usage rule:

- Keep the header simple and brand-forward. It is a framing device, not a dense navigation bar.

### Controls

#### Search field

Implemented by `.search-wrap` and `.search-input`.

Characteristics:

- Left-aligned search icon inside the field.
- 2px border and square corners.
- Strong font weight for typed content.
- Blue focus border as the main focus-state affordance.

Usage rule:

- Inputs in this system should look like labeled tools rather than soft forms. Favor clear borders and direct state changes over glow effects.

#### Sort controls

Implemented with `.sort-wrap`, `.sort-label`, and `.sort-btn`.

Characteristics:

- Uppercase control buttons.
- White default surface.
- Yellow hover for inactive buttons.
- Inverted dark fill for the active option.

Usage rule:

- Use segmented, side-by-side button groups when choosing between a few system states.

#### Results count

Implemented by `.results-count`.

Characteristics:

- Badge-like inline block.
- Yellow background with black border.
- Small uppercase metadata text.

Usage rule:

- System feedback should read like a label or stamp, not like body copy.

#### Primary footer action

Implemented by `.load-more-wrap` and `.load-more-btn`.

Characteristics:

- Full-width yellow footer band.
- Centered red CTA button.
- Strong uppercase call-to-action styling.
- Integrated spinner state during async loading.

Usage rule:

- Primary asynchronous actions should have unmistakable contrast and spatial separation from browsing content.

### Card System

#### Pokemon grid

Implemented by `.card-grid`.

Characteristics:

- Auto-fill grid using `minmax(170px, 1fr)`.
- 16px gap.
- Optimized for a gallery of compact collectible cards.

#### Pokemon card

Implemented by `components/card.js` and `styles/card.css`.

Structural parts:

- Container: `.poke-card`
- Evolution badge: `.evolution-badge`
- Image area: `.card-img-wrap`
- Background wash: `.card-img-bg`
- Body: `.card-body`
- Number: `.card-num`
- Name: `.card-name`
- Type list: `.type-pills`

Characteristics:

- White rectangular card with bold border.
- Image area separated by bottom border.
- Type-colored image background wash at low opacity.
- Uppercase naming and metadata.
- Hover lift and image enlargement for collectibility.

Usage rule:

- Cards should communicate both identity and classification quickly. Names, IDs, and type markers should stay visible at a glance.

#### Evolution badge

Characteristics:

- Placed in top-right corner.
- Hidden until evolution stage resolves.
- Color-coded by stage level.
- Reads more like a stamped corner marker than a pill.

Usage rule:

- Status markers should be integrated into the card frame instead of floating loosely above it.

#### Type pills

Characteristics:

- Small uppercase labels.
- Square corners.
- Direct type-based background color.
- Dense, compact spacing.

Usage rule:

- Pills in this system are informational chips, not soft tags. Keep them sharp and concise.

### Feedback States

#### Skeleton cards

Characteristics:

- Mirror card silhouette and spacing.
- Use animated gray shimmer blocks.
- Preserve expected layout while data loads.

#### Empty state

Characteristics:

- Full-grid-width bordered panel.
- Search icon illustration.
- Large uppercase message.

Usage rule:

- Empty states should feel like system notices, not friendly marketing illustrations.

#### Error state

Characteristics:

- Centered message with strong red emphasis.
- Retry action rendered inline.
- Visual treatment stays consistent with bordered-card language.

### Modal System

#### Overlay

Implemented by `components/modal.js` and `styles/modal.css`.

Characteristics:

- Darkened full-screen backdrop.
- Fade-in visibility transition.
- Click-outside closes the modal.

#### Modal container

Characteristics:

- Transparent outer wrapper.
- Scale and translate entrance animation.
- Large centered viewport with max-height control.

#### Loading panel

Characteristics:

- White bordered box with large offset shadow.
- Centered large spinner.
- Used before detail content is ready.

#### Shared detail styling

Even with `components/pokedex.js` excluded, the surrounding design language in `modal.css` is still clear:

- Prominent header band.
- Centered Pokemon image presentation.
- Utility text for numbers and labels.
- Tile-based metadata presentation.
- Horizontal stat-track model.
- Sharp-corner tags and navigation controls.

Usage rule:

- Detail overlays should feel like enlarged collectible records, not generic app modals.

## Data Presentation Patterns

### IDs

- Always present IDs in prefixed hash format through `formatId()`.
- Three-digit minimum padding is the default mental model for the system.

### Names

- Convert API slugs into readable labels with `capitalize()`.
- Replace hyphens with spaces in user-facing content.

### Type representation

- Types are consistently color-coded.
- Type classes and JS color maps should remain aligned.

### Stats and quantitative data

- Numeric values pair with a colored bar when possible.
- Labels should stay abbreviated and scannable.

### Count messaging

The home screen uses two message modes:

- Browsing mode: "Showing X of Y Pokemon"
- Search mode: "N results found"

This is a good pattern to preserve elsewhere: distinguish collection progress from filtered results.

## Accessibility and UX Conventions

### Existing strengths

- Search uses `type="search"` and placeholder guidance.
- Cards are keyboard focusable via `tabindex="0"`.
- Enter activates focused cards.
- Escape closes detail view.
- Arrow keys support lateral detail navigation.
- Modal declares `role="dialog"` and `aria-modal="true"`.
- Evolution badges add `aria-label` text once resolved.

### Existing tradeoffs

- Cards depend mostly on browser default focus treatment; no custom visible focus style is defined in current CSS.
- Some button styles are inline in error states, which makes system-level accessibility harder to centralize.
- The header icon is decorative and correctly hidden with empty alt plus `aria-hidden="true"`.

### Design rule

- Future additions should preserve strong keyboard affordances and add explicit focus styling where interactive density increases.

## Implementation Conventions

### Naming

- CSS class names are plain and semantic: `card-grid`, `search-wrap`, `modal-loading`, `info-tile`.
- JavaScript utilities and modules use descriptive, low-abstraction names.

### State expression

Current UI state is expressed through:

- Class toggles such as `.active`, `.open`, `.is-ready`.
- Data attributes such as `data-id`, `data-action`, and `data-detail-loading`.
- Inline style values only when a state is dynamic per instance, such as animation delay or type-colored image background.

### Source of truth

- Global visual tokens live in CSS variables.
- Domain-specific visual mappings live in constants.
- Runtime state lives in small hook-like modules and a shared cache object.

### Sanitization

- Dynamic user-visible HTML messages should be escaped with `escapeHtml()`.
- Remote assets should keep fallback handling similar to the image placeholder strategy in `fallback-image.js`.

## Extension Guidelines

When adding new UI to this codebase, follow these rules:

1. Use square corners by default.
2. Prefer visible borders over subtle fills.
3. Use uppercase labels for system metadata, filters, counters, and controls.
4. Keep accent colors purposeful and saturated.
5. Reuse `--bg`, `--card`, `--fg`, `--red`, `--yellow`, and `--blue` before inventing new tokens.
6. Match active and pressed states with the existing translation-based interaction pattern.
7. If adding new Pokemon-type UI, source colors from the existing type token map.
8. Keep empty, loading, and error states visually integrated with the card system.
9. Prefer small semantic CSS files over scattered inline styling.
10. Preserve the codebase's lightweight, no-build, template-string architecture unless a larger structural change is intentional.

## Recommended Improvements

These are not current system rules, but they would strengthen consistency:

- Add explicit focus-visible styles for buttons, cards, and input controls.
- Centralize inline retry/close button styles from error states into CSS classes.
- Consolidate spacing tokens if the system grows beyond the current compact set.
- Decide whether Tailwind should remain available or be removed if custom CSS stays the dominant approach.
- Document any additional design language inside `components/pokedex.js` separately if that file becomes part of the shared system later.

## File-to-System Map

| Area | Primary files |
| --- | --- |
| Global tokens and page background | `styles/base.css` |
| Brand shell header | `styles/header.css`, `layout.js` |
| Search, sort, count, and load more | `styles/controls.css`, `app/pages/home.js` |
| Card gallery and feedback states | `styles/card.css`, `components/card.js` |
| Modal overlay and shared detail scaffolding | `styles/modal.css`, `components/modal.js`, `app/pages/detail.js` |
| Type badge color system | `styles/types.css`, `constants/type-colors.js` |
| Stat visualization colors | `constants/stat-meta.js` |
| Pagination/search behavior | `hooks/use-pagination.js`, `hooks/use-search.js` |
| Data formatting and safety helpers | `utils/format-id.js`, `utils/capitalize.js`, `utils/escape-html.js`, `utils/fallback-image.js` |
| Remote data and caching | `lib/api/client.js`, `lib/services/pokemon-service.js`, `lib/services/cache.js` |

## Summary

This design system is defined less by abstract branding language and more by concrete implementation choices: square geometry, bold borders, uppercase metadata, collectible-card composition, saturated accents, and lightweight motion. As long as future work keeps those traits intact, new features should feel native to the current Pokedex experience.
