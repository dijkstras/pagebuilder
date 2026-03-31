# Animated Selection Border — Design Spec

**Date:** 2026-03-31

## Summary

When a user selects an element in the page structure tree, a subtle one-shot pulsing glow animation plays around that element in the Preview window. The same pulse replays whenever the user changes a setting on the selected element. The animation plays once and disappears — no persistent border remains.

## Context

The Preview renders a fully static HTML page inside an `<iframe srcDoc={...}>`. The iframe re-renders from scratch whenever either:
- `state.selectedElementId` changes (user selects a different element), or
- `state.page` changes (user updates any setting).

All elements in the generated HTML already carry `data-element-id` attributes. The store tracks `selectedElementId`.

## Approach

Inject a one-shot CSS animation into the generated HTML whenever a `selectedElementId` is present. Because the iframe re-renders on both select and settings-change events, the animation restarts naturally each time — no JavaScript timers, no `postMessage`, no cross-iframe DOM manipulation needed.

## Changes

### 1. `src/services/pageGenerator.js`

- Update `generateHTML(page)` signature to `generateHTML(page, selectedElementId)`.
- If `selectedElementId` is provided, append a `<style>` block to the `<head>` containing:
  - A `@keyframes selection-pulse` animation: starts with a visible indigo outline + box-shadow, peaks at a soft glow spread, fades to fully transparent by 100%.
  - A selector `[data-element-id="${selectedElementId}"]` applying `animation: selection-pulse 0.7s ease-out 1 forwards`.
- No changes to any rendering logic.

**Animation keyframes:**
```css
@keyframes selection-pulse {
  0%   { outline: 2px solid rgba(99,102,241,0.9); outline-offset: 3px; box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
  40%  { outline: 2px solid rgba(99,102,241,0.7); box-shadow: 0 0 0 6px rgba(99,102,241,0.2); }
  100% { outline: 2px solid transparent;          box-shadow: 0 0 0 0 rgba(99,102,241,0); }
}
```

### 2. `src/components/Preview/Preview.jsx`

- Add `state.selectedElementId` as a dependency to the existing `useMemo`.
- Pass `state.selectedElementId` as the second argument to `generateHTML`.
- No other changes.

## Behavior

| Event | Result |
|---|---|
| User selects an element | Iframe re-renders → pulse plays once → fades out |
| User changes a setting | Iframe re-renders → pulse replays once → fades out |
| User deselects | No `selectedElementId` → no animation injected |
| Element already selected, no change | No re-render → no pulse (intentional) |

## Non-goals

- No persistent selection border while idle.
- No click-to-select via the preview iframe.
- No changes to the structure tree or settings panel.
