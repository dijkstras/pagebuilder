# Viewport Toggle Feature Design

**Date:** March 31, 2026
**Feature:** Desktop/Mobile viewport toggle in preview pane
**Status:** Approved for implementation

## Overview

Add a simple toggle in the "Live Preview" header that allows users to switch between desktop (full width) and mobile (375px) viewport modes for testing page responsiveness during development.

## Requirements

- **Toggle Location:** Right side of the "Live Preview" header section, above the preview iframe
- **Modes:** Desktop (full available width) and Mobile (375px fixed width)
- **Mobile Width:** 375px (standard mobile viewport size)
- **State Persistence:** Session-only (no localStorage or persistence)
- **Visual Clarity:** When in mobile mode, the iframe should be centered within the preview container so the reduced width is visually obvious

## Architecture

### Component: Preview.jsx

The feature is entirely contained within the Preview component.

**State:**
- Add `useState` hook: `const [viewportMode, setViewportMode] = useState('desktop')`
- Possible values: `'desktop'` | `'mobile'`

**Structure:**
1. Existing header section ("Live Preview" title) → extend to include toggle button on the right
2. Toggle button/control positioned on the right side of the header
3. Iframe container with conditional width and centering logic

**Conditional Styling:**
- Desktop mode: iframe container takes full available width (`width: '100%'`)
- Mobile mode: iframe container is `width: '375px'` with `margin: '0 auto'` for centering

### Toggle UI

**Button Options:**
- Simple button pair: "Desktop | Mobile" with active state styling
- Or: segmented control / radio buttons showing both options
- Active state should be visually distinct (highlighted/selected appearance)

**Behavior:**
- Click to toggle between modes
- No async operations, purely client-side state change

## Implementation Details

**Changes Required:**
- Modify `Preview.jsx` only
- Add state hook for viewport mode
- Update header JSX to include toggle button on the right side
- Update iframe container styling to apply conditional width
- Update iframe container to center when in mobile mode

**No Changes to:**
- Editor.jsx (parent component)
- pageStore.jsx (state management)
- Other components

## Testing Approach

1. Toggle between desktop and mobile modes
2. Verify iframe width changes (375px vs full width)
3. Verify mobile mode viewport is centered
4. Verify toggle state doesn't persist on page refresh
5. Test with various page contents to ensure mobile width is appropriate

## Success Criteria

- ✅ Toggle appears in Live Preview header, right-aligned
- ✅ Desktop mode shows preview at full available width
- ✅ Mobile mode shows preview at 375px, centered horizontally
- ✅ Toggle switches cleanly between modes
- ✅ No console errors
- ✅ State resets on page refresh
