# Page Builder Design Specification

**Date:** 2026-03-31  
**Purpose:** Prototype tool for the team to build responsive web page layouts with a visual editor. Output is real HTML/CSS that shows exactly what the website will look like.

---

## Overview

The Page Builder is a React-based desktop editor with a three-panel interface:
- **Left:** Hierarchical structure tree (page → segments → containers → content)
- **Center:** Live HTML/CSS preview (WYSIWYG)
- **Right:** Settings panel for the selected element

Pages are saved as JSON files in Google Drive and can be loaded back into the editor. The output is fully responsive (mobile/tablet/desktop breakpoints).

---

## Core Data Model

### Page
```javascript
{
  id: string,
  title: string,
  breakpoints: { mobile: 320, tablet: 768, desktop: 1024 },
  styles: BrandStyles,
  root: Segment[]
}
```

### Segment (top-level containers)
```javascript
{
  id: string,
  name: string,
  settings: {
    fullWidth: boolean,  // if true, spans 100% viewport; if false, constrained to max-width
    bgColor: string,
    bgGradient: string,
    bgImage: string,
    bgVideo: string,
    padding: number,     // internal spacing
    margin: number       // external spacing from other segments
  },
  children: (Container | ContentItem)[]
}
```

### Container (nested containers for layouts)
```javascript
{
  id: string,
  name: string,
  settings: {
    layout: "flex" | "grid",
    columns: number,
    spacing: number
  },
  children: ContentItem[]
}
```

### ContentItem (leaf nodes)
```javascript
{
  id: string,
  type: "text" | "image" | "button" | "card",
  settings: {
    assignedStyleId: string,  // reference to global style (e.g., "primary-button")
    customOverrides: {        // instance-specific overrides (color, size, text content, etc.)
      // varies by type—text items have content, buttons have label, etc.
    },
    responsiveVariants: {     // breakpoint-specific overrides
      mobile: {},
      tablet: {},
      desktop: {}
    }
  }
}
```

### BrandStyles (global design system)
```javascript
{
  logo: string,  // image URL
  colors: {
    primary: string,
    secondary: string,
    neutral: string,
    // ... additional color slots
  },
  fonts: {
    heading: { family, size, weight },
    body: { family, size, weight }
  },
  buttonStyles: [
    { id: "primary", label: "Primary", bgColor, textColor, padding, radius },
    { id: "secondary", label: "Secondary", ... },
    // ...
  ],
  shapes: {
    borderRadius: number  // default radius for buttons, images, cards
  }
}
```

---

## Three-Panel Layout

### Left Panel: Structure Tree
- Hierarchical view of all elements in the page
- Click to select any element (highlights in center panel)
- Drag-to-reorder items within their parent
- Right-click menu: Add/Delete/Rename
- Visual hierarchy (indentation, icons for segment/container/content types)

### Center Panel: Live Preview
- Renders actual HTML/CSS matching all current settings
- Shows the page as it would appear to visitors (full fidelity)
- Desktop-only editor, but output is responsive (adapts to mobile/tablet/desktop breakpoints)
- Selected element gets visual highlight (border + light background)
- Hover shows element boundaries
- No editing happens here—purely visual feedback

### Right Panel: Settings
- Form that changes based on selected element type
- Real-time preview updates as settings change
- For content items with global styles, shows dropdown to pick style variants
- Breakpoint-specific overrides (can customize mobile/tablet/desktop separately)
- Color picker, font selector, spacing controls, etc.

---

## Feature Set (MVP)

### 1. Page Settings
- Background color
- Default padding/spacing
- Breakpoint configuration (widths for mobile/tablet/desktop)

### 2. Segments
- Add/edit/delete segments
- Settings: full-width vs contained, background (color/gradient/image/video), padding
- Reorder via drag-and-drop

### 3. Containers
- Add/edit/delete containers within segments
- Settings: layout mode (flex/grid), column count, spacing
- Flexible for multi-column layouts

### 4. Content Items
- Types: text, image, button, card
- Assignable global styles (e.g., "Primary Button", "Secondary Button")
- Custom overrides per instance
- Responsive variants (hide on mobile, change size, etc.)

### 5. Brand/Styles Management
- Logo upload
- Color palette (primary, secondary, neutrals)
- Typography (heading + body fonts)
- Button style definitions (multiple variants)
- Shape presets (default border-radius)
- Changes to global styles update all assigned elements

### 6. Save/Load
- Export current page as JSON to Google Drive
- Load previous pages from Google Drive
- File naming and versioning (team can maintain multiple layouts)

### 7. Live Preview
- WYSIWYG rendering in center panel
- Highlights selected elements
- Updates in real-time as settings change

---

## Technical Stack

- **Frontend:** React + Vite
- **Theme:** Dark mode (matching James dashboard aesthetic)
- **State Management:** React Context or component state (simple, client-side only)
- **Storage:** JSON files stored in Google Drive (integrated via Google Drive API)
- **Output:** Responsive HTML/CSS with CSS media queries for breakpoints

---

## Out of Scope (Phase 2+)

- Template library for segments
- Nested content item editing (e.g., text formatting, rich text)
- Real-time collaboration
- Undo/redo history
- Asset management (separate image library)
- Advanced animations/interactions

---

## Success Criteria

1. Editor is fully functional on desktop browsers (Chrome, Firefox, Safari)
2. Live preview shows real HTML/CSS that matches page builder settings
3. Output pages are responsive and look correct on mobile/tablet/desktop
4. Pages can be saved to Google Drive and loaded back without data loss
5. Global styles (colors, fonts, buttons) are manageable and apply consistently
6. Team members can create multiple page layouts and compare them

---

## File Structure

```
/pagebuilder
├── src/
│   ├── components/
│   │   ├── StructureTree.jsx      # Left panel
│   │   ├── Preview.jsx            # Center panel
│   │   ├── SettingsPanel.jsx      # Right panel
│   │   └── Editor.jsx             # Main three-panel layout
│   ├── services/
│   │   ├── googleDrive.js         # Google Drive save/load
│   │   └── pageGenerator.js       # Convert model to HTML/CSS
│   ├── store/
│   │   └── pageStore.js           # State management
│   └── App.jsx
├── docs/
│   └── superpowers/specs/         # This spec
└── package.json
```
