# Page Builder

A React-based visual editor for building responsive web page layouts with a three-panel interface.

## Features

- **Three-panel editor**: Structure tree (left), live preview (center), settings (right)
- **Responsive output**: Mobile/tablet/desktop breakpoints
- **Global styles**: Manage colors, fonts, button styles
- **Save/Load**: Persist pages to localStorage (Google Drive integration ready)
- **WYSIWYG**: See changes in real-time in the preview
- **Component hierarchy**: Page → Segments → Containers → Content
- **Rich settings**: Configure colors, spacing, layout, and content for all elements

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

### Components

- **StructureTree** (left panel) - Hierarchical tree view of page elements with add/delete actions
- **Preview** (center panel) - Live HTML/CSS preview in an iframe, updates in real-time
- **SettingsPanel** (right panel) - Context-aware settings forms for all element types
- **Editor** - Main layout component with toolbar, save/load dialogs

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
  id, title, breakpoints, styles (colors, fonts, buttonStyles, shapes),
  root: Segment[]
}

Segment {
  id, name, type: 'segment',
  settings: { fullWidth, bgColor, bgGradient, bgImage, bgVideo, padding, margin },
  children: (Container | ContentItem)[]
}

Container {
  id, name, type: 'container',
  settings: { layout: 'flex' | 'grid', columns, spacing },
  children: ContentItem[]
}

ContentItem {
  id, type: 'text' | 'image' | 'button' | 'card',
  settings: { assignedStyleId, customOverrides, responsiveVariants }
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

## Content Types

The builder supports four content types:

- **Text** - Rich text content with customizable text
- **Image** - Responsive images with URL
- **Button** - Styled buttons with global style assignment
- **Card** - Card containers with border and padding

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

## Next Steps (Phase 2+)

- [ ] Google Drive API integration for real cloud storage
- [ ] Template library for segments
- [ ] Rich text editor for text content
- [ ] Image upload and asset management
- [ ] Undo/redo history
- [ ] Real-time collaboration
- [ ] Advanced animations and interactions
- [ ] Code export (HTML/CSS/React)

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

### Adding New Content Types

1. Add type to `CONTENT_TYPES` in `src/store/pageTypes.js`
2. Create render function in `src/services/pageGenerator.js`
3. Add settings form in `src/components/SettingsPanel/ContentSettings.jsx`
4. Add test case in `tests/services/pageGenerator.test.js`

### Extending the Theme

Edit `src/utils/constants.js` and `src/store/pageTypes.js` to customize:
- Editor colors (THEME)
- Editor layout dimensions (EDITOR_LAYOUT)
- Default page styles (createEmptyPage)
- Breakpoints (BREAKPOINTS)

## License

MIT

## Contributing

This is a prototype built for team evaluation. Future work will formalize the contribution process.

---

**Built with React, Vite, and a focus on simplicity and extensibility.**
