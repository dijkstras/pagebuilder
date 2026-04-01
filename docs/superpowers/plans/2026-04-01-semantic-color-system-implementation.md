# Semantic Color System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the branding color system from 3 basic slots to 6 semantic slots (Primary, Secondary, Accent, Text, Background, Neutral) organized by category, applied as defaults, and available as presets.

**Architecture:** Update the data model to define 6 colors, reorganize the settings UI to display them in grouped categories, and apply these colors as defaults throughout the page generator when rendering elements.

**Tech Stack:** React, CSS-in-JS inline styles, existing pageStore context

---

## Task 1: Update Data Model with 6 Semantic Colors

**Files:**
- Modify: `src/store/pageTypes.js`

### Steps

- [ ] **Step 1: Locate the `createEmptyPage()` function**

Open `src/store/pageTypes.js` and find the `createEmptyPage()` function (around line 23).

- [ ] **Step 2: Replace the colors object with 6 semantic slots**

Replace this:
```javascript
colors: {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  neutral: '#6b7280'
},
```

With this:
```javascript
colors: {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  text: '#1f2937',
  background: '#f9fafb',
  neutral: '#6b7280'
},
```

- [ ] **Step 3: Verify no other files reference the old 3-color structure**

Run: `grep -r "colors\." src/ --include="*.js" --include="*.jsx"` and check if any code hardcodes assumptions about specific color keys.

Expected: No matches that assume only 3 colors exist (the BrandingSettings and pageGenerator will be updated in later tasks).

- [ ] **Step 4: Commit**

```bash
cd "/Users/sjoerddijkstra/Library/CloudStorage/Dropbox/Coding/Pagebuilder"
git add src/store/pageTypes.js
git commit -m "feat: expand colors from 3 to 6 semantic slots

Add Primary, Secondary, Accent, Text, Background, Neutral color slots to createEmptyPage(). Maintains backward compatibility with existing color structure.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Reorganize BrandingSettings with Grouped Color Display

**Files:**
- Modify: `src/components/SettingsPanel/BrandingSettings.jsx` (around line 143-182 in `ColorsSettings()`)

### Steps

- [ ] **Step 1: Update COLOR_LABELS constant to include all 6 colors**

Replace this (around line 145):
```javascript
const COLOR_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  neutral: 'Neutral'
};
```

With this:
```javascript
const COLOR_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  text: 'Text',
  background: 'Background',
  neutral: 'Neutral'
};

const COLOR_GROUPS = {
  brand: {
    label: 'Brand Colors',
    keys: ['primary', 'secondary']
  },
  ui: {
    label: 'UI Colors',
    keys: ['text', 'background', 'accent', 'neutral']
  }
};
```

- [ ] **Step 2: Replace the `ColorsSettings()` function**

Replace the entire `ColorsSettings()` function (lines 151-182) with this:

```javascript
function ColorsSettings() {
  const { state, dispatch } = usePageStore();
  const { colors } = state.page.styles;

  const handleColorChange = (key, value) => {
    dispatch(pageActions.updatePageStyles({ colors: { ...colors, [key]: value } }));
  };

  return (
    <div>
      {Object.entries(COLOR_GROUPS).map((groupEntry, groupIndex) => {
        const [groupKey, group] = groupEntry;
        return (
          <div key={groupKey}>
            <p style={sectionHeadingStyle}>{group.label}</p>
            <div style={{ marginBottom: '16px' }}>
              {group.keys.map(colorKey => (
                <div key={colorKey} style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>{COLOR_LABELS[colorKey]}</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={colors[colorKey]}
                      onChange={(e) => handleColorChange(colorKey, e.target.value)}
                      style={{
                        width: '44px',
                        height: '44px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        border: '1px solid #4b5563',
                        padding: '2px',
                        backgroundColor: '#374151',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={colors[colorKey].toUpperCase()}
                      onChange={(e) => handleColorChange(colorKey, e.target.value)}
                      style={{ flex: 1, ...inputStyle }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {groupIndex < Object.keys(COLOR_GROUPS).length - 1 && <Divider />}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Test the BrandingSettings UI in the editor**

Run: `npm run dev`

Navigate to the editor, select page, click the palette icon (🎨) to open branding settings, and click "Colors".

Expected: Should see two sections: "Brand Colors" (Primary, Secondary) and "UI Colors" (Text, Background, Accent, Neutral), each with a color swatch and hex input.

- [ ] **Step 4: Verify all 6 colors can be edited**

Click each color swatch and change it. Update hex values in the text fields. Verify changes persist and don't error.

Expected: All 6 colors are editable without errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel/BrandingSettings.jsx
git commit -m "feat: reorganize colors in BrandingSettings with grouped display

Split 6 colors into Brand Colors (Primary, Secondary) and UI Colors (Text, Background, Accent, Neutral) with section headers for better visual organization.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Apply Semantic Colors as Defaults in pageGenerator

**Files:**
- Modify: `src/services/pageGenerator.js`

### Steps

- [ ] **Step 1: Locate where segments are rendered**

Open `src/services/pageGenerator.js` and find the `renderSegment()` function (search for `function renderSegment`).

- [ ] **Step 2: Update segment background color default**

Find where the segment div is created with `style={...}`. Look for the backgroundColor property.

Current (approximately):
```javascript
const segmentStyle = {
  backgroundColor: segment.settings.bgColor || '#ffffff',
  // ... other properties
};
```

Change to:
```javascript
const segmentStyle = {
  backgroundColor: segment.settings.bgColor || page.styles.colors.background,
  // ... other properties
};
```

This applies the `background` color as the default if a segment has no custom bgColor.

- [ ] **Step 3: Locate where text content is rendered**

Find the `renderContentItem()` function and locate where text items are rendered.

Search for text type handling (look for `type === 'text'` or similar).

- [ ] **Step 4: Apply default text color to text elements**

In the text rendering section, find the style object being applied to text.

Current (approximately):
```javascript
const textStyle = {
  color: customOverrides.color || '#000000',
  // ... other properties
};
```

Change to:
```javascript
const textStyle = {
  color: customOverrides.color || page.styles.colors.text,
  // ... other properties
};
```

- [ ] **Step 5: Locate where buttons are rendered**

Find the button rendering code in `renderContentItem()` (look for `type === 'button'`).

- [ ] **Step 6: Apply semantic colors to button rendering**

Locate the button style object. Update button styling to use semantic colors:

For primary button:
```javascript
if (buttonStyle.id === 'primary') {
  // Use primary color as default if not customized
  bgColor = customOverrides.bgColor || page.styles.colors.primary;
}
```

For secondary button:
```javascript
if (buttonStyle.id === 'secondary') {
  // Use secondary color as default if not customized
  bgColor = customOverrides.bgColor || page.styles.colors.secondary;
}
```

Ensure that custom overrides still take precedence over these defaults.

- [ ] **Step 7: Test defaults in live preview**

Run: `npm run dev`

1. Create a new page (should auto-initialize with 6 colors)
2. Add a segment (should have light gray background from `colors.background`)
3. Add text content to the segment (should render in dark text color from `colors.text`)
4. Add a primary button (should render in blue from `colors.primary`)
5. Add a secondary button (should render in purple from `colors.secondary`)

Expected: All elements render with semantic colors as defaults; background is light gray, text is dark, buttons use brand colors.

- [ ] **Step 8: Verify custom overrides still work**

In the settings panel:
1. Select a segment and change its background color to red
2. Expected: Segment background becomes red (override takes precedence)
3. Select text content and change its color to green
4. Expected: Text renders in green

- [ ] **Step 9: Commit**

```bash
git add src/services/pageGenerator.js
git commit -m "feat: apply semantic colors as defaults in pageGenerator

Use colors.background for segment defaults, colors.text for text elements, colors.primary/secondary for buttons. Custom overrides still take precedence.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Add Color Presets to Color Pickers (Optional - Phase 2)

**Files:**
- Modify: `src/components/SettingsPanel/SegmentSettings.jsx` (where background color is picked)
- Modify: `src/components/SettingsPanel/ContentSettings.jsx` (where text color is picked)
- (Other color picker locations as needed)

### Notes for Future Implementation

This task is **optional for the MVP** but recommended as a follow-up:

Each component that has a color picker should display the 6 semantic colors as quick presets. Example structure:

```javascript
function ColorPresetRow({ colors, onSelectColor }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #4b5563' }}>
      {Object.entries(colors).map(([key, value]) => (
        <button
          key={key}
          onClick={() => onSelectColor(value)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            backgroundColor: value,
            border: '1px solid #4b5563',
            cursor: 'pointer',
            title: key
          }}
        />
      ))}
    </div>
  );
}
```

Can be added incrementally to each component. Skip for MVP if time is tight—the core color system is complete without presets.

---

## Task 5: Backward Compatibility Check & Testing

**Files:**
- Test: Load existing pages and verify they still work

### Steps

- [ ] **Step 1: Open the editor and load an existing page**

If you have saved pages from before this change, load one via the Load button.

Expected: Page loads without errors. Existing colors are preserved.

- [ ] **Step 2: Verify the new colors don't break existing data**

Check that pages with only 3 colors (primary, secondary, neutral) still work.

Expected: Existing pages render correctly; the new 3 colors (accent, text, background) use defaults for old pages.

- [ ] **Step 3: Create a new page and verify defaults are correct**

Click "New Page", add a segment and some content.

Expected: New page initializes with all 6 colors; defaults are applied correctly.

- [ ] **Step 4: Run tests (if any exist)**

Run: `npm test`

Expected: All existing tests pass.

- [ ] **Step 5: Final commit (if needed)**

If any fixes were needed during testing:
```bash
git add .
git commit -m "fix: ensure backward compatibility with expanded color system"
```

If no fixes needed, skip this step.

---

## Spec Coverage Check

- ✅ **Data model expanded to 6 colors** — Task 1 (pageTypes.js)
- ✅ **UI reorganized with grouped display** — Task 2 (BrandingSettings.jsx)
- ✅ **Colors applied as defaults** — Task 3 (pageGenerator.js)
- ⏳ **Colors available as presets** — Task 4 (Optional/Phase 2)
- ✅ **Backward compatibility maintained** — Task 5

---

## Notes

- All code changes preserve existing functionality
- Changes are backward compatible: old pages still load and work
- New colors are applied as **defaults only**—custom overrides still take precedence
- Color presets (Task 4) can be added incrementally to individual color pickers
- No new dependencies required; uses existing React and inline styles
