# Page Builder

A React-based visual editor for building responsive web page layouts with a three-panel interface. Build flexible, multi-column page layouts with real-time preview and comprehensive styling controls.

## Features

- **Three-panel editor**: Structure tree (left), live preview (center), settings (right)
- **Full hierarchy visualization**: Complete page → segments → containers → content tree with expand/collapse
- **Quick add menus**: Blue "+" dropdown buttons on each element to add children
- **Flexible layouts**: Segment and container columns (1-4) for multi-column designs
- **Content alignment**: Position content left, center, or right within segments/containers
- **Rich styling**: Background colors, background images, padding, spacing on all layout elements
- **Responsive output**: Mobile/tablet/desktop breakpoints
- **Global brand system**: Colors, fonts, button styles, shapes
- **Save/Load**: Persist pages to localStorage (Google Drive integration ready)
- **WYSIWYG**: Real-time HTML/CSS preview with element highlighting
- **Semantic structure**: Page → Segments → Containers → Content (all optional)

## Getting Started

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## Architecture

### UI/Components

- **StructureTree** (left panel) - Full hierarchy tree with visual icons (📄📦📋📝🖼️🔘🃏), expand/collapse, and context-aware "+" dropdown buttons for adding child elements
- **Preview** (center panel) - Live HTML/CSS preview in iframe showing exact output appearance, updates in real-time, segments render with default height and background
- **SettingsPanel** (right panel) - Context-aware settings forms that show controls for currently selected element (Page, Segment, Container, or Content)
- **Editor** - Main layout with toolbar showing page title and Save/Load buttons

### UI Behavior

- Click any element in the tree to select it and view/edit its settings in the right panel
- Click the blue "+" button next to any element to see a dropdown menu of what can be added
- Page level: Only allows adding segments
- Segments: Can add containers or content items (text, image, button, card)
- Containers: Can add content items
- Delete button (✕) removes any element

### State Management

- **React Context** for centralized state
- **useReducer** pattern for predictable state mutations
- **pageActions** for dispatching state changes
- **usePageStore** hook for component access

### Services

- **pageGenerator** - Converts page model to HTML/CSS
- **googleDrive** - Save/load pages (localStorage fallback for MVP)

### Data Model

```javascript
Page {
  id, title, breakpoints, 
  styles: {
    logo, colors (primary, secondary, neutral),
    fonts (heading, body), buttonStyles[], shapes (borderRadius)
  },
  root: Segment[]  // Can only be segments (no direct content)
}

Segment {
  id, name, type: 'segment',
  settings: {
    fullWidth: boolean,      // 100% viewport width vs constrained
    bgColor: string,         // Background color
    bgImage: string,         // Background image URL
    padding: number,         // Internal spacing
    margin: number,          // External spacing
    columns: 1-4,           // Multi-column layout (1-4 columns)
    contentAlignment: 'left' | 'center' | 'right'
  },
  children: (Container | ContentItem)[]
}

Container {
  id, name, type: 'container',
  settings: {
    layout: 'flex' | 'grid',
    columns: 1-4,                       // Number of columns
    spacing: number,                    // Gap between items
    bgColor: string,                    // Background color
    bgImage: string,                    // Background image URL
    padding: number,                    // Internal padding
    contentAlignment: 'left' | 'center' | 'right'
  },
  children: ContentItem[]
}

ContentItem {
  id, type: 'text' | 'image' | 'button' | 'card',
  settings: {
    assignedStyleId: string,     // Reference to global style (e.g., 'primary-button')
    customOverrides: object,     // Type-specific overrides (content, src, label, etc.)
    responsiveVariants: {        // Breakpoint-specific settings (mobile/tablet/desktop)
      mobile: {}, tablet: {}, desktop: {}
    }
  }
}
```

## File Structure

```
src/
├── components/
│   ├── Editor.jsx              # Main three-panel layout
│   ├── Preview/                # Center panel (live preview)
│   ├── StructureTree/          # Left panel (hierarchy)
│   └── SettingsPanel/          # Right panel (settings forms)
├── services/
│   ├── pageGenerator.js        # Model → HTML/CSS
│   └── googleDrive.js          # Save/load (localStorage MVP)
├── store/
│   ├── pageStore.js            # React Context + reducer
│   └── pageTypes.js            # Type definitions & factories
├── utils/
│   └── constants.js            # App constants & theme
├── styles/
│   └── index.css               # Global styles
├── App.jsx                     # Root component
└── main.jsx                    # Entry point

tests/
└── services/
    └── pageGenerator.test.js   # Test suite (10 tests, all passing)
```

## Current Implementation Status

### ✅ Working Features
- Full three-panel editor with tree hierarchy
- All elements visible in live preview
- Page-level settings (title, colors)
- Segment settings: background color/image, padding, margin, columns (1-4), content alignment
- Container settings: layout (flex/grid), columns (1-4), spacing, background color/image, padding, content alignment
- Add/delete elements via dropdown menus
- Real-time preview updates
- Save/load to localStorage
- Responsive output with breakpoints

### 🎯 Layout Notes
- Segments default to 200px height (minHeight) so they're always visible
- Segments use grid/flex layout based on column count for multi-column layouts
- Containers support both flex and grid layouts
- Content alignment applies to all child items
- Background images use CSS cover sizing

### 📝 Content Types

The builder supports four content types:

- **Text** - Customizable text content
- **Image** - Responsive images with URL
- **Button** - Styled buttons with global style assignment (Primary/Secondary)
- **Card** - Basic card container with border and padding

## Global Styles (Brand)

Configure once, apply everywhere:

- **Colors** - Primary, secondary, neutral
- **Fonts** - Heading and body typefaces
- **Button Styles** - Multiple button variants (Primary, Secondary, etc.)
- **Shapes** - Border radius presets

## Responsive Design

The output HTML is fully responsive with breakpoints:

- **Mobile**: 320px
- **Tablet**: 768px
- **Desktop**: 1024px+

CSS media queries are automatically generated in the output.

## Tech Stack

- **Frontend**: React 18.3.0, Vite
- **State**: React Context + useReducer
- **Testing**: Vitest
- **Auth**: @react-oauth/google (for future Google Drive integration)
- **Storage**: localStorage (MVP), Google Drive API (future)

## Key Dependencies

- react@^18.3.0
- react-dom@^18.3.0
- google-auth-library@^9.6.0 (for future Google integration)
- vite@^5.0.0
- vitest@^1.0.0

## Recent Improvements (Session 2 - March 31, 2026)

### UI/UX Enhancements
- ✅ Full page hierarchy visible in structure tree with visual icons (📄 📦 📋 📝 🖼️ 🔘 🃏)
- ✅ Replaced multi-row button layouts with single blue "+" dropdown buttons on each element
- ✅ Page clickable to view/edit page settings
- ✅ Segments render with default 200px height so they're always visible
- ✅ Background colors on segments now properly visible

### Layout & Styling Enhancements
- ✅ Segments and containers have consistent settings
- ✅ Multi-column support (1-4 columns) for both segments and containers
- ✅ Content alignment (left, center, right) for segments and containers
- ✅ Background image URL support for segments and containers
- ✅ Page-level only allows adding segments (not direct content)
- ✅ Improved styling controls with color pickers and text inputs

## Next Steps (Phase 2+)

- [ ] Google Drive API integration for real cloud storage
- [ ] Template library for common segment layouts
- [ ] Rich text editor for text content with formatting
- [ ] Image upload and asset management library
- [ ] Undo/redo history
- [ ] Real-time collaboration
- [ ] Advanced animations and interactions
- [ ] Code export (HTML/CSS/React)
- [ ] Breakpoint-specific settings editor
- [ ] Custom CSS per element
- [ ] Typography settings (font size, weight, line height)

## Testing

The project includes a comprehensive test suite:

```bash
npm test
```

Tests cover:
- Page generation (10 test cases)
- HTML structure validation
- Content type rendering
- Style application
- Responsive breakpoints

All tests pass cleanly.

## Development Notes

### Key Files to Know

- **pageTypes.js** - Element factories (createSegment, createContainer, createContentItem) and constants
- **pageGenerator.js** - Converts page model to HTML/CSS, renders segments/containers with proper styling
- **StructureTree.jsx** - Left panel with tree view, dropdown add menus, and delete buttons
- **SettingsPanel/** - Five components: SettingsPanel (router), PageSettings, SegmentSettings, ContainerSettings, ContentSettings
- **Preview.jsx** - Center panel with iframe showing live preview

### Adding New Content Types

1. Add type to `CONTENT_TYPES` in `src/store/pageTypes.js`
2. Create render function in `src/services/pageGenerator.js` (in `renderContentItem`)
3. Add conditional UI in `src/components/SettingsPanel/ContentSettings.jsx`
4. Update TreeNode.jsx if new icon needed (add to getIcon map)
5. Add test case in `tests/services/pageGenerator.test.js`

### Adding New Settings to Segments/Containers

1. Add to settings object in `createSegment()` or `createContainer()` in pageTypes.js
2. Update render functions in pageGenerator.js (renderSegment, renderContainer) to use the setting
3. Add form control in SegmentSettings.jsx or ContainerSettings.jsx
4. Test in preview

### Extending the Theme

Edit `src/utils/constants.js` and `src/store/pageTypes.js` to customize:
- Editor colors (THEME)
- Editor layout dimensions (EDITOR_LAYOUT)
- Default page styles (createEmptyPage with colors, fonts, buttonStyles)
- Breakpoints (BREAKPOINTS)

## License

MIT

## Contributing

This is a prototype built for team evaluation. Future work will formalize the contribution process.

---

**Built with React, Vite, and a focus on simplicity and extensibility.**
