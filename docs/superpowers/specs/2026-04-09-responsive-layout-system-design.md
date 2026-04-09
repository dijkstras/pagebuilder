# Responsive Layout System Design

**Date:** 2026-04-09
**Purpose:** Replace the manual container/columnSpan layout system with a preset-driven grid that uses Tailwind CSS under the hood. Users pick human-readable layouts ("50/50", "1/3 + 2/3"), get automatic slots, and responsive behaviour works out of the box. No way to create a bad-looking page.

---

## Problem

The current layout system requires users to:
1. Manually add containers to segments
2. Set `columnSpan` (a 12-column concept) on each container
3. Choose `direction: row/column` on the segment
4. Manage gutter values in pixels

This exposes too much technical surface. Users can create broken layouts (columns that don't add up, items that wrap unpredictably, no mobile behaviour). The `responsiveVariants` field exists in the data model but is unused — there is no way to control how a page looks on mobile.

## Design Principles

1. **Invisible grid** — Users never see column counts, spans, or breakpoint widths. The grid system does its job silently.
2. **Preset-driven** — Layouts are chosen from a curated set of well-designed ratios. No arbitrary column widths.
3. **Slots, not containers** — When a layout is selected, the correct number of slots appear automatically. Users place content into slots.
4. **Responsive by default** — Every layout collapses to a single-column stack on mobile. No configuration required.
5. **Guardrails** — The preset system prevents broken layouts. Gap sizes are constrained to a small set of sensible values. Slot widths follow design-tested ratios.

---

## Layout Presets

Each preset defines the desktop column distribution. On mobile (<768px), all presets collapse to a single stacked column.

| Key | Label | Slots | Desktop Grid (Tailwind `col-span-*`) | Visual |
|-----|-------|-------|--------------------------------------|--------|
| `full` | Full width | 1 | `12` | `[████████████]` |
| `50-50` | 50 / 50 | 2 | `6 + 6` | `[██████][██████]` |
| `33-67` | 1/3 + 2/3 | 2 | `4 + 8` | `[████][████████]` |
| `67-33` | 2/3 + 1/3 | 2 | `8 + 4` | `[████████][████]` |
| `33-33-33` | 3 equal | 3 | `4 + 4 + 4` | `[████][████][████]` |
| `25-75` | 1/4 + 3/4 | 2 | `3 + 9` | `[███][█████████]` |
| `75-25` | 3/4 + 1/4 | 2 | `9 + 3` | `[█████████][███]` |
| `25-50-25` | Sidebar layout | 3 | `3 + 6 + 3` | `[███][██████][███]` |

### Preset Data Shape

```javascript
// Stored as a constant, not in page data
const LAYOUT_PRESETS = {
  'full':       { label: 'Full width',    slots: [12] },
  '50-50':      { label: '50 / 50',       slots: [6, 6] },
  '33-67':      { label: '1/3 + 2/3',     slots: [4, 8] },
  '67-33':      { label: '2/3 + 1/3',     slots: [8, 4] },
  '33-33-33':   { label: '3 equal',        slots: [4, 4, 4] },
  '25-75':      { label: '1/4 + 3/4',     slots: [3, 9] },
  '75-25':      { label: '3/4 + 1/4',     slots: [9, 3] },
  '25-50-25':   { label: 'Sidebar layout', slots: [3, 6, 3] }
};
```

---

## Tailwind CSS Integration

### Why Tailwind

The current system generates inline styles, but **inline styles cannot express responsive breakpoints**. To get `@media`-based responsive behaviour, we need either hand-written CSS media queries or a utility framework. Tailwind gives us:

- Battle-tested 12-column grid system
- Mobile-first responsive prefixes (`md:`, `lg:`)
- Utility classes for visibility (`hidden`, `md:block`)
- A CDN version that works with zero build step

### How It Integrates

**Generated HTML only** — Tailwind is included in the iframe preview and final output. The editor UI (React components) keeps its existing inline-style approach.

In `pageGenerator.js`, the generated `<head>` gains:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Layout elements use Tailwind classes. Non-layout styling (colours, backgrounds, fonts, borders, shadows) stays as inline styles. This is a hybrid approach — layout via classes, visual styling via inline styles.

### Tailwind Class Generation

A segment with `layout: '33-67'` and `gap: 'md'` generates:

```html
<section style="/* existing visual styles: bg, padding, etc */">
  <div class="grid grid-cols-12 gap-6 max-w-[1200px] mx-auto">
    <div class="col-span-12 md:col-span-4">
      <!-- slot 1 content -->
    </div>
    <div class="col-span-12 md:col-span-8">
      <!-- slot 2 content -->
    </div>
  </div>
</section>
```

Breakdown:
- `grid grid-cols-12` — 12-column CSS grid
- `gap-6` — mapped from the gap preset
- `col-span-12` — mobile default (full width, stacked)
- `md:col-span-4` — desktop (768px+) takes 4 of 12 columns
- `max-w-[1200px] mx-auto` — from segment `maxWidth` setting

---

## Gap Presets

Replace the free-form pixel `gutter` input with constrained presets:

| Key | Label | Tailwind Class | Pixel Value |
|-----|-------|---------------|-------------|
| `none` | None | `gap-0` | 0px |
| `sm` | Small | `gap-3` | 12px |
| `md` | Medium | `gap-6` | 24px |
| `lg` | Large | `gap-10` | 40px |
| `xl` | Extra large | `gap-16` | 64px |

Default for new segments: `md` (24px — matches the current default `gutter: 24`).

---

## Data Model Changes

### Segment

```javascript
// Before
{
  settings: {
    direction: 'row',       // DEPRECATED for layout purposes
    gutter: 24,             // REPLACED by gap preset
    // ... other settings unchanged
  },
  children: []              // manually managed containers + content
}

// After
{
  settings: {
    layout: '50-50',        // NEW — preset key
    gap: 'md',              // NEW — gap preset key
    // direction: removed from segment settings
    // gutter: removed from segment settings
    // ... other settings (bgColor, padding, margin, etc.) unchanged
  },
  children: []              // auto-managed slots based on layout
}
```

### Slot (replaces Container)

Rename `type: 'container'` to `type: 'slot'` in the data model. The slot concept is narrower and more accurate — a slot is a position within a layout grid, not a free-form container.

```javascript
{
  id: 'slot-1712345678',
  name: 'Left column',
  type: 'slot',
  settings: {
    // Grid position — derived from layout preset, NOT user-editable
    gridColumn: 4,           // NEW — col-span value, set by layout engine

    // Internal layout — how children within the slot are arranged
    direction: 'column',     // keep — slot's internal content flow
    spacing: 16,             // keep — gap between items inside the slot
    contentAlignment: 'left',
    verticalAlignment: 'top',

    // Visual — unchanged
    bgColor: 'transparent',
    bgImage: null,
    bgVideo: null,
    padding: 20,
    borderEnabled: false,
    borderRadius: 0,
    // ... etc.

    // Responsive overrides — NEW
    responsive: {
      hideOnMobile: false,   // hides the entire slot below 768px
      mobileOrder: null      // reorder this slot on mobile (1, 2, 3...)
    }
  },
  children: []               // content items
}
```

### Content Item — Responsive Additions

Every content item gains a `responsive` block in settings:

```javascript
{
  type: 'text',
  settings: {
    // ... existing settings unchanged
    responsive: {
      hideOnMobile: false,   // NEW — hidden below 768px
      hideOnDesktop: false   // NEW — hidden above 768px (show mobile-only content)
    }
  }
}
```

This enables patterns like:
- A detailed data table hidden on mobile, replaced by a simplified card view that's hidden on desktop
- A decorative image hidden on mobile to save space
- A "Download our app" button shown only on mobile

---

## Slot Management

### Automatic Slot Creation

When a user selects a layout preset, the system auto-manages slots:

1. **New segment** — Creating a segment with `layout: '50-50'` auto-creates 2 empty slots with the correct `gridColumn` values.
2. **Changing layout** — If a segment has `layout: '50-50'` (2 slots) and the user switches to `'33-33-33'` (3 slots):
   - Existing slots are preserved in order
   - A new empty slot is appended
   - `gridColumn` values are recalculated
3. **Reducing slots** — If switching from 3 slots to 2 slots:
   - The last slot's children are merged into the second-to-last slot
   - The empty slot is removed
   - User sees a brief confirmation if content would be moved

### Rules

- Users **cannot** manually add or remove slots. The layout preset controls slot count.
- Users **can** add/remove/reorder content items within slots (existing behaviour).
- Users **can** rename slots (for organisation in the structure tree).
- The "+" menu on a segment shows only "Add Content" options, not "Add Container".

---

## UI Changes

### Segment Settings Panel (Right Panel)

Replace the current **Layout Direction** and **Spacing** controls with:

**Layout Picker** — A visual grid selector at the top of segment settings:

```
┌─ Layout ──────────────────────────────────────┐
│                                                │
│  [████████████]     [██████|██████]            │
│   Full width          50 / 50                  │
│                                                │
│  [████|████████]    [████████|████]            │
│   1/3 + 2/3          2/3 + 1/3                │
│                                                │
│  [████|████|████]   [███|█████████]            │
│   3 equal             1/4 + 3/4                │
│                                                │
│  [█████████|███]    [███|██████|███]           │
│   3/4 + 1/4          Sidebar layout            │
│                                                │
└────────────────────────────────────────────────┘
```

Each option is a small visual block showing the column ratio. The active layout has a highlighted border (accent blue). Clicking switches the layout and auto-adjusts slots.

**Gap Selector** — Replaces the free-form spacing input:

```
┌─ Gap ─────────────────────────────────────────┐
│  [None] [Small] [Medium] [Large] [XL]         │
└────────────────────────────────────────────────┘
```

Toggle buttons, same style as existing alignment controls. Default: Medium.

All other segment settings (background, padding, margin, maxWidth, min/max height, border, elevation) remain unchanged.

### Slot Settings Panel (Right Panel)

When a slot is selected, show:

1. **Name** — text input (existing)
2. **Content Direction** — Vertical / Horizontal toggle (existing `direction` control)
3. **Content Alignment** — existing horizontal/vertical alignment buttons
4. **Content Spacing** — existing spacing input for gap between items inside the slot
5. **Background** — existing GradientPicker
6. **Padding** — existing input
7. **Border / Elevation / Corner radius** — existing controls
8. **Responsive** section (NEW):
   - **Hide on mobile** — checkbox. "This slot won't appear on screens smaller than 768px."
   - **Mobile order** — number input (optional). "Override the stacking order on mobile."

Remove: **Size** (width/height) inputs and **columnSpan**. Slot width is now driven by the layout preset.

### Content Item Settings — Responsive Section

Every content type (text, image, button, video, card) gets a new collapsible **Responsive** section at the bottom of its settings:

```
┌─ Responsive ──────────────────────────────────┐
│  [ ] Hide on mobile                            │
│  [ ] Hide on desktop (show mobile only)        │
└────────────────────────────────────────────────┘
```

### Structure Tree (Left Panel)

- Segments show their layout label next to the name: `Hero [50/50]`
- Slots show a column icon instead of the container icon
- Slots cannot be deleted individually (greyed-out delete button, tooltip: "Change the segment layout to adjust slots")
- The "+" menu on a segment no longer shows "Add Container" — only content types
- Content items with `hideOnMobile: true` show a small mobile-hidden indicator icon

### Preview Panel (Center Panel)

- **Desktop mode** — shows the grid layout as designed
- **Mobile mode** (375px toggle, already exists) — shows the stacked single-column layout with responsive visibility applied
- Elements with `hideOnMobile` actually disappear in mobile preview
- Elements with `hideOnDesktop` only appear in mobile preview

---

## Page Generator Changes

### `generateHTML(page)`

Add Tailwind CDN to `<head>`:

```javascript
`<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>${page.title}</title>
  <style>${generateCSS(page)}</style>
</head>`
```

### `renderSegment(segment, page)`

Replace the flexbox inner wrapper with a Tailwind grid:

```javascript
// Current: <div style="display:flex; flex-direction:row; gap:24px; ...">
// New:     <div class="grid grid-cols-12 gap-6 max-w-[1200px] mx-auto">
```

The outer `<section>` keeps its inline styles for visual properties (background, padding, margin, border, elevation, min/max height).

### `renderSlot(slot, page)` (renamed from `renderContainer`)

Generate Tailwind responsive classes:

```javascript
function getSlotClasses(slot) {
  const classes = [];
  const span = slot.settings.gridColumn;

  // Mobile-first: full width
  classes.push('col-span-12');

  // Desktop: use layout span
  if (span !== 12) {
    classes.push(`md:col-span-${span}`);
  }

  // Responsive visibility
  if (slot.settings.responsive?.hideOnMobile) {
    classes.push('hidden md:block');
  }

  // Mobile order override
  if (slot.settings.responsive?.mobileOrder != null) {
    classes.push(`order-${slot.settings.responsive.mobileOrder}`);
    classes.push('md:order-none');
  }

  return classes.join(' ');
}
```

Slot internal layout stays as inline styles (direction, spacing, alignment, background, etc.).

### `renderContentItem(item, page)`

Add responsive visibility classes:

```javascript
function getContentResponsiveClasses(item) {
  const r = item.settings?.responsive;
  if (!r) return '';
  const classes = [];
  if (r.hideOnMobile) classes.push('hidden md:block');
  if (r.hideOnDesktop) classes.push('md:hidden');
  return classes.join(' ');
}
```

The wrapper element for each content item includes these classes alongside its existing inline styles.

### Gap Mapping

```javascript
const GAP_CLASS_MAP = {
  none: 'gap-0',
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-10',
  xl: 'gap-16'
};
```

---

## Migration

### `migratePage()` additions

```javascript
function migrateSegment(segment) {
  // ... existing migrations

  // Layout system migration
  const layout = segment.settings.layout ?? inferLayout(segment);
  const gap = segment.settings.gap ?? inferGap(segment.settings.gutter);

  return {
    ...segment,
    settings: {
      ...segment.settings,
      layout,
      gap
    },
    children: (segment.children ?? []).map(child =>
      child.type === 'container' ? migrateContainerToSlot(child) : migrateContentItem(child)
    )
  };
}

function migrateContainerToSlot(container) {
  return {
    ...container,
    type: 'slot',
    settings: {
      ...container.settings,
      gridColumn: container.settings.columnSpan ?? 12,
      responsive: {
        hideOnMobile: false,
        mobileOrder: null
      }
    }
  };
}
```

**Layout inference from existing data:**

```javascript
function inferLayout(segment) {
  const children = segment.children?.filter(c => c.type === 'container') ?? [];
  if (children.length === 0) return 'full';
  if (children.length === 1) return 'full';

  const spans = children.map(c => c.settings?.columnSpan ?? 12);

  // Try to match to a preset
  const presetMatch = Object.entries(LAYOUT_PRESETS).find(([key, preset]) =>
    preset.slots.length === spans.length &&
    preset.slots.every((s, i) => s === spans[i])
  );

  return presetMatch ? presetMatch[0] : 'full';
}

function inferGap(gutter) {
  if (gutter == null || gutter === 'auto') return 'md';
  if (gutter === 0) return 'none';
  if (gutter <= 16) return 'sm';
  if (gutter <= 32) return 'md';
  if (gutter <= 48) return 'lg';
  return 'xl';
}
```

### Content Item Migration

Add default responsive settings:

```javascript
function migrateContentItem(item) {
  return {
    ...item,
    settings: {
      ...item.settings,
      responsive: item.settings?.responsive ?? {
        hideOnMobile: false,
        hideOnDesktop: false
      }
    }
  };
}
```

---

## Guardrails

How the system prevents bad-looking pages:

| Risk | Guardrail |
|------|-----------|
| Columns don't add up to 12 | Presets guarantee valid column math |
| Broken layout on mobile | Every preset stacks to single column by default |
| Inconsistent spacing | Gap presets instead of arbitrary pixel values |
| Too-narrow columns on small screens | Minimum slot span is 3 (25%) on desktop; everything goes full-width on mobile |
| Orphaned content when changing layout | Content from removed slots merges into the last remaining slot |
| Empty slots look broken | Empty slots show a styled placeholder: "Drop content here" |
| Users create conflicting responsive rules | `hideOnMobile` and `hideOnDesktop` are independent booleans — if both are checked, the element is always hidden (a visible warning appears in settings) |

---

## Files to Change

| File | Changes |
|------|---------|
| `src/store/pageTypes.js` | Add `LAYOUT_PRESETS` constant. Update `createSegment()` to include `layout` and `gap`. Rename `createContainer()` to `createSlot()`. Add `responsive` defaults to content items. Extend `migratePage()` with layout inference and container-to-slot migration. |
| `src/utils/constants.js` | Add `GAP_PRESETS` constant. Remove or deprecate gutter-related helpers if unused. |
| `src/components/SettingsPanel/SegmentSettings.jsx` | Replace direction/spacing controls with layout picker grid and gap preset buttons. |
| `src/components/SettingsPanel/ContainerSettings.jsx` | Rename to `SlotSettings.jsx`. Remove width/height/columnSpan inputs. Add responsive section (hideOnMobile, mobileOrder). |
| `src/components/SettingsPanel/ContentSettings.jsx` | Add responsive section (hideOnMobile, hideOnDesktop) to all content types. |
| `src/components/SettingsPanel/SettingsPanel.jsx` | Route `type: 'slot'` to the new `SlotSettings` component. |
| `src/components/StructureTree/` | Show layout label on segments. Update icons for slots. Disable delete on slots. Remove "Add Container" from segment's add menu. Show mobile-hidden indicator on content items. |
| `src/services/pageGenerator.js` | Add Tailwind CDN `<script>`. Rewrite `renderSegment` inner wrapper to use grid classes. Rename `renderContainer` to `renderSlot` with Tailwind column classes. Add responsive visibility classes to content items. Add gap class mapping. |
| `src/store/pageStore.jsx` | Add a `setLayout(segmentId, presetKey)` action that auto-manages slot creation/removal/merging when layout changes. |

---

## Open Questions

1. **Tailwind CDN dependency** — The CDN play version adds ~300KB on first load. For production output, we could generate static CSS instead. Is CDN acceptable for V1?
2. **Tablet breakpoint** — This spec uses a single breakpoint at 768px (mobile vs. desktop). Should we add a third breakpoint for tablet (e.g., 1024px) with per-preset tablet behaviour?
3. **Custom layouts** — Should we support a "Custom" option where users define their own column ratios (still constrained to the 12-col grid)? Or keep it purely preset-based?
4. **Slot backgrounds on mobile** — When slots stack, should their individual backgrounds (colour, image) still render? Or should they inherit the segment background?
5. **Existing pages** — The migration infers layout from `columnSpan`. For pages with non-standard spans (e.g., `columnSpan: 5 + 7`), should we silently map to the nearest preset or introduce a `custom` layout type?

---

## Out of Scope

- Drag-and-drop content between slots
- Nested grids (grid inside a slot)
- Per-breakpoint font size overrides (existing `responsiveVariants` on text)
- Animation on responsive transitions
- Grid line visualisation in the editor
- Migrating the editor UI itself to Tailwind (stays inline styles)
