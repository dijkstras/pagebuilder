# Gradient Background for Segments and Containers

**Date:** 2026-03-31
**Status:** Approved

## Overview

Add gradient background support to segments and containers in the page builder. Users can choose between a solid color background (existing behaviour) or a two-color linear gradient with a freely adjustable direction (0–360°).

## Data Model

Two new fields are added to `settings` for both segments and containers:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bgType` | `'solid' \| 'gradient'` | `'solid'` | Selects background mode |
| `bgGradient` | `{ color1: string, color2: string, angle: number }` | `{ color1: '#ffffff', color2: '#000000', angle: 90 }` | Gradient config (only used when `bgType === 'gradient'`) |

The existing `bgColor` field is retained and continues to be used when `bgType === 'solid'` (or `bgType` is absent — backward compatible).

`pageTypes.js` default structs for `createSegment` and `createContainer` do not need `bgGradient` pre-populated (it will be initialised on first use). The migration functions (`migrateSegment`, `migrateContainer`) do not need changes because the absence of `bgType` defaults to solid behaviour.

## Settings Panel Changes

Both `SegmentSettings.jsx` and `ContainerSettings.jsx` receive the same changes to their "Background Color" section:

1. **Solid / Gradient toggle** — two buttons, matching the existing direction-toggle style.
2. **Solid mode** — existing single color picker + hex input (no change to output).
3. **Gradient mode** — replaces the single color picker with:
   - A live **preview bar** (`linear-gradient(${angle}deg, color1, color2)`), 20 px tall, full width, rounded.
   - **Color 1** label + color swatch + hex input.
   - **Color 2** label + color swatch + hex input.
   - **Direction** label + circular dial (drag to rotate) + numeric input (0–360, wraps) + "deg" unit label.

The dial is implemented as a small interactive `<div>` that tracks `pointerdown` / `pointermove` / `pointerup` to compute an angle from the centre, updating `bgGradient.angle` in real time.

To avoid code duplication, the gradient UI block is extracted into a shared component `GradientPicker` living in `src/components/SettingsPanel/GradientPicker.jsx`, used by both settings panels.

## Renderer Changes (`pageGenerator.js`)

In `renderSegment` and `renderContainer`, background CSS is determined as follows:

```
if bgType === 'gradient':
  backgroundImage = linear-gradient(${angle}deg, ${color1}, ${color2})
  backgroundColor = undefined   // don't set both
else:
  backgroundColor = bgColor     // existing behaviour
  backgroundImage = bgImage ? url(...) : undefined
```

Note: when a background *image* is set alongside a gradient, the background image takes precedence visually (CSS stacking order). For this iteration, gradient and background image are treated as mutually exclusive — if `bgImage` is set, it overrides the gradient. This keeps the scope minimal and can be revisited later.

## Scope

**In scope:**
- Solid/gradient toggle + two-color gradient with degree dial for segments and containers
- Live preview bar in the settings panel
- Shared `GradientPicker` component

**Out of scope (future):**
- More than two colour stops
- Radial gradients
- Combining gradient with a background image layer
- Gradient on the page background (`page.styles.bgColor`)
