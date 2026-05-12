# Page Builder — Architecture & Data Specification

This document is a guided tour through the page builder's data model. It starts at the top (the page itself) and works down through every layer: branding, segments, slots, and content items. Each field is explained — not just what it is, but why it exists and what it does in practice.

If you're new to the system, read it top to bottom. If you're looking for a specific field, jump to the relevant section.

---

## Table of Contents

1. [Mental Model](#1-mental-model)
2. [Page](#2-page)
3. [Branding System](#3-branding-system)
   - [Color Slots](#31-color-slots)
   - [Typography Roles](#32-typography-roles)
   - [Button Styles](#33-button-styles)
   - [Spacing & Shape](#34-spacing--shape)
4. [Segments](#4-segments)
   - [Layout Presets](#41-layout-presets)
   - [Segment Settings](#42-segment-settings)
5. [Slots](#5-slots)
   - [Slot Settings](#51-slot-settings)
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
11. [Implementation: Technology Reference](#11-implementation-technology-reference)
    - [Stack Overview](#111-stack-overview)
    - [The Grid System](#112-the-grid-system)
    - [Typography & Fonts](#113-typography--fonts)
    - [Colors & Backgrounds](#114-colors--backgrounds)
    - [Borders, Shadows & Spacing](#115-borders-shadows--spacing)
    - [Mobile Rendering](#116-mobile-rendering)
    - [What Uses Tailwind vs Inline Styles](#117-what-uses-tailwind-vs-inline-styles)
12. [Key Invariants](#12-key-invariants)

---

## 1. Mental Model

A page is built from four nested concepts, each with a clear job. If you understand the responsibilities of each layer, everything else falls into place.

```
┌──────────────────────────────────────────────────────────────┐
│ PAGE                                                         │
│  ├── BRANDING (colors, fonts, button styles — set once)      │
│  │                                                           │
│  ├── SEGMENT  (horizontal band, defines a column grid)       │
│  │     ├── SLOT  (one column in the grid, holds content)     │
│  │     │    ├── CONTENT ITEM (text, image, button, ...)      │
│  │     │    ├── CONTENT ITEM                                 │
│  │     │    └── CONTENT ITEM                                 │
│  │     └── SLOT                                              │
│  │          └── CONTENT ITEM                                 │
│  │                                                           │
│  └── SEGMENT                                                 │
│        └── ...                                               │
└──────────────────────────────────────────────────────────────┘
```

**The responsibilities of each layer:**

- **Page** — the document. Owns the branding (everything visual cascades from here) and an ordered list of segments.
- **Segment** — a horizontal section of the page. Like a row in a newspaper. Its job is to define a grid (1, 2, or 3 columns) and provide a backdrop (color, image, video).
- **Slot** — one column inside a segment. Its job is to be a container that arranges content items vertically or horizontally.
- **Content Item** — the actual stuff a reader sees: a paragraph, a button, an image, a card.

**Why this matters:** branding lives at the top so that changing a single color or font updates the whole page. Layout lives in segments so the grid system is consistent. Content lives in slots so that authors can rearrange items without thinking about CSS.

---

## 2. Page

The page is the root of everything. A single page renders to one URL.

```
Page object
  ├─ id              "page-1715000000000"
  ├─ title           "Home"
  ├─ breakpoints     { mobile: 320, tablet: 768, desktop: 1024 }
  ├─ styles          ────► the entire branding system (see §3)
  ├─ root[]          ────► ordered list of segments (see §4)
  └─ mobileOverrides ────► mobile-specific overrides (see §7)
```

| Field | Type | What it's for |
|-------|------|---------------|
| `id` | `string` | Unique identifier. Auto-generated as `page-{timestamp}`. Never displayed; used by the system to track this page across save/load operations. |
| `title` | `string` | The page's name. Appears in the page grid (the dashboard listing all pages) and is used as the filename when saving. |
| `breakpoints` | `object` | The pixel widths at which mobile/tablet/desktop previews are rendered. **These are fixed at 320 / 768 / 1024** and exist so designers can preview how the page looks at different sizes. They are not user-editable. |
| `styles` | `PageStyles` | The page's complete branding definition (see §3). This is the single source of truth for colors, fonts, and button styles. |
| `root` | `Segment[]` | Ordered array of segments. The order here is the visual order top-to-bottom on the page. |
| `mobileOverrides` | `object` | Optional. Lets the page have different branding values on mobile (e.g. a smaller heading size). See §7. |

**Visual: a page is just a stack of segments.**

```
┌─ Page ──────────────────────┐
│ ┌─────────────────────────┐ │
│ │ Segment 1 (hero)        │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Segment 2 (features)    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Segment 3 (CTA)         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## 3. Branding System

`page.styles` is where the page's visual identity is defined. Anything that has a color, a font, or a button style can either reference one of these branding values or override it with a custom value.

The branding system has four parts: **colors**, **typography**, **buttons**, and **spacing/shape**.

**Why it exists:** if a marketing team decides to change their primary brand color, they should be able to do it once and see every primary button, headline accent, and highlighted card update across the whole page. Without a branding layer, every element would need to be edited individually.

### 3.1 Color Slots

The page has seven named **color slots**. A slot is a semantic role — "primary" doesn't mean a specific color, it means "whatever color we've decided is our main brand color." Any element on the page can reference a slot by name, and changing the slot's value updates every referencing element automatically.

```
page.styles.colors = {
  primary:    "#3b82f6"  ┐
  secondary:  "#8b5cf6"  │  ← these 7 hex values are referenced
  accent:     "#ec4899"  │     by every element on the page
  text:       "#1f2937"  │
  background: "#f9fafb"  │
  neutral:    "#6b7280"  │
  card:       "#ffffff"  ┘
}
```

| Slot | Default | What it's for |
|------|---------|---------------|
| `primary` | `#3b82f6` | The main brand color. Used for primary CTAs, key accents, and important highlights. This is the "loudest" color in the brand. |
| `secondary` | `#8b5cf6` | The supporting brand color. Used alongside primary to add variety without competing — e.g. a secondary section background or a complementary button. |
| `accent` | `#ec4899` | A pop color. Used sparingly for emphasis: badges, tags, hover states, decorative elements. |
| `text` | `#1f2937` | The default body text color. Every paragraph and label uses this unless overridden. |
| `background` | `#f9fafb` | The default page background. Segments inherit this unless they specify their own background. |
| `neutral` | `#6b7280` | A muted color for non-critical UI: disabled states, secondary buttons, subtle dividers, captions. |
| `card` | `#ffffff` | The background color for cards and panels. Kept separate from `background` so cards can visually "lift" off the page even when the page background changes. |

**Visual: changing one slot updates everything that references it.**

```
Before:                          After (primary changed to red):
┌────────────────────┐           ┌────────────────────┐
│  [Buy Now]  ← blue │           │  [Buy Now]  ← red  │
│                    │           │                    │
│  Feature title     │           │  Feature title     │
│  ───────── ← blue  │           │  ───────── ← red   │
│                    │           │                    │
│  ★ Featured  ← blue│           │  ★ Featured  ← red │
└────────────────────┘           └────────────────────┘
   colors.primary = #3b82f6         colors.primary = #ef4444
```

See §9 for the rules on how elements reference these slots.

### 3.2 Typography Roles

Instead of letting authors pick fonts and sizes per text element (which leads to chaos), the system defines five **typography roles**. Each role is a complete font definition. Every text item picks one of these roles, and the role decides what it looks like.

```
page.styles.fonts = {
  heading1: { family: "Inter", size: 48, weight: 700 }  ← big titles
  heading2: { family: "Inter", size: 24, weight: 600 }  ← section heads
  body:     { family: "Inter", size: 16, weight: 400 }  ← paragraphs
  label:    { family: "Inter", size: 12, weight: 500 }  ← captions, tags
  button:   { family: "Inter",           weight: 500 }  ← button labels
}
```

| Role | Used For | Why It Exists |
|------|----------|---------------|
| `heading1` | Page titles, hero text | The biggest, boldest text. There should usually be only one per segment to maintain visual hierarchy. |
| `heading2` | Section headings, card titles | Subordinate to heading1 but still prominent. Used when a segment has multiple sub-sections. |
| `body` | Paragraphs, descriptions, long text | The default reading text. Sized for comfortable reading at normal viewing distance. |
| `label` | Tags, captions, small UI text | Small supporting text. Used for badges, image captions, form labels. |
| `button` | Button labels | Separate role because buttons need consistent typography across the page regardless of the surrounding text. Notably has no `size` — button font size is set per button style (see §3.3). |

Each role has:

| Field | Type | Notes |
|-------|------|-------|
| `family` | `string` | Any Google Font name. Common choices: Inter, Montserrat, Playfair Display, Roboto, Open Sans. |
| `size` | `number` | Font size in pixels. **Not present on the `button` role** — button font size is owned by the button style. |
| `weight` | `number` | Standard CSS weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold). |

**Why fonts are roles, not raw values:** if every text item set its own font, changing the brand typography would mean editing hundreds of elements. With roles, you update `heading1` once and every heading on the page changes.

### 3.3 Button Styles

There are exactly **three** button styles on every page: `primary`, `secondary`, and `tertiary`. Every button on the page must reference one of these. You cannot define a fourth style.

```
page.styles.buttonStyles = [
  ┌─ primary ─────────────────────┐  ← the main CTA. Most visible.
  │ bgColor:   primary slot       │
  │ textColor: white              │
  │ radius:    6px                │
  └───────────────────────────────┘

  ┌─ secondary ───────────────────┐  ← supporting action. Less visible.
  │ bgColor:   neutral slot       │
  │ textColor: text slot          │
  │ radius:    6px                │
  └───────────────────────────────┘

  ┌─ tertiary ────────────────────┐  ← ghost/text button. Least visible.
  │ bgColor:   transparent        │
  │ textColor: primary slot       │
  │ radius:    6px                │
  └───────────────────────────────┘
]
```

**Why only three:** a clear button hierarchy is essential to user experience. A page with five button styles is a page where every action looks equally important — which means none of them do. Three slots forces the team to make explicit decisions about button priority.

Each button style has:

| Field | Type | Options | What it does |
|-------|------|---------|--------------|
| `id` | `string` | `primary` \| `secondary` \| `tertiary` | The identifier buttons reference. |
| `label` | `string` | | Display name shown in the editor (e.g. "Primary CTA"). Not rendered on the page. |
| `bgType` | `string` | `solid` \| `gradient` | Whether the background is a flat color or a gradient. |
| `bgColor` | `string` | Hex | The background color when `bgType` is `solid`. |
| `bgColorSlot` | `string\|null` | Slot name | Slot reference for the background. See §9 for how this works. |
| `bgGradient` | `object\|null` | `{ color1, color2, angle }` | The gradient definition when `bgType` is `gradient`. `angle` is in degrees. |
| `textColor` | `string` | Hex | The button label color. |
| `textColorSlot` | `string\|null` | Slot name | Slot reference for the text. |
| `fontSize` | `number` | px | The button's text size. Lives here (not in typography) so buttons can be visually larger than body text without changing the body role. |
| `padding` | `number` | px | Symmetric inner padding. Larger padding = bigger button. |
| `radius` | `number` | px | Border radius. Common presets: `0` (sharp/square), `6` (rounded — most common), `999` (pill). |

### 3.4 Spacing & Shape

Foundational tokens used throughout the system.

```
page.styles.spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
page.styles.shapes  = { borderRadius: 6 }
page.styles.segmentSpacing = "md"
page.styles.bgColor = "#f9fafb"
```

| Field | Type | What it does |
|-------|------|--------------|
| `segmentSpacing` | `sm \| md \| lg` | The vertical gap between segments on the page. `sm` = tight, `lg` = generous. This is a high-level rhythm setting. |
| `shapes.borderRadius` | `number` | A base radius value other elements can default to. Helps keep "rounded" elements visually consistent. |
| `spacing.xs..xl` | `number` (px) | Five spacing tokens used as a scale. Useful as a reference when setting paddings and gaps elsewhere. |
| `bgColor` / `bgColorSlot` | hex / slot ref | The page-wide background color. Typically references the `background` slot. |

---

## 4. Segments

A **segment** is a full-width horizontal band on the page — think of it as a row in a magazine spread, or a section on a landing page. Its job is twofold:

1. **Divide horizontally** — define a grid of 1, 2, or 3 columns (called slots).
2. **Provide a backdrop** — color, image, gradient, or video behind everything in the segment.

Segments are stacked vertically in the order they appear in `page.root[]`.

```
┌─ Segment (50/50 layout) ─────────────────────────────┐
│ ┌────────────────────┬────────────────────────────┐  │
│ │     Slot 1         │       Slot 2               │  │
│ │     (50%)          │       (50%)                │  │
│ │                    │                            │  │
│ │  ┌─ image  ─┐      │   ┌─ heading ─────┐        │  │
│ │  └──────────┘      │   └───────────────┘        │  │
│ │                    │   ┌─ body text ───┐        │  │
│ │                    │   └───────────────┘        │  │
│ │                    │   ┌─ button ─┐             │  │
│ │                    │   └──────────┘             │  │
│ └────────────────────┴────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.1 Layout Presets

The `layout` setting on a segment determines how many slots it has and how wide each one is. The system uses a 12-column grid internally; each preset divides those 12 columns differently.

| Key | Visual | Slot Spans | Use Case |
|-----|--------|-----------|----------|
| `full` | `│■■■■■■■■■■■■│` | [12] | Single-column content. Hero text, image gallery. |
| `50-50` | `│■■■■■■│■■■■■■│` | [6, 6] | Image + text. Two equal features. |
| `33-67` | `│■■■■│■■■■■■■■│` | [4, 8] | Narrow sidebar + main content. |
| `67-33` | `│■■■■■■■■│■■■■│` | [8, 4] | Main content + sidebar. |
| `33-33-33` | `│■■■■│■■■■│■■■■│` | [4, 4, 4] | Three feature columns. |
| `25-75` | `│■■■│■■■■■■■■■│` | [3, 9] | Compact sidebar + main. |
| `75-25` | `│■■■■■■■■■│■■■│` | [9, 3] | Main content + compact sidebar. |
| `25-50-25` | `│■■■│■■■■■■│■■■│` | [3, 6, 3] | Center content with two flanking sidebars. |

**Important behavior:** changing the layout doesn't destroy your content. If you switch from `50-50` to `full`, the two slots are merged — the second slot's content is appended to the first. If you switch from `full` to `50-50`, a new empty slot is added.

### 4.2 Segment Settings

Every segment has the following settings. Grouped by purpose.

**Layout**

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `layout` | `string` | `full` | The grid preset (see §4.1). Determines slot count and widths. |
| `gap` | `string` | `md` | The horizontal gap between slots. Values: `none` (0), `sm` (12px), `md` (24px), `lg` (40px), `xl` (64px). Use larger gaps when slots have different visual weights and need breathing room. |
| `fullWidth` | `boolean` | `false` | If `true`, the segment ignores the page's max-width constraint and extends edge-to-edge. Useful for backgrounds that should bleed to the screen edges. |
| `maxWidth` | `number\|null` | `null` | An explicit max content width in pixels. `null` uses the page default. |
| `contentAlignment` | `string` | `left` | Horizontal alignment of content inside slots: `left`, `center`, `right`. |
| `verticalAlignment` | `string` | `top` | Vertical alignment of slots when they have different heights: `top`, `center`, `bottom`. |
| `minHeight` | `number` | `0` | Minimum segment height in pixels. Useful for hero sections that should always be tall, even with little content. |

**Background**

The background is what's drawn *behind* the slots. Backgrounds layer in priority: video > image > gradient/solid color.

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `bgType` | `string` | `solid` | `solid` or `gradient`. Switches between a flat color and a two-color gradient. |
| `bgColor` | `string` | `#ffffff` | The solid background color (when `bgType` is `solid`). |
| `bgColorSlot` | `string\|null` | `null` | Slot reference for the background color. See §9. |
| `bgGradient` | `object\|null` | `null` | `{ color1, color2, angle }`. Used when `bgType` is `gradient`. `angle` is in degrees (0 = top-to-bottom, 90 = left-to-right). |
| `bgImage` | `string\|null` | `null` | Background image URL. If set, **overrides** the color/gradient. |
| `bgVideo` | `string\|null` | `null` | Background video URL. If set, **overrides** the image. |

**Border**

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `borderEnabled` | `boolean` | `false` | Master toggle for the border. |
| `borderEdges` | `object` | all `true` | `{ top, right, bottom, left }`. Each edge can be enabled independently — useful for adding only a top or bottom divider. |
| `borderWidth` | `number` | `1` | Border thickness in pixels. |
| `borderColor` / `borderColorSlot` | hex / slot ref | `#e2e8f0` | Border color (see §9). |
| `borderRadius` | `number` | `0` | Corner rounding in pixels. |

**Elevation (drop shadow)**

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `elevationEnabled` | `boolean` | `false` | Master toggle for drop shadow. |
| `elevation` | `number` | `4` | Shadow intensity. Higher numbers = larger, softer shadow, suggesting more "depth" off the page. |

**Segment Heading (optional)**

A built-in heading that renders above the slot grid. Saves you from manually placing a text item every time you want a section title.

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `headingEnabled` | `boolean` | `false` | Master toggle. If `false`, no heading is rendered. |
| `headingContent` | `string` | `""` | The heading text. |
| `headingFont` | `string` | `heading2` | Which typography role to use: `heading1`, `heading2`, or `body`. |
| `headingAlignment` | `string` | `left` | `left`, `center`, or `right`. |
| `headingColor` / `headingColorSlot` | hex / slot ref | `#1f2937` | Text color (see §9). |

**Visibility**

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `hidden` | `boolean` | `false` | Hide on all viewports. |
| `mobileHidden` | `boolean` | `false` | Hide on mobile only. |

See §8 for how these interact.

---

## 5. Slots

A **slot** is a single column inside a segment. Its job is to act as a container that arranges content items — vertically (default) or horizontally — and decorates them with its own background, padding, and border.

A slot doesn't choose its own width. The width is determined by the segment's layout preset.

```
┌─ Slot (50% wide, column direction) ──┐
│                                      │
│  ┌─ heading text ──┐    ← gap        │
│  └─────────────────┘                 │
│                                      │
│  ┌─ body text ─────┐    ← gap        │
│  │ lorem ipsum...  │                 │
│  └─────────────────┘                 │
│                                      │
│  ┌─ button ─┐                        │
│  └──────────┘                        │
│                                      │
└──────────────────────────────────────┘
```

### 5.1 Slot Settings

**Layout & Sizing**

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `gridColumn` | `number` | from layout | The column span (1–12). **Set automatically** when the segment's layout changes. Don't set this manually. |
| `direction` | `string` | `column` | `column` (stack vertically) or `row` (lay out horizontally). Use `row` for things like icon-grids or horizontal scrolling content. |
| `overflow` | `string` | `wrap` | When `direction` is `row`: `wrap` (items wrap to new lines) or `scroll` (horizontal scrolling). |
| `contentAlignment` | `string` | `left` | Horizontal alignment of items inside the slot: `left`, `center`, `right`. |
| `verticalAlignment` | `string` | `top` | Vertical alignment: `top`, `center`, `bottom`. |
| `spacing` | `number\|"auto"` | `16` | The gap between content items in pixels. `auto` lets the system pick based on content. |
| `height` | `string` | `auto` | CSS height value: `auto`, `250px`, `50vh`, etc. Use a fixed height when the slot needs to match a sibling's height. |
| `padding` | `number` | `0` | Inner padding in pixels. Push content away from the slot's edges. |

**Background**

Same model as segments: video > image > gradient/solid.

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `bgType` | `string` | `solid` | `solid` or `gradient`. |
| `bgColor` / `bgColorSlot` | hex / slot ref | `transparent` | Background color (see §9). |
| `bgGradient` | `object\|null` | `null` | `{ color1, color2, angle }`. |
| `bgImage` | `string\|null` | `null` | Background image URL. |
| `bgVideo` | `string\|null` | `null` | Background video URL. |

**Border & Elevation**

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `borderEnabled` | `boolean` | `false` | Toggle border. |
| `borderWidth` | `number` | `1` | Border thickness in px. |
| `borderColor` | `string` | `#e2e8f0` | Border color (hex). |
| `borderRadius` | `number` | `0` | Corner rounding in px. |
| `elevationEnabled` | `boolean` | `false` | Toggle drop shadow. |
| `elevation` | `number` | `4` | Shadow intensity. |

**Responsive & Visibility**

| Field | Type | Default | What it controls |
|-------|------|---------|------------------|
| `responsive.mobileOrder` | `number\|null` | `null` | Override the render order on mobile. Useful when a sidebar (right slot on desktop) should appear *first* on mobile. |
| `hidden` | `boolean` | `false` | Hide on all viewports. |
| `mobileHidden` | `boolean` | `false` | Hide on mobile only. |

---

## 6. Content Items

A **content item** is a leaf node — it holds actual content (a paragraph, a button label, an image URL). There are six types. Every content item has a `type` field that determines which settings apply.

```
type = "text"   ────►  6.1
type = "image"  ────►  6.2
type = "button" ────►  6.3
type = "video"  ────►  6.4
type = "card"   ────►  6.5
type = "label"  ────►  6.6
```

All content items share two universal fields: `hidden` and `mobileHidden` (see §8).

### 6.1 Text

A block of styled text. The styling comes entirely from the assigned typography role — there is no inline font size or family.

```
TextItem
  type:                            "text"
  settings.textRole:               "heading1" │ "heading2" │ "body" │ "label"
  settings.customOverrides.content:  "Welcome to our site"
  settings.customOverrides.color:    "#333333"   (optional override)
  settings.customOverrides.colorSlot: "text"     (optional slot ref)
```

| Field | What it controls |
|-------|------------------|
| `textRole` | Which of the five typography roles to apply. This is the primary styling decision. |
| `customOverrides.content` | The actual text content. Can contain plain text. |
| `customOverrides.color` / `colorSlot` | Optional color override. If not set, the text uses the role's default color (which is the `text` slot). Set this when you want, e.g., a heading in your `accent` color. |
| `mobileOverrides.textAlign` | Override text alignment specifically on mobile (e.g., center-aligned on mobile, left-aligned on desktop). |

**Why styling is role-based:** if every text item had its own font, the page would quickly become visually inconsistent. By forcing authors to pick a role, the page maintains a clean typographic hierarchy and updating brand typography means changing one definition, not hundreds of elements.

### 6.2 Image

An image rendered at the size of its container, with control over how it fills that container.

```
ImageItem
  type:                                  "image"
  settings.customOverrides.src:          "https://..."
  settings.customOverrides.objectFit:    "contain" │ "cover" │ "stretch"
  settings.customOverrides.width:        "100%" │ "300px" │ null
  settings.customOverrides.borderRadius: "8px"
  settings.customOverrides.opacity:      "0.8"
```

| Field | What it controls |
|-------|------------------|
| `src` | The image URL. |
| `objectFit` | How the image fills its slot. `cover` = fill the container, crop if needed (common for hero images). `contain` = fit the whole image inside, leaving empty space if needed (common for logos). `stretch` = distort to fill exactly (rarely desirable). |
| `width` | Optional explicit width. If `null`, the image fills its slot's width. |
| `borderRadius` | Rounding on image corners. Useful for avatars (use `50%` for a circle) or rounded thumbnails. |
| `opacity` | Transparency. Use to fade an image into a background. |

**Visual: objectFit options.**

```
container = 4:3                cover         contain        stretch
image    = 1:1                ┌────────┐    ┌────────┐    ┌────────┐
                              │■ crop ■│    │  ■■    │    │ stretch│
                              │  fill  │    │  ■■    │    │ distort│
                              │■ crop ■│    │        │    │        │
                              └────────┘    └────────┘    └────────┘
```

### 6.3 Button

A button whose visual style comes from one of the three page-level button styles (§3.3). The content item only controls *which* style to use plus the label and an optional icon.

```
ButtonItem
  type:                                          "button"
  settings.assignedStyleId:                      "primary" │ "secondary" │ "tertiary"
  settings.customOverrides.label:                "Get Started"
  settings.customOverrides.icon.key:             "arrow-right" │ null
  settings.customOverrides.icon.position:        "before" │ "after" │ "none"
  settings.customOverrides.sizeOverride.enabled: false
  settings.customOverrides.sizeOverride.width:   "auto"
  settings.customOverrides.sizeOverride.height:  "auto"
```

| Field | What it controls |
|-------|------------------|
| `assignedStyleId` | Which of the three button styles (`primary`, `secondary`, `tertiary`) this button uses. Changes the entire appearance. |
| `label` | The visible button text. |
| `icon.key` | The name of an icon (e.g. `arrow-right`, `plus`, `search`). `null` for no icon. |
| `icon.position` | Whether the icon appears `before` the label, `after` the label, or `none` (hidden). |
| `sizeOverride.enabled` | If `true`, the button uses explicit width/height instead of sizing to its content. |
| `sizeOverride.width` / `height` | CSS values. Use this for buttons that must match a specific footprint (e.g. all card CTAs should be the same width). |

**Why button appearance isn't customizable per-button:** if every button could have its own color and radius, the page would lose its visual hierarchy. Users couldn't reliably tell which action is "the main one." Centralizing button styles into three roles forces a meaningful distinction between primary, secondary, and tertiary actions.

### 6.4 Video

An embedded video, typically from YouTube.

```
VideoItem
  type:                                "video"
  settings.customOverrides.src:        "https://youtube.com/watch?v=..."
  settings.customOverrides.objectFit:  "contain" │ "cover" │ "stretch"
```

| Field | What it controls |
|-------|------------------|
| `src` | The video URL (YouTube format). |
| `objectFit` | How the video fits its container. Same semantics as images. |

### 6.5 Card

A self-contained box with optional image, text, and button — all in one. A card is a composite element, but it's a *single* content item, not a slot with multiple items inside it.

**Why cards are their own type:** repeating "image + text + button" patterns (like product cards, team member cards, feature highlights) would be painful to build slot-by-slot. The card type packages them together with consistent styling and the ability to toggle each sub-element on or off.

```
┌─ Card ──────────────────┐
│ ┌─ image ─────────────┐ │  ← showImage: true
│ │                     │ │
│ │     [photo]         │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
│  Heading text           │  ← showText: true
│  Supporting body...     │
│                         │
│  [ Learn more → ]       │  ← showButton: true
│                         │
└─────────────────────────┘
```

**Container settings** (same idea as slot, but applied to the card box):

| Field | What it controls |
|-------|------------------|
| `width` / `height` | Card dimensions. Often `300px` width, `auto` height. |
| `bgType` / `bgColor` / `bgColorSlot` / `bgGradient` | Card background. |
| `padding` | Inner padding. |
| `direction` | `column` (image on top, text below) or `row` (image on the side). |
| `contentAlignment` / `verticalAlignment` | How the image/text/button are aligned inside the card. |
| `spacing` | Gap between the image, text, and button blocks. |
| `borderEnabled` / `borderWidth` / `borderColor` / `borderRadius` | Border styling. |
| `elevationEnabled` / `elevation` | Drop shadow. Cards commonly use elevation to feel "lifted." |

**Sub-element toggles:**

| Field | What it controls |
|-------|------------------|
| `showImage` | If `true`, render the image block. |
| `showText` | If `true`, render the text block. |
| `showButton` | If `true`, render the button. |

**Image sub-element:**

| Field | What it controls |
|-------|------------------|
| `image.src` | Image URL. |
| `image.objectFit` | `cover` or `contain`. |
| `image.borderRadius` | Corner rounding on the card image (separate from the card itself). |

**Text sub-element:**

| Field | What it controls |
|-------|------------------|
| `text.content` | The text content. |
| `text.textRole` | `heading2` or `body`. |
| `text.textAlign` | `left`, `center`, `right`. |
| `text.color` | Optional hex color override. |

**Button sub-element:**

| Field | What it controls |
|-------|------------------|
| `button.label` | Button text. |
| `button.assignedStyleId` | Which button style (`primary` / `secondary` / `tertiary`). |
| `button.icon.key` / `position` | Icon settings (same as a normal button). |
| `button.sizeOverride` | Same as a normal button. |

### 6.6 Label

A small inline tag or badge. Pure decoration — no interactive behavior.

```
┌─ NEW ─┐    ┌─ Featured ─┐    ┌─ Sale ─┐
└───────┘    └────────────┘    └────────┘
```

**Why a separate type:** labels have very different sizing and styling needs from text (they're small, padded, and often have backgrounds). Treating them as their own type keeps the text type focused on prose.

| Field | What it controls |
|-------|------------------|
| `content` | The label text. |
| `textAlign` | `left`, `center`, `right`. |
| `color` / `colorSlot` | Text color (see §9). |
| `bgColor` / `bgColorSlot` | Background color. |
| `paddingX` / `paddingY` | Horizontal/vertical inner padding. |
| `borderEnabled` / `borderWidth` / `borderColor` | Optional border. |
| `borderRadius` | Corner rounding. Default is `4`. Set to `999` for a pill shape. |

---

## 7. Mobile Overrides

Rather than maintaining two completely separate page structures (one for desktop, one for mobile), the system uses a single page definition plus **mobile overrides** — a sparse set of values that apply only on small screens.

**The rule:** if a mobile override field is `null` or absent, the desktop value is used. If it's set, it replaces the desktop value when the viewport is mobile.

```
Desktop render:               Mobile render:
┌──────────────────┐          ┌──────────┐
│ heading1: 48px   │          │ heading1: 32px │  ← mobileOverride.fonts.heading1.size = 32
│ segments: md gap │          │ segments: sm   │  ← mobileOverride.segmentSpacing = "sm"
│ left + right     │          │ left           │  ← right slot has mobileHidden = true
└──────────────────┘          │ (right hidden) │
                              └──────────┘
```

Mobile overrides live at four different scopes, depending on what they affect:

| Scope | Where it lives | What it can override |
|-------|----------------|----------------------|
| **Page** | `page.mobileOverrides` | The branding system: colors, fonts, button styles, page background, segment spacing. |
| **Segment** | `segment.settings.mobileOverrides` | Per-segment things: gap, background, visibility. |
| **Slot** | `slot.settings.mobileOverrides` | Per-slot things: direction, alignment, spacing, height, padding. |
| **Content item** | `contentItem.settings.mobileOverrides` | Per-item things: text alignment (currently the main use case). |

**Page-level overrides:**

```
page.mobileOverrides = {
  bgColor:        string | null,
  bgColorSlot:    string | null,
  segmentSpacing: "sm" | "md" | "lg" | null,
  fonts:          { [role]: { family, size, weight } },
  colors:         { [slotName]: "#hex" },
  buttonStyles:   { [buttonId]: Partial<ButtonStyle> }
}
```

**Segment-level overrides:** `gap`, `bgColor`, `bgColorSlot`, `bgPositionX`, `bgSize`, `hidden`.

**Slot-level overrides:** `direction`, `overflow`, `contentAlignment`, `verticalAlignment`, `spacing`, `height`, `padding`.

**Content-level overrides:** `textAlign` (text items).

---

## 8. Visibility

Two independent boolean flags on every segment, slot, and content item:

| Field | When `true` |
|-------|-------------|
| `hidden` | The element is invisible on **all** viewports. |
| `mobileHidden` | The element is invisible **only** on mobile (≤ 320px viewport). |

```
hidden=false, mobileHidden=false   →  visible everywhere
hidden=false, mobileHidden=true    →  visible on desktop/tablet, hidden on mobile
hidden=true,  mobileHidden=false   →  hidden everywhere
hidden=true,  mobileHidden=true    →  hidden everywhere (hidden wins)
```

`hidden` always wins over `mobileHidden`.

**Use cases:**
- `hidden: true` — temporarily disable a section without deleting it. Useful for seasonal content (Black Friday banner, etc.).
- `mobileHidden: true` — hide secondary content on mobile to save space (e.g. an illustrative side image that doesn't add value on small screens).

---

## 9. Color Referencing Rules

This is the most important convention in the system. Every color-bearing field comes as a **pair**: the resolved hex value, and an optional slot reference.

```
bgColor:     "#3b82f6"     ← always present — the actual color to render
bgColorSlot: "primary"     ← which slot this is linked to, or null
```

The slot reference determines how the color is resolved:

| `bgColorSlot` value | Behavior |
|---------------------|----------|
| A slot name like `"primary"` | The color comes from `page.styles.colors[slotName]`. Updating the slot updates this element automatically. |
| `null` | The color is custom — read `bgColor` directly, ignore the slot system. |
| `"transparent"` | The element is rendered transparent. `bgColor` is ignored. |

**Why this design:** authors want both options. Most of the time you want a button to use the brand primary color, so referencing `"primary"` means it updates with the brand. But sometimes you need a one-off color for a specific moment, and forcing it through a slot would pollute the brand system. The pair handles both cases cleanly.

This pattern applies to **every** color field in the system:
- segment backgrounds, slot backgrounds, card backgrounds
- button backgrounds and text colors
- label backgrounds and text colors
- segment heading colors
- text item color overrides
- border colors

```
Example: a button with a custom (non-slot) background color

  bgType:      "solid"
  bgColor:     "#fa8072"     ← custom salmon color
  bgColorSlot: null          ← not linked to any slot — won't update if "primary" changes

Example: a button using the primary slot

  bgType:      "solid"
  bgColor:     "#3b82f6"     ← current value of primary slot (updated automatically)
  bgColorSlot: "primary"     ← linked to the primary slot
```

---

## 10. Presets & Storage

### Saved Pages

Each page is stored as a single JSON file at `/templates/{title}.json`. The file contains the complete page object exactly as described in §2.

### Color Presets

Saved color schemes live in `/color-presets/`. Each preset is a complete set of all 7 color slot values. Applying a preset replaces `page.styles.colors` in full.

```json
{
  "name": "MT Dark",
  "colors": {
    "primary":    "#ff8b1f",
    "secondary":  "#fdc86d",
    "accent":     "#66ae1e",
    "text":       "#ffffff",
    "background": "#000000",
    "neutral":    "#20201d",
    "card":       "#1d1d20"
  },
  "savedAt": "2026-04-15T09:52:04.776Z"
}
```

**Why presets:** they let teams build a library of approved color schemes (light mode, dark mode, holiday theme) and swap between them instantly without re-entering values.

### Typography Presets

Saved font configurations live in `/typography-presets/`. Each preset is a complete set of all 5 typography role definitions.

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
  "savedAt": "2026-04-15T10:08:09.786Z"
}
```

---

## 11. Implementation: Technology Reference

This section tells you exactly which technology to reach for when building a feature, so you don't re-derive what's already been established.

### 11.1 Stack Overview

| Concern | Technology | How it's loaded |
|---------|-----------|-----------------|
| Grid layout & responsive visibility | **Tailwind CSS** (utility classes) | `<script src="https://cdn.tailwindcss.com">` in generated HTML |
| All visual styling (colors, shadows, borders, etc.) | **Inline styles** (JS object → CSS string) | Applied directly as `style="..."` attributes |
| Typography values | **CSS custom properties** (variables) | `<style>:root { --font-heading1-size: 48px; … }</style>` injected at render time |
| Font files | **Google Fonts** | `@import url('https://fonts.googleapis.com/css2?…')` dynamically built from which fonts the page actually uses |
| Mobile breakpoint overrides | **Generated `@media` CSS** | `<style>@media (max-width: 767px) { … }</style>` injected at render time |

**There is no custom `tailwind.config.js`.** The project uses vanilla Tailwind off the CDN. Do not invent custom Tailwind classes or assume a custom theme — only standard Tailwind utilities are available.

---

### 11.2 The Grid System

The grid is built on Tailwind's `grid` and `grid-cols-12` utilities. Every segment grid container gets these classes:

```html
<div class="grid grid-cols-12 gap-6 w-full max-w-full">
  <!-- slots go here -->
</div>
```

**Slot column spans** use Tailwind's responsive `col-span` utilities. On mobile, every slot is always full-width (`col-span-12`). The desktop width is applied from the `md:` breakpoint up:

```html
<!-- A slot with gridColumn: 6 (half-width on desktop) -->
<div class="col-span-12 md:col-span-6">...</div>

<!-- A slot with gridColumn: 4 (one-third on desktop) -->
<div class="col-span-12 md:col-span-4">...</div>
```

**How layout presets translate to `col-span` values:**

```
Layout "full"       → one slot  → md:col-span-12
Layout "50-50"      → two slots → md:col-span-6  + md:col-span-6
Layout "33-67"      → two slots → md:col-span-4  + md:col-span-8
Layout "67-33"      → two slots → md:col-span-8  + md:col-span-4
Layout "33-33-33"   → three    → md:col-span-4  + md:col-span-4  + md:col-span-4
Layout "25-75"      → two slots → md:col-span-3  + md:col-span-9
Layout "75-25"      → two slots → md:col-span-9  + md:col-span-3
Layout "25-50-25"   → three    → md:col-span-3  + md:col-span-6  + md:col-span-3
```

**Gap** between slots is a Tailwind `gap-N` class applied to the grid container. Use the values from this table — do not use arbitrary gap values:

| `segment.settings.gap` | Tailwind class | Rendered gap |
|------------------------|---------------|-------------|
| `none` | `gap-0` | 0px |
| `sm` | `gap-3` | 12px |
| `md` | `gap-6` | 24px *(default)* |
| `lg` | `gap-10` | 40px |
| `xl` | `gap-16` | 64px |

**Max-width constraint:** when a segment has `maxWidth` set, add `mx-auto` and an arbitrary-value class:
```html
<div class="grid grid-cols-12 gap-6 w-full md:max-w-[1200px] mx-auto">
```

**Mobile column reordering:** when a slot has `responsive.mobileOrder` set, use Tailwind's `order-N` with `md:order-none` to reset on desktop:
```html
<!-- This slot should appear first on mobile even if it's the second slot in the DOM -->
<div class="col-span-12 md:col-span-6 order-1 md:order-none">...</div>
```

---

### 11.3 Typography & Fonts

**Do not hardcode font values.** All font sizes, families, and weights are stored in CSS custom properties and must be read from there. This is how changing a typography role in the branding panel updates every text element on the page.

**CSS custom properties injected at page render time:**

```css
:root {
  --font-heading1-family: Montserrat, sans-serif;
  --font-heading1-size:   55px;
  --font-heading1-weight: 300;

  --font-heading2-family: Montserrat, sans-serif;
  --font-heading2-size:   24px;
  --font-heading2-weight: 600;

  --font-body-family:     Inter, sans-serif;
  --font-body-size:       16px;
  --font-body-weight:     400;

  --font-label-family:    Inter, sans-serif;
  --font-label-size:      12px;
  --font-label-weight:    500;

  --font-button-family:   Montserrat, sans-serif;
  --font-button-weight:   500;
  /* note: no --font-button-size — button font size comes from the button style */
}
```

**How to apply typography to a text element (inline style):**

```javascript
// Text item with textRole = "heading1"
style="font-family: var(--font-heading1-family);
       font-size:   var(--font-heading1-size);
       font-weight: var(--font-heading1-weight);
       line-height: 1.2;"

// Text item with textRole = "body"
style="font-family: var(--font-body-family);
       font-size:   var(--font-body-size);
       font-weight: var(--font-body-weight);
       line-height: 1.6;"
```

**Line-height conventions:**
- `heading1`, `heading2` → `line-height: 1.2`
- `body` → `line-height: 1.6`
- `label` → `line-height: 1.4`
- `button` → `line-height: 1`

**Font loading:** Google Fonts are loaded via a single `@import` that is dynamically assembled from the families actually in use on the page. Don't hardcode a specific import URL — collect the unique families and weights from `page.styles.fonts`, then build the URL:

```
@import url('https://fonts.googleapis.com/css2?
  family=Montserrat:wght@300;600;500&
  family=Inter:wght@400;500&
  display=swap');
```

---

### 11.4 Colors & Backgrounds

**All color rendering uses inline styles**, not Tailwind color utilities. This is intentional — Tailwind's color classes are a fixed set, but page colors are dynamic user-chosen hex values.

**Color resolution:** before applying any color, resolve it from the slot system. The pattern is always the same:

```javascript
function resolveColor(colorSlot, colorHex, pageColors) {
  if (colorSlot === 'transparent') return 'transparent';
  if (colorSlot && colorSlot !== 'custom') return pageColors[colorSlot] ?? colorHex;
  return colorHex;
}

// Usage examples:
resolveColor('primary', '#3b82f6', page.styles.colors)  // → "#3b82f6" (or whatever primary is)
resolveColor(null,      '#ff0000', page.styles.colors)  // → "#ff0000" (custom hex, used as-is)
resolveColor('transparent', '',   page.styles.colors)  // → "transparent"
```

**Solid background:**
```javascript
style="background-color: #3b82f6;"
```

**Gradient background** (`bgType: "gradient"`):
```javascript
// bgGradient = { color1: "#3b82f6", color2: "#8b5cf6", angle: 129 }
style="background-image: linear-gradient(129deg, #3b82f6, #8b5cf6);"
```

**Image background:** applied as a CSS `::before` pseudo-element so content can sit on top with a z-index above it. Do not apply as `background-image` directly on the element if it contains interactive content:
```css
[data-element-id="segment-123"]::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('https://...');
  background-size: cover;
  background-position: center;
  z-index: 0;
}
/* slot content must have position: relative; z-index: 1 */
```

**Text with gradient color** (special case — not a background, but a text fill):
```javascript
style="background: linear-gradient(90deg, #3b82f6, #ec4899);
       -webkit-background-clip: text;
       -webkit-text-fill-color: transparent;
       background-clip: text;
       color: transparent;"
```

---

### 11.5 Borders, Shadows & Spacing

All of these are **inline styles**.

**Border:** each edge is set independently, which allows a segment to have only a bottom border (acting as a divider) without affecting the other three sides:

```javascript
// borderEdges = { top: false, right: false, bottom: true, left: false }
// borderWidth = 1, borderColor = "#e2e8f0"
style="border-bottom: 1px solid #e2e8f0;"

// All four edges:
style="border: 1px solid #e2e8f0;"
```

**Border radius:**
```javascript
style="border-radius: 8px;"
```

**Elevation (drop shadow):** use CSS `filter: drop-shadow()`, not `box-shadow`. The formula scales naturally with the `elevation` value:

```javascript
// elevation = 4 → subtle shadow
style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.28));"

// elevation = 16 → prominent shadow
style="filter: drop-shadow(0 16px 48px rgba(0,0,0,0.52));"

// Formula:
const opacity = 0.2 + elevation * 0.02;
const blur    = elevation * 3;
`drop-shadow(0 ${elevation}px ${blur}px rgba(0,0,0,${opacity}))`
```

**Segment spacing** (vertical padding on each `<section>`): use the `SEGMENT_SPACING_PRESETS` values, not arbitrary numbers:

| `page.styles.segmentSpacing` | Padding value |
|------------------------------|---------------|
| `sm` | 24px |
| `md` | 40px *(default)* |
| `lg` | 80px |

```javascript
// Applied as padding on the segment's outer <section> element
style="padding: 40px;"
```

---

### 11.6 Mobile Rendering

Mobile (≤ 767px) is handled through a combination of Tailwind responsive classes and a generated `<style>` block injected into the page.

**Rule 1 — Grid columns always collapse to full-width on mobile.**
This is handled by Tailwind: every slot gets `col-span-12` unconditionally. The `md:col-span-N` class only kicks in at 768px and above. No extra work needed.

**Rule 2 — Mobile overrides inject a `@media` CSS block.**
For any setting that has a mobile override, a scoped CSS rule is generated and injected:

```css
@media (max-width: 767px) {
  /* segment with id "segment-abc" has a mobile gap override */
  [data-element-id="segment-abc"] > .grid { gap: 12px; }

  /* slot "slot-def" stacks vertically on mobile instead of horizontally */
  [data-element-id="slot-def"] { flex-direction: column; }

  /* slot "slot-ghi" is hidden on mobile */
  [data-element-id="slot-ghi"] { display: none; }
}
```

Each element must have a `data-element-id` attribute set to its `id` field for this to work.

**Rule 3 — Mobile baseline resets.** Always apply these rules for the mobile breakpoint to prevent overflow:

```css
@media (max-width: 767px) {
  section {
    padding-left: 16px !important;
    padding-right: 16px !important;
    overflow-x: hidden !important;
  }
  section > div {
    max-width: 100% !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  section > div > div {
    max-width: 100% !important;
    width: 100% !important;
    gap: 12px !important;
  }
}
```

---

### 11.7 What Uses Tailwind vs Inline Styles

This is the most important rule to remember. The system has a clean split:

```
┌─────────────────────────────────────────────────────────────────┐
│  USE TAILWIND CLASSES FOR:          USE INLINE STYLES FOR:      │
│                                                                 │
│  ✓ Grid layout                      ✓ Background colors         │
│    grid, grid-cols-12               ✓ Background gradients      │
│    col-span-N, md:col-span-N        ✓ Background images         │
│                                     ✓ Text colors               │
│  ✓ Gap between slots                ✓ Font size / family        │
│    gap-0 / gap-3 / gap-6 / ...      ✓ Border color & width      │
│                                     ✓ Border radius             │
│  ✓ Responsive visibility            ✓ Padding / spacing         │
│    hidden, md:block, md:hidden      ✓ Drop shadow (elevation)   │
│                                     ✓ Width / height            │
│  ✓ Column reordering                ✓ Flex direction/alignment  │
│    order-N, md:order-none           ✓ Opacity                   │
│                                     ✓ Object-fit                │
└─────────────────────────────────────────────────────────────────┘
```

**Why the split?** Tailwind's utility classes are ideal for structural, layout-level decisions that don't change with brand settings. Inline styles are used for visual properties because they are dynamic — they depend on user-chosen hex colors, user-set spacing values, and slot-resolved colors that can't be expressed as static Tailwind class names.

Never use Tailwind color classes (`bg-blue-500`, `text-gray-700`, etc.) for brand colors. Those are hardcoded values. Always use inline styles with resolved hex colors.

---

## 12. Key Invariants

These rules are enforced by the system. Any implementation, integration, or hand-edited JSON must respect them.

1. **Color fields always come in pairs.** `bgColor` without a corresponding `bgColorSlot` (or vice versa) is invalid. If you don't want to reference a slot, explicitly set `bgColorSlot: null`.

2. **Slot count matches the layout preset.** A segment with `layout: "50-50"` must always have exactly 2 slots. Changing the layout merges or creates slots automatically — never leaves a mismatch.

3. **Column spans are derived from layout, not set manually.** `slot.gridColumn` is managed by the layout system. Don't hand-edit it.

4. **Typography roles are the only way to style text.** There is no inline font size or font family on a text item. To change how text looks, change the role assigned to it, or change what the role itself looks like in `page.styles.fonts`.

5. **Button appearance is always inherited from a button style.** A button content item does not define its own colors, radius, or font. It references a button style by ID. Per-button overrides are limited to: label, icon, and explicit size.

6. **IDs are type-prefixed, timestamped, and unique.** Format: `{type}-{timestamp}-{random}`. Never reuse or hardcode IDs.

7. **Mobile overrides are additive, not replacements.** A `null` value in a mobile override means "use the desktop value." Only set fields you actually want to change on mobile.

8. **`hidden` takes precedence over `mobileHidden`.** An element with `hidden: true` is always hidden, regardless of `mobileHidden`.

9. **Breakpoints are fixed.** The mobile/tablet/desktop widths (320 / 768 / 1024) are not configurable per page. They are preview viewports, not adjustable parameters.

10. **Gradients require `bgType: "gradient"`.** Setting `bgGradient` without setting `bgType` to `"gradient"` has no effect. The `bgType` field is always the active discriminator between solid and gradient backgrounds.

11. **Background layering is video > image > color/gradient.** If multiple are set, the higher-priority one wins. To use a gradient, both `bgImage` and `bgVideo` must be null/empty.
