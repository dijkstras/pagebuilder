# Google Fonts Integration Design

**Date:** 2026-04-01
**Status:** Design phase
**Scope:** Add Google Fonts support to page builder typography settings

## Overview

Currently, the page builder stores font family names (Inter, Roboto, etc.) but never loads the actual fonts. This results in fonts falling back to system defaults and users seeing inconsistent rendering.

**Solution:** Integrate Google Fonts API to:
1. Let users select from 20 preset Google Fonts via dropdown
2. Allow search/entry of any Google Font by name
3. Automatically load selected fonts into generated HTML via Google Fonts API
4. Maintain live preview in typography settings

## Architecture

### Components

**1. BrandingSettings.jsx — Typography Section**
- Replace hardcoded `FONT_FAMILIES` array with:
  - Top 20 preset fonts (dropdown)
  - Search input field for any Google Font
- Track "selected font" state during search
- Live preview updates as user selects

**2. PageGenerator.js — CSS Generation**
- Extract unique fonts used across heading1, heading2, body, label
- Generate Google Fonts import statement with all used fonts
- Include in `generateHTML()` output in `<head>`

**3. Google Fonts Integration**
- Use Google Fonts API v1 with format parameter
- Import format: `https://fonts.googleapis.com/css2?family=Font+Name:wght@400;500;600;700&display=swap`
- Collect all font weights used across typography roles
- Single consolidated import (not per-element)

**4. Font Search (Optional Enhancement)**
- Fetch Google Fonts metadata (public API) to validate font names
- No validation required — invalid names gracefully fall back to system font
- User can type anything and it will either load or fallback

### Data Flow

```
User selects font in BrandingSettings
  ↓
updatePageStyles({ fonts: { heading1: { family: 'Playfair Display', ... } } })
  ↓
pageStore updates page.styles.fonts
  ↓
Preview component detects change
  ↓
generateHTML() runs:
  - Extracts all font families from page.styles.fonts
  - Builds Google Fonts import URL
  - Embeds in generated HTML <head>
  ↓
iFrame renders with fonts loaded
```

## Implementation Details

### Top 20 Preset Fonts

Selected to balance variety across serif, sans-serif, and display categories:

**Sans-serif (7):**
- Inter
- Roboto
- Open Sans
- Poppins
- Raleway
- Work Sans
- Nunito

**Serif (4):**
- Merriweather
- Playfair Display
- Lora
- Crimson Text

**Display (5):**
- Montserrat
- Oswald
- Space Grotesk
- Caveat
- Pacifico

**Monospace (1):**
- Inconsolata

### Font Weights to Load

Determine which weights are needed based on current typography settings:
- heading1: typically 700 (bold)
- heading2: typically 600 (semi-bold)
- body: typically 400 (regular)
- label: typically 500 (medium)

Collect all unique weights used across all four typography roles and load only those in the Google Fonts import.

### Search/Entry Behavior

**How it works:**
1. Dropdown shows top 20 preset fonts with value matching currently selected font
2. If selected font is NOT in preset list, dropdown shows "custom" and displays actual font name
3. Search input accepts any text and immediately updates the font family
4. No validation — font either loads or browser falls back to sans-serif

**Example flow:**
- User types "Space+Mono" in search field
- Live preview updates: `fontFamily: 'Space Mono'`
- When page generates, import URL includes `Space+Mono:wght@400`
- If font doesn't exist on Google Fonts, browser font stack handles fallback

### Google Fonts URL Construction

**Example:** User selects fonts: Inter (400, 700), Merriweather (400), Playfair Display (700)

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Merriweather:wght@400&family=Playfair+Display:wght@700&display=swap
```

Algorithm:
1. Extract all fonts from `page.styles.fonts` object (heading1, heading2, body, label)
2. Group by font family name
3. Collect all unique weights for each family
4. Build query params: `family=FontName:wght@weight1;weight2...`
5. Join with `&` and prepend `https://fonts.googleapis.com/css2?`
6. Append `&display=swap` for font-display strategy

### Changes to pageGenerator.js

**In `generateCSS()`:**
- Add `generateGoogleFontsImport(fonts)` function
- Call it to build import string
- Insert into CSS variable block at top

**Example output:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

:root {
  --font-heading1-family: Playfair Display, serif;
  --font-body-family: Inter, sans-serif;
  ...
}
```

### Changes to BrandingSettings.jsx

**In `TypographySettings()`:**
- Rename `FONT_FAMILIES` → `PRESET_FONTS` (keep same array)
- Add search input below dropdown
- Dropdown shows: preset fonts + "custom" option if current font not in preset
- Search input: text field that directly updates font family
- Live preview continues to work as-is

**No changes needed to:**
- Size and weight controls (remain as-is)
- Other settings sections (Colors, Buttons)
- Page store or state management

## Testing

**Manual testing:**
1. Open Typography settings
2. Select each preset font — verify live preview updates
3. Type a custom Google Font name (e.g., "Pacifico") — verify preview and dropdown show custom
4. Generate page and inspect iframe — fonts should load without errors
5. Test offline/blocked Google Fonts — should gracefully fall back to system font

**Edge cases:**
- Invalid font name (won't exist on Google Fonts) — falls back to system sans-serif
- Offline user — fonts fail to load, browser uses fallback stack
- Multiple typography roles using different fonts — all load in single import
- User selects same font for all roles — import deduplicates and consolidates weights

## Browser Compatibility

- Google Fonts supports all modern browsers (Chrome, Safari, Firefox, Edge)
- `display=swap` ensures text renders immediately while fonts load (best practice)
- Fallback font stacks in CSS ensure graceful degradation

## Future Enhancements (Out of Scope)

- Search Google Fonts API for auto-completion
- Font categories/filters (serif/sans/display)
- Font preview images
- Variable font support (future Google Fonts expansion)
- Import from other font services (Adobe, Typekit, etc.)

## Success Criteria

- ✓ Users can select any of 20 preset Google Fonts
- ✓ Users can type any Google Font name and it loads
- ✓ Live preview shows selected font
- ✓ Generated pages render fonts correctly (no missing fonts)
- ✓ Single consolidated Google Fonts import (efficient loading)
- ✓ Graceful fallback if font unavailable
