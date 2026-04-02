# Button Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gradient backgrounds, per-style font size, a shared Button typography slot, a 12-icon picker per button instance, automatic hover states (brightness-based), and confirm size override works for buttons.

**Architecture:** Extend the existing `buttonStyles` data model with `bgType/bgGradient/fontSize` fields. Add a `button` font entry to `styles.fonts`. Reuse `GradientPicker` as-is for button backgrounds. Generate hover CSS via a `<style>` block in the HTML output using `filter: brightness(0.88)`. Icons are stored in a static registry and rendered as inline SVG.

**Tech Stack:** React, inline styles, pageGenerator.js (HTML/CSS output), Redux-style pageStore

---

## File Map

| File | Change |
|------|--------|
| `src/store/pageTypes.js` | Add `button` font, new buttonStyle fields, icon to createContentItem, migration |
| `src/utils/buttonIcons.js` | **Create** — static registry of 12 SVG icon strings |
| `src/components/SettingsPanel/BrandingSettings.jsx` | Typography Button slot, GradientPicker in ButtonEditor, fontSize input, hover preview |
| `src/components/SettingsPanel/ContentSettings.jsx` | Icon picker (position toggle + icon grid) in button section |
| `src/services/pageGenerator.js` | Gradient render, button font vars, fontSize, icon rendering, hover `<style>` block |

---

### Task 1: Data model — pageTypes.js

**Files:**
- Modify: `src/store/pageTypes.js`

- [ ] **Step 1: Add `button` font + new buttonStyle fields to `createEmptyPage`**

In `createEmptyPage`, update the `fonts` object and each `buttonStyle` entry:

```js
fonts: {
  heading1: { family: 'Inter', size: 48, weight: 700 },
  heading2: { family: 'Inter', size: 32, weight: 600 },
  body: { family: 'Inter', size: 16, weight: 400 },
  label: { family: 'Inter', size: 12, weight: 500 },
  button: { family: 'Inter', weight: 500 }   // ← add this line
},
buttonStyles: [
  {
    id: 'primary',
    label: 'Primary',
    bgColor: '#3b82f6',
    bgType: 'solid',       // ← add
    bgGradient: null,      // ← add
    fontSize: 14,          // ← add
    textColor: '#ffffff',
    padding: 12,
    radius: 6
  },
  {
    id: 'secondary',
    label: 'Secondary',
    bgColor: '#e5e7eb',
    bgType: 'solid',       // ← add
    bgGradient: null,      // ← add
    fontSize: 14,          // ← add
    textColor: '#1f2937',
    padding: 12,
    radius: 6
  },
  {
    id: 'tertiary',
    label: 'Tertiary',
    bgColor: 'transparent',
    bgType: 'solid',       // ← add
    bgGradient: null,      // ← add
    fontSize: 14,          // ← add
    textColor: '#3b82f6',
    padding: 12,
    radius: 6
  }
],
```

- [ ] **Step 2: Add `icon` to button `customOverrides` in `createContentItem`**

Find the button branch of `createContentItem` and add `icon`:

```js
: contentType === CONTENT_TYPES.BUTTON
  ? { label: 'Button', icon: { key: null, position: 'none' } }
```

- [ ] **Step 3: Update `migratePage` for new button font + buttonStyle fields**

In `migratePage`, update the `fonts` migration and add buttonStyle field migration:

```js
fonts: {
  heading1: migrateFontToken(page.styles?.fonts?.heading1, { size: 48, weight: 700 }),
  heading2: migrateFontToken(page.styles?.fonts?.heading2, { size: 32, weight: 600 }),
  body: migrateFontToken(page.styles?.fonts?.body, { size: 16, weight: 400 }),
  label: migrateFontToken(page.styles?.fonts?.label, { size: 12, weight: 500 }),
  button: page.styles?.fonts?.button ?? { family: 'Inter', weight: 500 }   // ← add
},
// update buttonStyles migration (replace existing buttonStyles line):
buttonStyles: buttonStyles.map(b => ({
  ...b,
  bgType: b.bgType ?? 'solid',
  bgGradient: b.bgGradient ?? null,
  fontSize: b.fontSize ?? 14
})),
```

Also migrate icon in button `customOverrides`. In the existing `migrateSegment` and `migrateContainer` functions, button content items pass through unchanged (children mapping does not deep-merge customOverrides). The icon field is added by `createContentItem` for new buttons. For existing buttons without `icon`, add a migration guard in `migratePage` by adding a `migrateContentItem` helper and applying it in the segment/container children maps:

```js
// Add this helper function near the bottom of pageTypes.js
function migrateContentItem(item) {
  if (item.type !== 'button') return item;
  const overrides = item.settings?.customOverrides ?? {};
  if (overrides.icon) return item;
  return {
    ...item,
    settings: {
      ...item.settings,
      customOverrides: { ...overrides, icon: { key: null, position: 'none' } }
    }
  };
}
```

Then in `migrateSegment`, update the children map:
```js
children: (segment.children ?? []).map(child =>
  child.type === 'container' ? migrateContainer(child) : migrateContentItem(child)
)
```

And in `migrateContainer`:
```js
children: (container.children ?? []).map(child =>
  child.type === 'container' ? migrateContainer(child) : migrateContentItem(child)
)
```

- [ ] **Step 4: Commit**

```bash
git add src/store/pageTypes.js
git commit -m "feat: extend button data model with font, gradient, fontSize, icon fields"
```

---

### Task 2: Icon registry

**Files:**
- Create: `src/utils/buttonIcons.js`

- [ ] **Step 1: Create the icon registry file**

```js
// src/utils/buttonIcons.js

export const BUTTON_ICON_ORDER = [
  'arrow-right', 'arrow-left', 'chevron-right', 'chevron-left',
  'plus', 'external-link', 'download', 'check',
  'star', 'heart', 'send', 'play'
];

export const BUTTON_ICONS = {
  'arrow-right': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  'arrow-left': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  'chevron-right': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  'chevron-left': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  'plus': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  'external-link': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  'download': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  'check': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  'star': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  'send': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  'play': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
};
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/buttonIcons.js
git commit -m "feat: add button icon registry with 12 SVG icons"
```

---

### Task 3: BrandingSettings — Typography Button slot

**Files:**
- Modify: `src/components/SettingsPanel/BrandingSettings.jsx`

- [ ] **Step 1: Add `button` to `TYPOGRAPHY_STYLES`**

Find `TYPOGRAPHY_STYLES` and add the button entry:

```js
const TYPOGRAPHY_STYLES = [
  { key: 'heading1', label: 'Heading 1', previewText: 'The quick brown fox' },
  { key: 'heading2', label: 'Heading 2', previewText: 'The quick brown fox' },
  { key: 'body', label: 'Body', previewText: 'The quick brown fox jumps over the lazy dog.' },
  { key: 'label', label: 'Label', previewText: 'Label text' },
  { key: 'button', label: 'Button', previewText: 'Click me' }   // ← add
];
```

- [ ] **Step 2: Skip the size input for the `button` key in `TypographySettings`**

In the `TypographySettings` render, the `<div>` containing the size input is currently always shown. Wrap the size input `<div>` in a condition:

```jsx
{/* Size + Weight row */}
<div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
  {style.key !== 'button' && (
    <div style={{ flex: 1 }}>
      <label style={labelStyle}>Size (px)</label>
      <input
        type="number"
        value={fonts[style.key].size}
        onChange={(e) => handleFontChange(style.key, 'size', parseInt(e.target.value) || 0)}
        min="8"
        max="96"
        style={inputStyle}
      />
    </div>
  )}
  <div style={{ flex: 1 }}>
    <label style={labelStyle}>Weight</label>
    <select
      value={fonts[style.key].weight}
      onChange={(e) => handleFontChange(style.key, 'weight', parseInt(e.target.value))}
      style={inputStyle}
    >
      {FONT_WEIGHTS.map(w => (
        <option key={w.value} value={w.value}>{w.label}</option>
      ))}
    </select>
  </div>
</div>
```

- [ ] **Step 3: Guard against missing `size` in the live preview for button**

The preview div uses `fontSize: \`${fonts[style.key].size}px\`` — this will be `undefinedpx` for the button slot. Fix:

```jsx
<div style={{
  marginTop: '10px',
  padding: '10px 12px',
  backgroundColor: '#1f2937',
  borderRadius: '6px',
  fontFamily: fonts[style.key].family,
  fontWeight: fonts[style.key].weight,
  fontSize: style.key !== 'button' ? `${fonts[style.key].size}px` : '14px',
  color: '#f3f4f6'
}}>
  {style.previewText}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsPanel/BrandingSettings.jsx
git commit -m "feat: add Button typography slot to branding settings"
```

---

### Task 4: BrandingSettings — ButtonEditor with gradient, fontSize, hover preview

**Files:**
- Modify: `src/components/SettingsPanel/BrandingSettings.jsx`

- [ ] **Step 1: Import GradientPicker at the top of BrandingSettings.jsx**

Add after the existing imports:

```js
import { GradientPicker } from './GradientPicker.jsx';
```

- [ ] **Step 2: Add `darkenHex` helper function** (used for hover preview only)

Add before `ButtonEditor`:

```js
function darkenHex(hex, amount = 0.15) {
  if (!hex || hex === 'transparent') return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

- [ ] **Step 3: Update `ButtonEditor` — gradient preview + replace background section + add fontSize + hover preview**

Replace the entire `ButtonEditor` function with:

```jsx
function ButtonEditor({ style: btnStyle, onChange, colors = {} }) {
  const shapeValue = SHAPE_PRESETS.find(s => s.value === btnStyle.radius)?.value ?? 'custom';
  const isCustomRadius = !SHAPE_PRESETS.some(s => s.value === btnStyle.radius);
  const isGradient = btnStyle.bgType === 'gradient' && btnStyle.bgGradient;
  const isOutline = btnStyle.bgColor === 'transparent' && !isGradient;

  const previewStyle = {
    display: 'inline-block',
    padding: `${btnStyle.padding}px 20px`,
    backgroundColor: (!isGradient && !isOutline) ? btnStyle.bgColor : isOutline ? 'transparent' : undefined,
    backgroundImage: isGradient
      ? `linear-gradient(${btnStyle.bgGradient.angle}deg, ${btnStyle.bgGradient.color1}, ${btnStyle.bgGradient.color2})`
      : undefined,
    color: btnStyle.textColor,
    borderRadius: `${btnStyle.radius}px`,
    fontSize: `${btnStyle.fontSize || 14}px`,
    fontWeight: 500,
    border: isOutline ? `1.5px solid ${btnStyle.textColor}` : 'none',
    cursor: 'default'
  };

  // Hover preview: darken the base color or gradient start for display only
  const hoverBg = isGradient
    ? `linear-gradient(${btnStyle.bgGradient.angle}deg, ${darkenHex(btnStyle.bgGradient.color1)}, ${darkenHex(btnStyle.bgGradient.color2)})`
    : isOutline ? undefined : darkenHex(btnStyle.bgColor);
  const hoverPreviewStyle = {
    ...previewStyle,
    backgroundColor: (!isGradient && !isOutline) ? hoverBg : undefined,
    backgroundImage: isGradient ? hoverBg : undefined,
    opacity: isOutline ? 0.7 : undefined
  };

  return (
    <div>
      {/* Preview */}
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <span style={previewStyle}>{btnStyle.label}</span>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px', textAlign: 'center' }}>normal</div>
        </div>
        <span style={{ color: '#4b5563', fontSize: '14px' }}>→</span>
        <div>
          <span style={hoverPreviewStyle}>{btnStyle.label}</span>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px', textAlign: 'center' }}>hover</div>
        </div>
      </div>

      {/* Label */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Label</label>
        <input
          type="text"
          value={btnStyle.label}
          onChange={(e) => onChange('label', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Background — GradientPicker */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Background</label>
        <GradientPicker
          bgType={btnStyle.bgType || 'solid'}
          bgColor={btnStyle.bgColor}
          bgGradient={btnStyle.bgGradient}
          onUpdate={onChange}
          colors={colors}
        />
      </div>

      {/* Text color */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Text color</label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
          <input
            type="color"
            value={btnStyle.textColor}
            onChange={(e) => onChange('textColor', e.target.value)}
            style={{ width: '36px', height: '36px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #4b5563', padding: '2px', backgroundColor: '#374151', flexShrink: 0 }}
          />
          <input
            type="text"
            value={btnStyle.textColor}
            onChange={(e) => onChange('textColor', e.target.value)}
            style={{ flex: 1, ...inputStyle }}
          />
        </div>
        {Object.keys(colors).length > 0 && (
          <ColorPresets colors={colors} onSelectColor={(color) => onChange('textColor', color)} />
        )}
      </div>

      {/* Font size */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Font size (px)</label>
        <input
          type="number"
          value={btnStyle.fontSize || 14}
          min="10"
          max="32"
          onChange={(e) => onChange('fontSize', parseInt(e.target.value) || 14)}
          style={inputStyle}
        />
      </div>

      {/* Shape */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Shape</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SHAPE_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => onChange('radius', preset.value)}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: '12px',
                backgroundColor: btnStyle.radius === preset.value ? '#3b82f6' : '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {isCustomRadius && (
          <div style={{ marginTop: '6px' }}>
            <label style={labelStyle}>Custom radius (px)</label>
            <input
              type="number"
              value={btnStyle.radius}
              min="0"
              onChange={(e) => onChange('radius', parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* Padding */}
      <div>
        <label style={labelStyle}>Padding (px)</label>
        <input
          type="number"
          value={btnStyle.padding}
          min="0"
          onChange={(e) => onChange('padding', parseInt(e.target.value) || 0)}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsPanel/BrandingSettings.jsx
git commit -m "feat: add gradient, fontSize, hover preview to ButtonEditor in branding"
```

---

### Task 5: ContentSettings — Icon picker

**Files:**
- Modify: `src/components/SettingsPanel/ContentSettings.jsx`

- [ ] **Step 1: Import icon registry at the top of ContentSettings.jsx**

Add after existing imports:

```js
import { BUTTON_ICONS, BUTTON_ICON_ORDER } from '../../utils/buttonIcons.js';
```

- [ ] **Step 2: Add icon picker UI in the button section**

Find the button section in ContentSettings. It ends after the label input (around the closing `</>` of the button section). Add the icon picker between the label input and the closing fragment — after the label `<div>` and before `</>`:

```jsx
          {/* Icon */}
          <div style={{ marginBottom: '16px', marginTop: '16px' }}>
            <label style={labelStyle}>Icon</label>
            {/* Position toggle */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {[
                { value: 'none', label: 'None' },
                { value: 'before', label: 'Before' },
                { value: 'after', label: 'After' }
              ].map(opt => {
                const iconOverride = content.settings.customOverrides.icon || { key: null, position: 'none' };
                const isActive = (iconOverride.position || 'none') === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleCustomUpdate('icon', { ...(content.settings.customOverrides.icon || { key: null, position: 'none' }), position: opt.value })}
                    style={{
                      flex: 1,
                      padding: '5px',
                      fontSize: '12px',
                      backgroundColor: isActive ? '#3b82f6' : '#374151',
                      color: isActive ? '#fff' : '#9ca3af',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Icon grid — shown only when position is not 'none' */}
            {(content.settings.customOverrides.icon?.position || 'none') !== 'none' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {BUTTON_ICON_ORDER.map(iconKey => {
                  const isSelected = content.settings.customOverrides.icon?.key === iconKey;
                  return (
                    <button
                      key={iconKey}
                      title={iconKey}
                      onClick={() => handleCustomUpdate('icon', { ...(content.settings.customOverrides.icon || { key: null, position: 'before' }), key: iconKey })}
                      style={{
                        padding: '7px',
                        backgroundColor: isSelected ? '#3b82f6' : '#374151',
                        border: `1px solid ${isSelected ? '#3b82f6' : '#4b5563'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f3f4f6'
                      }}
                      dangerouslySetInnerHTML={{ __html: BUTTON_ICONS[iconKey] }}
                    />
                  );
                })}
              </div>
            )}
          </div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsPanel/ContentSettings.jsx
git commit -m "feat: add icon picker to button instance settings"
```

---

### Task 6: pageGenerator.js — Gradient, font vars, fontSize, icons, hover styles

**Files:**
- Modify: `src/services/pageGenerator.js`

- [ ] **Step 1: Import button icons at the top**

Add after the existing import:

```js
import { BUTTON_ICONS } from '../utils/buttonIcons.js';
```

- [ ] **Step 2: Add `darkenColor` and `collectButtons` helpers**

Add these two functions before `buildStyleString`:

```js
function darkenColor(hex, amount = 0.15) {
  if (!hex || hex === 'transparent') return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function collectButtonItems(segments) {
  const items = [];
  for (const seg of segments) {
    for (const child of seg.children) {
      if (child.type === 'container') {
        for (const item of child.children) {
          if (item.type === 'button') items.push(item);
        }
      } else if (child.type === 'button') {
        items.push(child);
      }
    }
  }
  return items;
}
```

- [ ] **Step 3: Add `generateButtonHoverStyles` function**

Add after `collectButtonItems`:

```js
function generateButtonHoverStyles(page) {
  const buttons = collectButtonItems(page.root);
  if (buttons.length === 0) return '';
  const rules = buttons.map(item => {
    const buttonStyle = page.styles.buttonStyles.find(s => s.id === item.settings.assignedStyleId)
      || page.styles.buttonStyles[0];
    const isOutline = buttonStyle?.bgColor === 'transparent' && buttonStyle?.bgType !== 'gradient';
    if (isOutline) {
      return `  [data-element-id="${item.id}"]:hover { opacity: 0.7; transition: opacity 0.15s ease; }`;
    }
    return `  [data-element-id="${item.id}"]:hover { filter: brightness(0.88); transition: filter 0.15s ease; }`;
  }).join('\n');
  return `\n  <style>\n${rules}\n  </style>`;
}
```

- [ ] **Step 4: Inject hover styles in `generateHTML`**

In `generateHTML`, after `const selectionStyle = ...` and before `return`, add:

```js
const hoverStyles = generateButtonHoverStyles(page);
```

Then in the returned HTML template, after `${selectionStyle}` add `${hoverStyles}`:

```js
  </style>${selectionStyle}${hoverStyles}
```

- [ ] **Step 5: Add button CSS variables to `generateCSS`**

In `generateCSS`, add two lines to the `:root` block after the label font vars:

```js
      --font-button-family: ${fonts.button?.family ?? 'Inter'}, sans-serif;
      --font-button-weight: ${fonts.button?.weight ?? 500};
```

- [ ] **Step 6: Update `generateGoogleFontsImport` to include button font**

The function already iterates `Object.values(fonts)`, so no change needed — the `button` font entry will be picked up automatically once added to the data model (Task 1).

- [ ] **Step 7: Update the `button` case in `renderContentItem`**

Replace the entire `case 'button':` block:

```js
case 'button': {
  const buttonStyle = page.styles.buttonStyles.find(s => s.id === item.settings.assignedStyleId)
    || page.styles.buttonStyles[0];
  const { width, height } = sizeOverrides(item);

  const isGradient = buttonStyle?.bgType === 'gradient' && buttonStyle?.bgGradient;
  const bgColor = item.settings.customOverrides.bgColor || buttonStyle?.bgColor || '#3b82f6';
  const isOutline = bgColor === 'transparent' && !isGradient;
  const textColor = item.settings.customOverrides.textColor || buttonStyle?.textColor || '#ffffff';
  const fontSize = buttonStyle?.fontSize || 14;

  let backgroundImage;
  if (isGradient) {
    const { angle, color1, color2 } = buttonStyle.bgGradient;
    backgroundImage = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
  }

  const btnStyle = buildStyleString({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: (!isGradient && !isOutline) ? bgColor : isOutline ? 'transparent' : undefined,
    backgroundImage,
    color: textColor,
    padding: `${buttonStyle?.padding || 12}px 24px`,
    borderRadius: `${buttonStyle?.radius || 6}px`,
    border: isOutline ? `1.5px solid ${textColor}` : 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-button-family)',
    fontWeight: 'var(--font-button-weight)',
    fontSize: `${fontSize}px`,
    whiteSpace: 'nowrap',
    width,
    height,
    textDecoration: 'none'
  });

  const iconData = item.settings.customOverrides.icon;
  const iconKey = iconData?.key;
  const iconPosition = iconData?.position || 'none';
  const iconSvg = (iconKey && iconPosition !== 'none' && BUTTON_ICONS[iconKey]) ? BUTTON_ICONS[iconKey] : '';

  const label = item.settings.customOverrides.label || 'Button';
  const inner = iconPosition === 'before'
    ? `${iconSvg}${label}`
    : iconPosition === 'after'
      ? `${label}${iconSvg}`
      : label;

  return `<button style="${btnStyle}" data-element-id="${item.id}">${inner}</button>`;
}
```

- [ ] **Step 8: Commit**

```bash
git add src/services/pageGenerator.js
git commit -m "feat: button generator supports gradient, button font, fontSize, icons, hover states"
```

---

### Task 7: Verify everything works end-to-end

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

Expected: no console errors, dev server starts at localhost

- [ ] **Step 2: Verify Branding > Typography**

- Open the app, go to Branding > Typography
- Confirm a "Button" row appears after Label
- Change the font family and confirm the change persists
- Confirm no "Size" input appears for Button (unlike other rows)

- [ ] **Step 3: Verify Branding > Buttons**

- Go to Branding > Buttons, expand Primary
- Confirm GradientPicker is shown for background (Solid/Gradient toggle)
- Switch to Gradient, verify gradient preview updates
- Confirm Font size input is present
- Confirm hover preview shows a darkened version of the button

- [ ] **Step 4: Verify icon picker in instance settings**

- Add a button to the canvas
- Select it, open settings
- Confirm Icon section with None/Before/After toggle
- Select "Before", confirm 12-icon grid appears
- Pick an icon, verify it renders in the canvas preview

- [ ] **Step 5: Verify generated HTML**

- Click "Export" or open the generated HTML preview
- Inspect a button element — confirm gradient background, button font vars, icon SVG inline
- Hover over a button in the preview — confirm hover effect (brightness darkening)

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: verify button enhancements complete"
```
