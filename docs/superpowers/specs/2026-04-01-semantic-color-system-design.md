# Semantic Color System Design Specification

**Date:** 2026-04-01
**Purpose:** Expand the branding color system from 3 basic slots to 6 semantic slots organized by category (Brand and UI), with automatic application as defaults and availability as presets throughout the editor.

---

## Overview

The current branding system has three color slots (primary, secondary, neutral). This design expands to **6 semantic color slots** organized into two logical groups:

- **Brand Colors:** Primary, Secondary — define the brand identity
- **UI Colors:** Text, Background, Accent, Neutral — define functional defaults for the site

These colors will:
1. **Apply as defaults** — used automatically when creating new elements
2. **Show as presets** — available in any color picker throughout the editor
3. **Be easily customizable** — grouped UI in BrandingSettings with clear labels and live swatches

---

## Color Slots

### Brand Colors
- **Primary** — Used for buttons, accents, links, and primary CTAs
- **Secondary** — Used for secondary brand accents and supporting elements

### UI Colors
- **Text** — Default text color for all text content
- **Background** — Default site background color for segments and page
- **Accent** — Highlights, secondary actions, and decorative elements
- **Neutral** — In-between shades for borders, disabled states, and subtle elements

---

## Data Model Changes

### Updated Colors Object
The `colors` object in `page.styles` expands from 3 to 6 slots:

```javascript
colors: {
  primary: '#3b82f6',      // Brand: Primary blue
  secondary: '#8b5cf6',    // Brand: Secondary purple
  accent: '#ec4899',       // UI: Pink accent
  text: '#1f2937',         // UI: Dark gray text
  background: '#f9fafb',   // UI: Light gray background
  neutral: '#6b7280'       // UI: Medium gray
}
```

**In `pageTypes.js`:**
- Update `createEmptyPage()` to initialize all 6 colors with sensible defaults
- Keep the same color structure format (simple key-value hex strings)

---

## UI/UX Changes

### BrandingSettings Component (`ColorsSettings` function)
Reorganize the color editing UI with grouped display:

**Structure:**
```
Colors
  🎨 Brand Colors
     Primary:    [color swatch] [#3b82f6]
     Secondary:  [color swatch] [#8b5cf6]

  🎨 UI Colors
     Text:       [color swatch] [#1f2937]
     Background: [color swatch] [#f9fafb]
     Accent:     [color swatch] [#ec4899]
     Neutral:    [color swatch] [#6b7280]
```

**Each color slot shows:**
- Group header (Brand Colors / UI Colors) with section styling
- Label (e.g., "Primary", "Text")
- Color swatch (clickable for native color picker)
- Hex value input field (editable text for manual entry)

**Visual hierarchy:**
- Group headers in uppercase, smaller font (like existing `sectionHeadingStyle`)
- Swatches and inputs aligned horizontally (flex layout)
- Consistent with existing BrandingSettings styling

---

## Integration Points

### 1. Default Application (in `pageGenerator.js`)

**Text elements:**
- Default text color = `styles.colors.text`

**Segments & Containers:**
- Default background color = `styles.colors.background` (when no custom color set)

**Buttons:**
- Primary button: `bgColor = styles.colors.primary`, text = white/contrast
- Secondary button: `bgColor = styles.colors.secondary`, text = white/contrast
- (App will calculate hover states—no manual hover color definition)

**Accent elements:**
- Accent color = `styles.colors.accent` (available for highlights, borders, secondary actions)

**Neutral elements:**
- Neutral color = `styles.colors.neutral` (for borders, disabled states, subtle elements)

### 2. Color Presets (in all color pickers)

Any color picker in the editor (SegmentSettings, ContainerSettings, ContentSettings, etc.) should display the 6 semantic colors as presets:

- When a color picker opens, show a "Brand Palette" section with the 6 colors
- User can click to apply, or continue using the native color picker for custom colors
- Presets are read from `state.page.styles.colors`

**Example picker UI:**
```
[native color picker / swatch]
─────────────────
Suggested colors (Brand Palette):
[Primary] [Secondary] [Accent]
[Text] [Background] [Neutral]
```

---

## File Changes Summary

### Modified Files
1. **`src/store/pageTypes.js`**
   - Update `createEmptyPage()` to initialize all 6 colors
   - Update any element factory defaults that reference colors

2. **`src/components/SettingsPanel/BrandingSettings.jsx`**
   - Update `ColorsSettings()` function to display grouped colors
   - Add group headers ("Brand Colors", "UI Colors")
   - Maintain existing color picker interaction

3. **`src/services/pageGenerator.js`**
   - Update default text color to use `styles.colors.text`
   - Update default segment/container background to `styles.colors.background`
   - Update button rendering to use `styles.colors.primary` and `styles.colors.secondary`

4. **Optional: Color Picker Components** (GradientPicker.jsx, ContentSettings.jsx, etc.)
   - Add preset color section showing the 6 semantic colors
   - (Can be phased in incrementally; not critical for MVP)

### New Files
- None required (all changes are to existing components)

---

## Design Rationale

**Why grouped display?**
- Organizes colors into meaningful categories (Brand vs. UI)
- Makes it clear which colors define brand identity vs. functional defaults
- Improves discoverability and mental model for future editors

**Why apply as defaults?**
- Reduces repetitive color selection during page building
- Ensures consistency across the site
- Editors can still override on a per-element basis

**Why show as presets?**
- Fast access to brand colors when customizing individual elements
- Reduces need to manually copy hex values
- Encourages visual consistency

**Why no hover/state colors?**
- Keeps the system lean and focused
- The app can calculate hover states programmatically (darker shade of primary, etc.)
- Reduces cognitive load for editors

---

## Success Criteria

1. ✅ All 6 color slots are initialized in `createEmptyPage()`
2. ✅ BrandingSettings displays colors in two groups with clear labels
3. ✅ Colors are applied as defaults to new elements (text, segments, buttons)
4. ✅ Colors are available as presets in at least one color picker for quick access
5. ✅ Editors can customize all 6 colors via hex input or native color picker
6. ✅ Existing pages still load and work (backwards compatibility)

---

## Out of Scope

- Advanced color harmony tools (contrast checking, color blindness simulation)
- Preset color palettes or themes
- Animation or transition color specifications
- Hover/state color definitions (app calculates these)
- Status colors (error, warning, success)

---

## Implementation Notes

- Changes are backward compatible: new colors are added, existing ones unchanged
- Default values chosen to work well together (blue primary, purple secondary, pink accent)
- Can implement incrementally: start with data model + BrandingSettings, add defaults and presets later
