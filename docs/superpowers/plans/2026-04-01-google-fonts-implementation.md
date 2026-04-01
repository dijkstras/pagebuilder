# Google Fonts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Fonts support so users can select any font, with 20 presets available, and all fonts load correctly in the page preview.

**Architecture:** Two key changes — (1) `pageGenerator.js` builds Google Fonts import URLs from fonts used in page styles, (2) `BrandingSettings.jsx` adds a search field alongside the preset dropdown to let users pick any font. The generated HTML includes a consolidated Google Fonts import in the `<head>`.

**Tech Stack:** React, Google Fonts API v1 (no SDK required), URL query string building

---

## File Structure

**Modified files:**
- `src/services/pageGenerator.js` — Add `generateGoogleFontsImport()` function and integrate into `generateCSS()`
- `src/components/SettingsPanel/BrandingSettings.jsx` — Add search input field and update preset fonts list

**No new files created**

---

## Task 1: Create Google Fonts URL Builder Function

**Files:**
- Modify: `src/services/pageGenerator.js:349-400` (the `generateCSS()` function)

- [ ] **Step 1: Write test file for generateGoogleFontsImport**

Create `src/services/__tests__/pageGenerator.test.js`:

```javascript
import { generateGoogleFontsImport } from '../pageGenerator';

describe('generateGoogleFontsImport', () => {
  it('returns empty string when no fonts provided', () => {
    expect(generateGoogleFontsImport({})).toBe('');
  });

  it('generates import for single font with single weight', () => {
    const fonts = {
      heading1: { family: 'Inter', size: 48, weight: 700 },
      heading2: { family: 'Inter', size: 32, weight: 600 },
      body: { family: 'Inter', size: 16, weight: 400 },
      label: { family: 'Inter', size: 12, weight: 500 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toContain('fonts.googleapis.com/css2');
    expect(result).toContain('Inter');
    expect(result).toContain('wght@400');
    expect(result).toContain('wght@500');
    expect(result).toContain('wght@600');
    expect(result).toContain('wght@700');
  });

  it('generates import for multiple fonts with correct URL encoding', () => {
    const fonts = {
      heading1: { family: 'Playfair Display', size: 48, weight: 700 },
      body: { family: 'Inter', size: 16, weight: 400 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toContain('Playfair+Display');
    expect(result).toContain('Inter');
    expect(result).toContain('&family=');
    expect(result).toContain('display=swap');
  });

  it('deduplicates weights for same font', () => {
    const fonts = {
      heading1: { family: 'Roboto', size: 48, weight: 700 },
      body: { family: 'Roboto', size: 16, weight: 700 }
    };
    const result = generateGoogleFontsImport(fonts);
    // Should only have one wght@700, not two
    const matches = result.match(/wght@700/g);
    expect(matches.length).toBe(1);
  });

  it('returns CSS @import statement format', () => {
    const fonts = {
      body: { family: 'Inter', size: 16, weight: 400 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toMatch(/^@import url\(.*\);$/);
  });
});
```

- [ ] **Step 2: Run test to verify all fail**

```bash
npm test -- src/services/__tests__/pageGenerator.test.js
```

Expected: All 5 tests fail with "generateGoogleFontsImport is not exported"

- [ ] **Step 3: Export the function (stub)**

At the end of `src/services/pageGenerator.js` (before the closing brace), add:

```javascript
export function generateGoogleFontsImport(fonts) {
  return '';
}
```

- [ ] **Step 4: Run tests again**

```bash
npm test -- src/services/__tests__/pageGenerator.test.js
```

Expected: First test passes, others fail

- [ ] **Step 5: Implement generateGoogleFontsImport**

Replace the stub with:

```javascript
export function generateGoogleFontsImport(fonts) {
  // Collect all unique fonts and their weights
  const fontMap = {};

  Object.values(fonts).forEach(font => {
    if (!font || !font.family) return;

    if (!fontMap[font.family]) {
      fontMap[font.family] = new Set();
    }
    if (font.weight) {
      fontMap[font.family].add(font.weight);
    }
  });

  // If no fonts, return empty string
  if (Object.keys(fontMap).length === 0) {
    return '';
  }

  // Build query parameters
  const params = Object.entries(fontMap)
    .map(([family, weights]) => {
      const encodedFamily = family.replace(/\s+/g, '+');
      const weightList = Array.from(weights).sort((a, b) => a - b).join(';');
      return `family=${encodedFamily}:wght@${weightList}`;
    })
    .join('&');

  const url = `https://fonts.googleapis.com/css2?${params}&display=swap`;
  return `@import url('${url}');`;
}
```

- [ ] **Step 6: Run tests**

```bash
npm test -- src/services/__tests__/pageGenerator.test.js
```

Expected: All 5 tests pass

---

## Task 2: Integrate Google Fonts Import into CSS Generation

**Files:**
- Modify: `src/services/pageGenerator.js:349-400` (the `generateCSS()` function)

- [ ] **Step 1: Update generateCSS to call generateGoogleFontsImport**

Find the `generateCSS()` function (currently starts at line 349). Replace it with:

```javascript
export function generateCSS(page) {
  const colors = page.styles.colors;
  const fonts = page.styles.fonts;
  const spacing = page.styles.spacing ?? { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 };

  const googleFontsImport = generateGoogleFontsImport(fonts);

  return `
    ${googleFontsImport}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-neutral: ${colors.neutral};
      --font-heading1-family: ${fonts.heading1?.family ?? 'Inter'}, sans-serif;
      --font-heading1-size: ${fonts.heading1?.size ?? 48}px;
      --font-heading1-weight: ${fonts.heading1?.weight ?? 700};
      --font-heading2-family: ${fonts.heading2?.family ?? 'Inter'}, sans-serif;
      --font-heading2-size: ${fonts.heading2?.size ?? 32}px;
      --font-heading2-weight: ${fonts.heading2?.weight ?? 600};
      --font-body-family: ${fonts.body?.family ?? 'Inter'}, sans-serif;
      --font-body-size: ${fonts.body?.size ?? 16}px;
      --font-body-weight: ${fonts.body?.weight ?? 400};
      --font-label-family: ${fonts.label?.family ?? 'Inter'}, sans-serif;
      --font-label-size: ${fonts.label?.size ?? 12}px;
      --font-label-weight: ${fonts.label?.weight ?? 500};
      --spacing-xs: ${spacing.xs}px;
      --spacing-sm: ${spacing.sm}px;
      --spacing-md: ${spacing.md}px;
      --spacing-lg: ${spacing.lg}px;
      --spacing-xl: ${spacing.xl}px;
    }
    html, body {
      font-family: var(--font-body-family);
      font-size: var(--font-body-size);
      font-weight: var(--font-body-weight);
    }
    body { background-color: ${page.styles.bgColor ?? '#f9fafb'}; }
    h1 {
      font-family: var(--font-heading1-family);
      font-size: var(--font-heading1-size);
      font-weight: var(--font-heading1-weight);
    }
    h2 {
      font-family: var(--font-heading2-family);
      font-size: var(--font-heading2-size);
      font-weight: var(--font-heading2-weight);
    }
    h3, .label {
      font-family: var(--font-label-family);
      font-size: var(--font-label-size);
      font-weight: var(--font-label-weight);
    }
  `;
}
```

- [ ] **Step 2: Run tests to ensure CSS generation still works**

```bash
npm test -- src/services/__tests__/pageGenerator.test.js
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/services/pageGenerator.js src/services/__tests__/pageGenerator.test.js
git commit -m "feat: add Google Fonts import generation to pageGenerator

- Export generateGoogleFontsImport() to build Google Fonts URLs
- Consolidates fonts across all typography roles
- Integrates into generateCSS() output
- Includes comprehensive unit tests

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update BrandingSettings Preset Fonts List

**Files:**
- Modify: `src/components/SettingsPanel/BrandingSettings.jsx:5-9` (FONT_FAMILIES constant)

- [ ] **Step 1: Replace FONT_FAMILIES with PRESET_FONTS**

Find lines 5-9 in `BrandingSettings.jsx` and replace:

```javascript
const PRESET_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Poppins', 'Raleway', 'Work Sans', 'Nunito',
  'Merriweather', 'Playfair Display', 'Lora', 'Crimson Text',
  'Montserrat', 'Oswald', 'Space Grotesk', 'Caveat', 'Pacifico', 'Inconsolata'
];
```

- [ ] **Step 2: Update all references from FONT_FAMILIES to PRESET_FONTS**

In the same file, update lines that reference `FONT_FAMILIES`:
- Line 84: `value={PRESET_FONTS.includes(fonts[style.key].family) ? fonts[style.key].family : 'custom'}`
- Line 90: `{PRESET_FONTS.map(f => <option key={f} value={f}>{f}</option>)}`
- Line 91: `{!PRESET_FONTS.includes(fonts[style.key].family) && (`

Complete updated code for the font family selector (lines 81-95):

```javascript
<div style={{ marginBottom: '12px' }}>
  <label style={labelStyle}>Font family</label>
  <select
    value={PRESET_FONTS.includes(fonts[style.key].family) ? fonts[style.key].family : 'custom'}
    onChange={(e) => {
      if (e.target.value !== 'custom') handleFontChange(style.key, 'family', e.target.value);
    }}
    style={inputStyle}
  >
    {PRESET_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
    {!PRESET_FONTS.includes(fonts[style.key].family) && (
      <option value="custom">{fonts[style.key].family} (custom)</option>
    )}
  </select>
</div>
```

- [ ] **Step 3: Add search input field below dropdown**

Insert a new div after the dropdown (after line 95), before line 97:

```javascript
<div style={{ marginBottom: '12px' }}>
  <label style={labelStyle}>Search fonts</label>
  <input
    type="text"
    placeholder="Type any Google Font name..."
    value={fonts[style.key].family}
    onChange={(e) => handleFontChange(style.key, 'family', e.target.value)}
    style={inputStyle}
  />
</div>
```

- [ ] **Step 4: Verify the component renders without errors**

```bash
npm run dev
```

Navigate to the editor, open a page, go to Branding → Typography. Verify:
- Dropdown shows preset fonts
- Search input is visible below dropdown
- Typing in search field updates the font
- Live preview updates when font changes

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel/BrandingSettings.jsx
git commit -m "feat: add font search field and preset list to typography settings

- Replace FONT_FAMILIES with PRESET_FONTS (top 20 Google Fonts)
- Add search input to select any Google Font by name
- Dropdown shows preset, search field allows custom entry
- Live preview continues to update in real-time

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Manual Testing

**Files:** None to modify — testing only

- [ ] **Step 1: Test preset font selection**

```
1. Open dev server (npm run dev)
2. Open a page in the editor
3. Click Branding → Typography
4. Select "Playfair Display" from the Font family dropdown
5. Verify live preview updates to show Playfair Display
6. Generate the page and open preview
7. Inspect the generated HTML (right-click → Inspect)
8. In <head>, verify @import url contains "Playfair+Display"
9. Verify text renders in Playfair Display font
```

- [ ] **Step 2: Test custom font entry**

```
1. In Typography settings, clear the Font family search field
2. Type "Space Mono"
3. Verify live preview updates to Space Mono
4. Generate page and preview
5. Inspect HTML — verify "Space+Mono" in @import
6. Verify text renders in Space Mono
```

- [ ] **Step 3: Test multiple fonts consolidation**

```
1. Set heading1 to "Playfair Display" (weight 700)
2. Set body to "Inter" (weight 400)
3. Set label to "Inter" (weight 500)
4. Generate page
5. Inspect HTML <head>
6. Verify @import contains both Playfair+Display and Inter
7. Verify wght parameters combine correctly:
   - Playfair Display should have wght@700
   - Inter should have wght@400;500 (or 400;500 consolidated)
```

- [ ] **Step 4: Test invalid font graceful fallback**

```
1. Set a font to something that doesn't exist on Google Fonts, e.g., "FakeFont123"
2. Generate page and preview
3. Text should still render (browser falls back to sans-serif)
4. No console errors should appear
```

- [ ] **Step 5: Verify CSS variables use selected fonts**

```
1. Set heading1 to "Merriweather"
2. Generate page
3. Inspect the <style> in generated HTML
4. Verify --font-heading1-family is set to "Merriweather, sans-serif"
5. Verify h1 elements use var(--font-heading1-family)
```

---

## Task 5: Final Verification and Commit

**Files:** None to modify — verification only

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass, including new generateGoogleFontsImport tests

- [ ] **Step 2: Run dev server and smoke test**

```bash
npm run dev
```

- Create new page
- Open Branding → Typography
- Select different fonts from dropdown
- Type custom font names
- Generate page
- Inspect iframe — fonts should load and display correctly

- [ ] **Step 3: Check git status**

```bash
git status
```

Expected: All modified files are staged and ready

- [ ] **Step 4: Final commit (if any uncommitted changes)**

```bash
git log --oneline -5
```

Verify commits are clean:
- Task 2 commit (generateGoogleFontsImport tests)
- Task 3 commit (BrandingSettings UI)

All done! The implementation is complete.

---

## Spec Coverage Checklist

- ✅ Task 1: generateGoogleFontsImport handles all font weights correctly
- ✅ Task 2: Google Fonts import integrated into CSS output
- ✅ Task 3: Preset dropdown with top 20 fonts
- ✅ Task 3: Search field allows any Google Font name
- ✅ Task 3: Live preview updates in real-time
- ✅ Task 4: Generated HTML includes correct @import statement
- ✅ Task 4: Fonts load correctly in preview iframe
- ✅ Task 4: Invalid fonts gracefully fall back
- ✅ Task 4: Consolidated import (single @import for all fonts)
