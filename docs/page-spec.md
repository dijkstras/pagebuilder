# Page Builder — Architecture & Data Specification

This document describes the complete data model for a page, from top-level structure down to individual content items. Use it as the reference for building new pages, integrations, or tooling on top of this system.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Page](#2-page)
3. [Branding System](#3-branding-system)
   - [Color Slots](#31-color-slots)
   - [Typography Roles](#32-typography-roles)
   - [Button Styles](#33-button-styles)
   - [Spacing & Shape](#34-spacing--shape)
4. [Segments](#4-segments)
   - [Layout Presets](#41-layout-presets)
   - [Segment Settings Reference](#42-segment-settings-reference)
5. [Slots](#5-slots)
   - [Slot Settings Reference](#51-slot-settings-reference)
6. [Content Items](#6-content-items)
   - [Text](#61-text)
   - [Image](#62-image)
   - [Button](#63-button)
   - [Video](#64-video)
   - [Card](#65-card)
   - [Label](#66-label)
7. [Mobile Overrides](#7-mobile-overrides)
8. [Visibility](#8-visibility)
9. [Color Referencing Rules](#9-color-referencing-rules)
10. [Presets & Storage](#10-presets--storage)
11. [Key Invariants](#11-key-invariants)

---

## 1. Architecture Overview

A page is a strict hierarchy. Nothing exists outside it.

```
Page
├── styles (branding: colors, fonts, buttons, spacing)
└── root[]
    └── Segment
        └── children[]
            └── Slot
                └── children[]
                    └── ContentItem (text | image | button | video | card | label)
```

**Rules:**
- A **Page** has one branding definition and an ordered list of segments.
- A **Segment** is a full-width section. It defines a grid layout that determines how many slots it contains.
- A **Slot** occupies N columns within the segment's grid and holds an ordered list of content items.
- A **ContentItem** is a leaf node. It holds the actual content (text, an image, a button, etc.).

---

## 2. Page

The root object. Every other element lives inside it.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique ID, format: `page-{timestamp}` |
| `title` | `string` | Human-readable page name |
| `styles` | `PageStyles` | The page-wide branding definition (see §3) |
| `root` | `Segment[]` | Ordered list of segments |
| `breakpoints` | `object` | Fixed viewport widths for preview |
| `mobileOverrides` | `object` | Mobile-specific branding overrides (see §7) |

**Breakpoints (fixed, not editable):**

| Name | Width |
|------|-------|
| `mobile` | 320px |
| `tablet` | 768px |
| `desktop` | 1024px |

---

## 3. Branding System

`page.styles` is the single source of truth for visual identity. All color, typography, and button decisions cascade from here. Individual elements can reference these values by slot name or override them with a custom hex value.

### 3.1 Color Slots

Seven named color slots. Every slot holds a hex color string. These are the only predefined semantic colors in the system — all other color fields reference one of these by name or bypass the slot system with a custom hex value.

| Slot Name | Default | Role |
|-----------|---------|------|
| `primary` | `#3b82f6` | Main brand color. Used for primary buttons, key highlights. |
| `secondary` | `#8b5cf6` | Supporting brand color. |
| `accent` | `#ec4899` | Tertiary/accent color. |
| `text` | `#1f2937` | Default text color. |
| `background` | `#f9fafb` | Page background. |
| `neutral` | `#6b7280` | Disabled states, secondary buttons, subtle fills. |
| `card` | `#ffffff` | Card and panel backgrounds. |

**How any element references a color:**

Every color-bearing field on every element comes as a pair:

```
bgColor: "#3b82f6"        ← the resolved hex value (always present)
bgColorSlot: "primary"    ← the slot it's linked to, or null for a custom value
```

- If `bgColorSlot` is a valid slot name → the element uses that slot's color. Changing `colors.primary` updates all elements referencing it.
- If `bgColorSlot` is `null` → `bgColor` is a one-off custom color, not linked to any slot.
- If `bgColorSlot` is `"transparent"` → renders as transparent, `bgColor` is ignored.

### 3.2 Typography Roles

Five named roles define all text rendering. Every text element is assigned one role, then optionally overrides the color.

| Role | Default Family | Default Size | Default Weight | Used For |
|------|---------------|-------------|----------------|----------|
| `heading1` | Inter | 48px | 700 | Page titles, hero text |
| `heading2` | Inter | 24px | 600 | Section headings |
| `body` | Inter | 16px | 400 | Paragraphs, descriptions |
| `label` | Inter | 12px | 500 | Tags, captions, small UI text |
| `button` | Inter | — | 500 | Button labels (font size set per button style) |

Each role has the fields:

| Field | Type | Notes |
|-------|------|-------|
| `family` | `string` | Any Google Font name (Inter, Montserrat, Playfair Display, etc.) |
| `size` | `number` | Pixels. Not present on `button` role — button font size is set per button style. |
| `weight` | `number` | Standard CSS font-weight values (300, 400, 500, 600, 700, 800) |

### 3.3 Button Styles

Three predefined button styles. Every button content item is assigned one of these by ID. Changing a style updates all buttons using it.

| ID | Default Role |
|----|-------------|
| `primary` | Main CTA |
| `secondary` | Supporting action |
| `tertiary` | Ghost/text button |

Each button style has:

| Field | Type | Options / Notes |
|-------|------|-----------------|
| `id` | `string` | `primary` \| `secondary` \| `tertiary` |
| `label` | `string` | Display name shown in the editor |
| `bgType` | `string` | `solid` \| `gradient` |
| `bgColor` | `string` | Hex. Used when `bgType` is `solid`. |
| `bgColorSlot` | `string\|null` | Slot reference for background color. |
| `bgGradient` | `object\|null` | `{ color1, color2, angle }`. Used when `bgType` is `gradient`. |
| `textColor` | `string` | Hex. |
| `textColorSlot` | `string\|null` | Slot reference for text color. |
| `fontSize` | `number` | Pixels. |
| `padding` | `number` | Pixels (applied symmetrically). |
| `radius` | `number` | Border radius in px. Presets: `0` (sharp), `6` (rounded), `999` (pill). |

**Default slot assignments:**
- Primary: `bgColorSlot = "primary"`, `textColorSlot = null` (white)
- Secondary: `bgColorSlot = "neutral"`, `textColorSlot = "text"`
- Tertiary: `bgColorSlot = null` (transparent background), `textColorSlot = "primary"`

### 3.4 Spacing & Shape

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `segmentSpacing` | `string` | `sm` \| `md` \| `lg` | Vertical gap between segments on the page |
| `shapes.borderRadius` | `number` | Any px value | Global default border radius, used as a base reference |
| `spacing.xs` | `number` | px | Extra-small spacing token |
| `spacing.sm` | `number` | px | Small spacing token |
| `spacing.md` | `number` | px | Medium spacing token |
| `spacing.lg` | `number` | px | Large spacing token |
| `spacing.xl` | `number` | px | Extra-large spacing token |
| `bgColor` | `string` | Hex | Page background color |
| `bgColorSlot` | `string\|null` | Slot name | Slot reference for page background |

---

## 4. Segments

A segment is a full-width horizontal band on the page. It defines a 12-column grid that is divided among its slots. Segments are ordered — their order in `root[]` is their render order top to bottom.

### 4.1 Layout Presets

The `layout` setting determines how many slots a segment has and how wide each one is.

| Key | Label | Slot Column Spans | Slot Count |
|-----|-------|------------------|-----------|
| `full` | Full Width | 12 | 1 |
| `50-50` | 50 / 50 | 6, 6 | 2 |
| `33-67` | 1/3 + 2/3 | 4, 8 | 2 |
| `67-33` | 2/3 + 1/3 | 8, 4 | 2 |
| `33-33-33` | Three Equal | 4, 4, 4 | 3 |
| `25-75` | 1/4 + 3/4 | 3, 9 | 2 |
| `75-25` | 3/4 + 1/4 | 9, 3 | 2 |
| `25-50-25` | Sidebar + Center | 3, 6, 3 | 3 |

When the layout changes, existing slots are preserved where possible. If the slot count decreases, content from removed slots is merged into the last remaining slot.

### 4.2 Segment Settings Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `layout` | `string` | `full` | Layout preset key (see §4.1) |
| `gap` | `string` | `md` | Gap between slots: `none` \| `sm` (12px) \| `md` (24px) \| `lg` (40px) \| `xl` (64px) |
| `fullWidth` | `boolean` | `false` | Whether the segment ignores the max-width constraint |
| `maxWidth` | `number\|null` | `null` | Max content width in px. `null` = no constraint. |
| `contentAlignment` | `string` | `left` | Horizontal content alignment within slots: `left` \| `center` \| `right` |
| `verticalAlignment` | `string` | `top` | Vertical alignment of slots: `top` \| `center` \| `bottom` |
| `minHeight` | `number` | `0` | Minimum segment height in px |
| **Background** | | | |
| `bgType` | `string` | `solid` | `solid` \| `gradient` |
| `bgColor` | `string` | `#ffffff` | Background hex color |
| `bgColorSlot` | `string\|null` | `null` | Slot reference for background |
| `bgGradient` | `object\|null` | `null` | `{ color1, color2, angle }` — used when `bgType` is `gradient` |
| `bgImage` | `string\|null` | `null` | Background image URL. Overrides color/gradient when set. |
| `bgVideo` | `string\|null` | `null` | Background video URL. Overrides image when set. |
| **Border** | | | |
| `borderEnabled` | `boolean` | `false` | Show border |
| `borderEdges` | `object` | all `true` | Which edges: `{ top, right, bottom, left }` |
| `borderWidth` | `number` | `1` | px |
| `borderColor` | `string` | `#e2e8f0` | Hex |
| `borderColorSlot` | `string\|null` | `null` | Slot reference |
| `borderRadius` | `number` | `0` | px |
| **Elevation** | | | |
| `elevationEnabled` | `boolean` | `false` | Show drop shadow |
| `elevation` | `number` | `4` | Shadow intensity |
| **Segment Heading** | | | |
| `headingEnabled` | `boolean` | `false` | Render a heading above the slot grid |
| `headingContent` | `string` | `""` | Heading text |
| `headingFont` | `string` | `heading2` | Typography role: `heading1` \| `heading2` \| `body` |
| `headingAlignment` | `string` | `left` | `left` \| `center` \| `right` |
| `headingColor` | `string` | `#1f2937` | Hex |
| `headingColorSlot` | `string\|null` | `null` | Slot reference |
| **Visibility** | | | |
| `hidden` | `boolean` | `false` | Hide on all viewports |
| `mobileHidden` | `boolean` | `false` | Hide on mobile only |

---

## 5. Slots

A slot is a column-based container within a segment. It holds an ordered vertical (or horizontal) stack of content items. Each slot maps to a column span in the segment's 12-column grid.

### 5.1 Slot Settings Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `gridColumn` | `number` | set by layout | Column span (1–12). Set automatically from layout preset. |
| `direction` | `string` | `column` | Flex direction for content items: `column` \| `row` |
| `overflow` | `string` | `wrap` | When `direction` is `row`: `wrap` \| `scroll` |
| `contentAlignment` | `string` | `left` | Horizontal alignment: `left` \| `center` \| `right` |
| `verticalAlignment` | `string` | `top` | Vertical alignment: `top` \| `center` \| `bottom` |
| `spacing` | `number\|auto` | `16` | Gap between content items in px, or `auto` |
| `height` | `string` | `auto` | CSS height value (`auto`, `250px`, `50vh`, etc.) |
| `padding` | `number` | `0` | Inner padding in px |
| **Background** | | | |
| `bgType` | `string` | `solid` | `solid` \| `gradient` |
| `bgColor` | `string` | `transparent` | Hex |
| `bgColorSlot` | `string\|null` | `null` | Slot reference |
| `bgGradient` | `object\|null` | `null` | `{ color1, color2, angle }` |
| `bgImage` | `string\|null` | `null` | Background image URL |
| `bgVideo` | `string\|null` | `null` | Background video URL |
| **Border** | | | |
| `borderEnabled` | `boolean` | `false` | Show border |
| `borderWidth` | `number` | `1` | px |
| `borderColor` | `string` | `#e2e8f0` | Hex |
| `borderRadius` | `number` | `0` | px |
| **Elevation** | | | |
| `elevationEnabled` | `boolean` | `false` | Show drop shadow |
| `elevation` | `number` | `4` | Shadow intensity |
| **Responsive** | | | |
| `responsive.mobileOrder` | `number\|null` | `null` | Override render order on mobile |
| **Visibility** | | | |
| `hidden` | `boolean` | `false` | Hide on all viewports |
| `mobileHidden` | `boolean` | `false` | Hide on mobile only |

---

## 6. Content Items

All content items share a `type` discriminator field. Settings are type-specific.

### 6.1 Text

Renders a styled text block. The visual style is defined by a typography role, not raw CSS.

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `type` | `string` | `text` | |
| `settings.textRole` | `string` | `heading1` \| `heading2` \| `body` \| `label` | Which typography role to apply |
| `settings.customOverrides.content` | `string` | | The text content |
| `settings.customOverrides.color` | `string` | Hex | Override the color from the typography role |
| `settings.customOverrides.colorSlot` | `string\|null` | Slot name | Slot reference for color override |
| `settings.hidden` | `boolean` | | Hide on all viewports |
| `settings.mobileHidden` | `boolean` | | Hide on mobile only |
| `settings.mobileOverrides.textAlign` | `string\|null` | `left` \| `center` \| `right` | Override text alignment on mobile |

### 6.2 Image

Renders an image. Sizing is controlled by the containing slot.

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `type` | `string` | `image` | |
| `settings.customOverrides.src` | `string` | URL | Image source |
| `settings.customOverrides.objectFit` | `string` | `contain` \| `cover` \| `stretch` | How the image fills its container |
| `settings.customOverrides.width` | `string\|null` | CSS value | Optional explicit width (e.g. `100%`, `300px`) |
| `settings.customOverrides.borderRadius` | `string\|null` | CSS value | e.g. `8px`, `50%` |
| `settings.customOverrides.opacity` | `string\|number\|null` | 0–1 or `%` | e.g. `0.8`, `"80%"` |
| `settings.hidden` | `boolean` | | |
| `settings.mobileHidden` | `boolean` | | |

### 6.3 Button

Renders a button whose visual style is inherited from one of the three page-level button styles.

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `type` | `string` | `button` | |
| `settings.assignedStyleId` | `string` | `primary` \| `secondary` \| `tertiary` | Which button style to use |
| `settings.customOverrides.label` | `string` | | Button text |
| `settings.customOverrides.icon.key` | `string\|null` | Icon name or `null` | Icon to display |
| `settings.customOverrides.icon.position` | `string` | `none` \| `before` \| `after` | Where the icon appears relative to the label |
| `settings.customOverrides.sizeOverride.enabled` | `boolean` | | Enable explicit size |
| `settings.customOverrides.sizeOverride.width` | `string` | CSS value | e.g. `auto`, `200px`, `100%` |
| `settings.customOverrides.sizeOverride.height` | `string` | CSS value | e.g. `auto`, `48px` |
| `settings.hidden` | `boolean` | | |
| `settings.mobileHidden` | `boolean` | | |

### 6.4 Video

Embeds a video (YouTube URL).

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `type` | `string` | `video` | |
| `settings.customOverrides.src` | `string` | YouTube URL | |
| `settings.customOverrides.objectFit` | `string` | `contain` \| `cover` \| `stretch` | |
| `settings.hidden` | `boolean` | | |
| `settings.mobileHidden` | `boolean` | | |

### 6.5 Card

A self-contained card with an optional image, text block, and button. Unlike a slot, a card is a single content item that carries its own layout and styling.

**Card container settings:**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `type` | `string` | `card` | |
| `settings.width` | `string` | CSS value | e.g. `300px`, `100%` |
| `settings.height` | `string` | CSS value | e.g. `auto`, `400px` |
| `settings.bgType` | `string` | `solid` \| `gradient` | |
| `settings.bgColor` | `string` | Hex | |
| `settings.bgColorSlot` | `string\|null` | Slot name | |
| `settings.bgGradient` | `object\|null` | `{ color1, color2, angle }` | |
| `settings.padding` | `number` | px | Inner padding |
| `settings.direction` | `string` | `column` \| `row` | Layout of sub-elements |
| `settings.contentAlignment` | `string` | `left` \| `center` \| `right` | |
| `settings.verticalAlignment` | `string` | `top` \| `center` \| `bottom` | |
| `settings.spacing` | `number` | px | Gap between sub-elements |
| `settings.borderEnabled` | `boolean` | | |
| `settings.borderWidth` | `number` | px | |
| `settings.borderColor` | `string` | Hex | |
| `settings.borderRadius` | `number` | px | |
| `settings.elevationEnabled` | `boolean` | | |
| `settings.elevation` | `number` | | |
| `settings.hidden` | `boolean` | | |
| `settings.mobileHidden` | `boolean` | | |

**Card sub-elements (each independently toggled):**

| Field | Type | Description |
|-------|------|-------------|
| `settings.showImage` | `boolean` | Whether to render the image |
| `settings.image.src` | `string` | Image URL |
| `settings.image.objectFit` | `string` | `cover` \| `contain` |
| `settings.image.borderRadius` | `string` | CSS value |
| `settings.showText` | `boolean` | Whether to render the text block |
| `settings.text.content` | `string` | Text content |
| `settings.text.textRole` | `string` | `heading2` \| `body` |
| `settings.text.textAlign` | `string` | `left` \| `center` \| `right` |
| `settings.text.color` | `string\|null` | Hex color override |
| `settings.showButton` | `boolean` | Whether to render the button |
| `settings.button.label` | `string` | Button text |
| `settings.button.assignedStyleId` | `string` | `primary` \| `secondary` \| `tertiary` |
| `settings.button.icon.key` | `string\|null` | Icon name |
| `settings.button.icon.position` | `string` | `none` \| `before` \| `after` |

### 6.6 Label

A small inline badge or tag. Purely presentational.

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `type` | `string` | `label` | |
| `settings.content` | `string` | | Text content |
| `settings.textAlign` | `string` | `left` \| `center` \| `right` | |
| `settings.color` | `string` | Hex | Text color |
| `settings.colorSlot` | `string\|null` | Slot name | |
| `settings.bgColor` | `string` | Hex | Background color |
| `settings.bgColorSlot` | `string\|null` | Slot name | |
| `settings.paddingX` | `number` | px | Horizontal padding |
| `settings.paddingY` | `number` | px | Vertical padding |
| `settings.borderEnabled` | `boolean` | | |
| `settings.borderWidth` | `number` | px | |
| `settings.borderColor` | `string` | Hex | |
| `settings.borderRadius` | `number` | px | Default: 4 |
| `settings.hidden` | `boolean` | | |
| `settings.mobileHidden` | `boolean` | | |

---

## 7. Mobile Overrides

The system has a single mobile breakpoint (320px). Rather than duplicating the entire page structure, mobile-specific values are stored as overrides that are merged on top of the desktop values at render time.

### Where overrides live

| Scope | Location |
|-------|----------|
| Page-level branding | `page.mobileOverrides` |
| Segment-specific | `segment.settings.mobileOverrides` |
| Slot-specific | `slot.settings.mobileOverrides` |
| Content item | `contentItem.settings.mobileOverrides` |

### Page-level mobile override fields

```
page.mobileOverrides = {
  bgColor: string | null,
  bgColorSlot: string | null,
  segmentSpacing: 'sm' | 'md' | 'lg' | null,
  fonts: { [role]: { family, size, weight } },
  colors: { [slotName]: "#hexvalue" },
  buttonStyles: { [buttonId]: Partial<ButtonStyle> }
}
```

### Segment-level mobile override fields

| Field | Type | Description |
|-------|------|-------------|
| `gap` | `string\|null` | Override gap between slots |
| `bgColor` | `string\|null` | Override background color |
| `bgColorSlot` | `string\|null` | Override background slot |
| `bgPositionX` | `string\|null` | Override background image horizontal position |
| `bgSize` | `string\|null` | Override background image size |
| `hidden` | `boolean\|null` | Override visibility |

### Slot-level mobile override fields

| Field | Type | Description |
|-------|------|-------------|
| `direction` | `string\|null` | Override flex direction |
| `overflow` | `string\|null` | Override overflow behavior |
| `contentAlignment` | `string\|null` | Override horizontal alignment |
| `verticalAlignment` | `string\|null` | Override vertical alignment |
| `spacing` | `number\|string\|null` | Override item gap |
| `height` | `string\|null` | Override slot height |
| `padding` | `number\|null` | Override padding |

### Content-level mobile override fields

| Field | Type | Description |
|-------|------|-------------|
| `textAlign` | `string\|null` | Text items only: override text alignment |

---

## 8. Visibility

Every element (segment, slot, content item) has two independent visibility flags:

| Field | Effect |
|-------|--------|
| `hidden: true` | Element is invisible on all viewports |
| `mobileHidden: true` | Element is invisible only when viewport ≤ 320px |

Both can be set on the same element independently. `hidden` takes precedence.

---

## 9. Color Referencing Rules

Every color-bearing field follows this convention without exception:

```
someColor:     "#hexvalue"   ← always present, holds the resolved color
someColorSlot: "slotname"    ← or null if not linked to a slot
```

| `someColorSlot` value | Behavior |
|----------------------|----------|
| A slot name (`"primary"`, etc.) | Uses the color from `page.styles.colors[slotName]`. Updating the slot updates all referencing elements. |
| `null` | Uses `someColor` directly. One-off custom color. |
| `"transparent"` | Renders transparent. `someColor` is ignored. |

This pattern applies to: segment backgrounds, slot backgrounds, card backgrounds, button backgrounds, button text, label text, label backgrounds, heading colors, text color overrides, and border colors.

---

## 10. Presets & Storage

### Saved Pages

Each page is stored as a single JSON file (`{title}.json`) in the `/templates/` directory. The file contains the complete page object exactly as described in §2.

### Color Presets

Saved color schemes. Stored in `/color-presets/`. Applying a preset replaces `page.styles.colors` in full.

```json
{
  "name": "MT Dark",
  "colors": {
    "primary": "#ff8b1f",
    "secondary": "#fdc86d",
    "accent": "#66ae1e",
    "text": "#ffffff",
    "background": "#000000",
    "neutral": "#20201d",
    "card": "#1d1d20"
  },
  "savedAt": "ISO 8601 timestamp"
}
```

### Typography Presets

Saved font configurations. Stored in `/typography-presets/`. Applying a preset replaces `page.styles.fonts` in full.

```json
{
  "name": "Mindtickle Marketing",
  "fonts": {
    "heading1": { "family": "Montserrat", "size": 55, "weight": 300 },
    "heading2": { "family": "Montserrat", "size": 24, "weight": 600 },
    "body":     { "family": "Inter",       "size": 16, "weight": 400 },
    "label":    { "family": "Inter",       "size": 12, "weight": 500 },
    "button":   { "family": "Montserrat",             "weight": 500 }
  },
  "savedAt": "ISO 8601 timestamp"
}
```

---

## 11. Key Invariants

These rules are enforced by the system. Any implementation must respect them.

1. **Color fields always come in pairs.** `bgColor` without `bgColorSlot` (or vice versa) is invalid. If no slot is wanted, set `bgColorSlot: null`.

2. **Slot count matches the layout.** A segment with `layout: "50-50"` must always have exactly 2 slots. Changing layout merges or creates slots automatically — it never leaves a mismatch.

3. **Column spans must sum correctly.** Slot `gridColumn` values for slots in a segment must match the layout preset's column spans. Do not set these manually; they are managed by the layout system.

4. **Typography roles are the only way to style text.** There is no inline font size or font family on a text item. You change the appearance of text by changing the role assigned to it, or by changing what the role itself looks like in `page.styles.fonts`.

5. **Button appearance is always inherited.** A button content item does not define its own colors, radius, or font. It references a button style by ID. Per-button overrides are limited to: label, icon, and explicit size.

6. **IDs are type-prefixed and unique.** Format: `{type}-{timestamp}-{random}`. Never reuse or hardcode IDs.

7. **Mobile overrides are additive.** A `null` value in a mobile override means "use the desktop value." Only set fields you want to actually override.

8. **`hidden` takes precedence over `mobileHidden`.** An element with `hidden: true` is always hidden, regardless of `mobileHidden`.

9. **Breakpoints are fixed.** The mobile/tablet/desktop widths (320/768/1024) are not configurable per page.

10. **Gradients require `bgType: "gradient"`.** Setting `bgGradient` without setting `bgType` to `"gradient"` has no effect. The `bgType` field is always the active discriminator.
