# Button Enhancements Design

## Summary

Extend the button system with gradient backgrounds, per-style font size, a shared Button typography slot, a curated icon picker per instance, automatic hover states, and a size override toggle.

## Data Model Changes

### `buttonStyles` entries gain new fields:
- `bgType`: `'solid' | 'gradient'` (default `'solid'`)
- `bgGradient`: `{ color1, color2, angle }` — same shape as segments/containers
- `fontSize`: number in px (default `14`)

### Typography gains a new slot:
- `button`: `{ family, weight }` — font family + weight only; size is per style

### Button instance `customOverrides` gains:
- `icon`: `{ key: string | null, position: 'before' | 'after' | 'none' }`
- `sizeOverride`: `{ enabled: boolean, width: string, height: string }`

## Icon Registry

12 built-in SVG icons keyed by name: `arrow-right`, `arrow-left`, `chevron-right`, `chevron-left`, `plus`, `external-link`, `download`, `check`, `star`, `heart`, `send`, `play`.

Stored as a static constant in the codebase (not in page data).

## UI Changes

### Branding > Typography
Add a "Button" row with font family picker + weight selector. No size here — size lives in each button style.

### Branding > Buttons (per style)
- Replace the solid `bgColor` input with a `GradientPicker` (reuse existing component, same props as segments)
- Add font size slider/input (10–32px range)
- Show an auto hover preview (darkened version of base color) — read-only, no config

### Content Settings (per button instance)
- **Icon section**: position toggle (None / Before / After) + 6×2 icon grid; hidden when position is None
- **Size override**: toggle switch; when on, shows Width + Height text inputs (accepts px, %, auto)

## Page Generator Changes

- Read `bgType/bgGradient` from button style, output gradient CSS when applicable
- Read `fontSize` from button style
- Read `typography.button.family/weight` for font CSS variables (`--font-button-family`, `--font-button-weight`)
- Inject a `<style>` block into generated HTML with `.btn-{elementId}:hover` rules (auto-darkened background, ~15% darker via a simple hex manipulation utility)
- Apply `icon` from instance overrides — render SVG inline before/after label text
- Apply `sizeOverride` width/height when enabled

## Files to Change

- `src/store/pageTypes.js` — default data structures
- `src/components/SettingsPanel/BrandingSettings.jsx` — Typography Button row + GradientPicker + font size in ButtonEditor
- `src/components/SettingsPanel/ContentSettings.jsx` — icon picker + size override UI
- `src/services/pageGenerator.js` — gradient output, font vars, hover `<style>` block, icon rendering, size override
