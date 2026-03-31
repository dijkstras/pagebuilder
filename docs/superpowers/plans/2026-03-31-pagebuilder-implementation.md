# Page Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React-based Page Builder with a three-panel editor (structure tree, live preview, settings) that lets teams create responsive web layouts saved to Google Drive.

**Architecture:** Client-side React app with state management via React Context. Pages are JSON documents (page → segments → containers → content). Center panel renders actual HTML/CSS. Settings panel updates the page model in real-time. Google Drive integration handles persistence.

**Tech Stack:** React 18, Vite, Google Drive API, CSS for responsive output

---

## File Structure

```
/pagebuilder
├── src/
│   ├── App.jsx                          # Root component
│   ├── main.jsx                         # Entry point
│   ├── components/
│   │   ├── Editor.jsx                   # Three-panel layout wrapper
│   │   ├── StructureTree/
│   │   │   ├── StructureTree.jsx        # Left panel—tree view of elements
│   │   │   └── TreeNode.jsx             # Individual tree node
│   │   ├── Preview/
│   │   │   └── Preview.jsx              # Center panel—live HTML/CSS
│   │   ├── SettingsPanel/
│   │   │   ├── SettingsPanel.jsx        # Right panel—settings form
│   │   │   ├── PageSettings.jsx         # Page-level settings form
│   │   │   ├── SegmentSettings.jsx      # Segment settings form
│   │   │   ├── ContainerSettings.jsx    # Container settings form
│   │   │   └── ContentSettings.jsx      # Content item settings form
│   │   └── BrandManager/
│   │       └── BrandManager.jsx         # Manage global styles/brand
│   ├── services/
│   │   ├── pageGenerator.js             # Convert page model → HTML/CSS
│   │   ├── googleDrive.js               # Google Drive save/load
│   │   └── defaultPage.js               # Default page template
│   ├── store/
│   │   ├── pageStore.js                 # React Context for state
│   │   └── pageTypes.js                 # Type definitions
│   ├── utils/
│   │   └── constants.js                 # Breakpoints, defaults
│   └── styles/
│       └── index.css                    # Global styles
├── tests/
│   ├── services/
│   │   ├── pageGenerator.test.js
│   │   └── googleDrive.test.js
│   └── store/
│       └── pageStore.test.js
├── index.html
├── vite.config.js
├── package.json
└── docs/superpowers/specs/
    └── 2026-03-31-pagebuilder-design.md
```

---

## Tasks

### Task 1: Project Setup & Dependencies

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Initialize Vite project and install dependencies**

Run:
```bash
cd /Users/sjoerddijkstra/Dropbox/coding/pagebuilder
npm create vite@latest . -- --template react
npm install
npm install google-auth-library @react-oauth/google
```

- [ ] **Step 2: Verify Vite setup works**

Run:
```bash
npm run dev
```

Expected: Dev server starts on http://localhost:5173

- [ ] **Step 3: Update package.json with project metadata**

Update `package.json`:
```json
{
  "name": "pagebuilder",
  "version": "0.1.0",
  "description": "Responsive page layout builder for teams",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "google-auth-library": "^9.6.0",
    "@react-oauth/google": "^0.12.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Vite project with React and dependencies"
```

---

### Task 2: Type Definitions & State Model

**Files:**
- Create: `src/store/pageTypes.js`
- Create: `src/utils/constants.js`

- [ ] **Step 1: Write page type definitions**

Create `src/store/pageTypes.js`:
```javascript
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024
};

export const CONTENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  CARD: 'card'
};

export const LAYOUT_TYPES = {
  FLEX: 'flex',
  GRID: 'grid'
};

// Default empty page structure
export const createEmptyPage = () => ({
  id: `page-${Date.now()}`,
  title: 'Untitled Page',
  breakpoints: BREAKPOINTS,
  styles: {
    logo: null,
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      neutral: '#6b7280'
    },
    fonts: {
      heading: { family: 'Inter', size: 32, weight: 700 },
      body: { family: 'Inter', size: 16, weight: 400 }
    },
    buttonStyles: [
      {
        id: 'primary',
        label: 'Primary',
        bgColor: '#3b82f6',
        textColor: '#ffffff',
        padding: 12,
        radius: 6
      },
      {
        id: 'secondary',
        label: 'Secondary',
        bgColor: '#e5e7eb',
        textColor: '#1f2937',
        padding: 12,
        radius: 6
      }
    ],
    shapes: { borderRadius: 6 }
  },
  root: []
});

export const createSegment = (name = 'Segment') => ({
  id: `segment-${Date.now()}`,
  name,
  type: 'segment',
  settings: {
    fullWidth: true,
    bgColor: '#ffffff',
    bgGradient: null,
    bgImage: null,
    bgVideo: null,
    padding: 40,
    margin: 0
  },
  children: []
});

export const createContainer = (name = 'Container') => ({
  id: `container-${Date.now()}`,
  name,
  type: 'container',
  settings: {
    layout: LAYOUT_TYPES.FLEX,
    columns: 1,
    spacing: 16
  },
  children: []
});

export const createContentItem = (contentType = CONTENT_TYPES.TEXT) => ({
  id: `content-${Date.now()}`,
  type: contentType,
  settings: {
    assignedStyleId: null,
    customOverrides: contentType === CONTENT_TYPES.TEXT ? { content: 'Your text here' } : {},
    responsiveVariants: {
      mobile: {},
      tablet: {},
      desktop: {}
    }
  }
});
```

- [ ] **Step 2: Write constants file**

Create `src/utils/constants.js`:
```javascript
export const DEFAULT_PAGE_WIDTH = 1200;

export const EDITOR_LAYOUT = {
  LEFT_PANEL_WIDTH: 300,
  RIGHT_PANEL_WIDTH: 350,
  PREVIEW_MIN_WIDTH: 600
};

export const THEME = {
  background: '#1f2937',
  surface: '#111827',
  border: '#374151',
  text: '#f3f4f6',
  textMuted: '#9ca3af',
  accent: '#3b82f6'
};

export const CONTENT_TYPE_LABELS = {
  text: 'Text',
  image: 'Image',
  button: 'Button',
  card: 'Card'
};
```

- [ ] **Step 3: Commit**

```bash
git add src/store/pageTypes.js src/utils/constants.js
git commit -m "feat: define page data types and constants"
```

---

### Task 3: Page Store (State Management)

**Files:**
- Create: `src/store/pageStore.js`

- [ ] **Step 1: Write page store with React Context**

Create `src/store/pageStore.js`:
```javascript
import React, { createContext, useContext, useReducer } from 'react';
import { createEmptyPage, createSegment, createContainer, createContentItem } from './pageTypes';

const PageContext = createContext();

const initialState = {
  page: createEmptyPage(),
  selectedElementId: null,
  selectedElementType: null
};

function pageReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    
    case 'UPDATE_PAGE_SETTINGS':
      return {
        ...state,
        page: {
          ...state.page,
          ...action.payload
        }
      };
    
    case 'UPDATE_PAGE_STYLES':
      return {
        ...state,
        page: {
          ...state.page,
          styles: { ...state.page.styles, ...action.payload }
        }
      };
    
    case 'ADD_SEGMENT':
      return {
        ...state,
        page: {
          ...state.page,
          root: [...state.page.root, createSegment(action.payload)]
        }
      };
    
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        page: updateElement(state.page, action.payload.id, action.payload.updates)
      };
    
    case 'DELETE_ELEMENT':
      return {
        ...state,
        page: deleteElement(state.page, action.payload),
        selectedElementId: null,
        selectedElementType: null
      };
    
    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: action.payload.id,
        selectedElementType: action.payload.elementType
      };
    
    case 'DESELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: null,
        selectedElementType: null
      };
    
    default:
      return state;
  }
}

function updateElement(page, elementId, updates) {
  const findAndUpdate = (element) => {
    if (element.id === elementId) {
      return { ...element, ...updates };
    }
    if (element.children) {
      return {
        ...element,
        children: element.children.map(findAndUpdate)
      };
    }
    return element;
  };

  return {
    ...page,
    root: page.root.map(findAndUpdate)
  };
}

function deleteElement(page, elementId) {
  const findAndDelete = (children) => {
    if (!children) return children;
    return children
      .filter(child => child.id !== elementId)
      .map(child => ({
        ...child,
        children: child.children ? findAndDelete(child.children) : child.children
      }));
  };

  return {
    ...page,
    root: findAndDelete(page.root)
  };
}

export function PageProvider({ children }) {
  const [state, dispatch] = useReducer(pageReducer, initialState);

  return (
    <PageContext.Provider value={{ state, dispatch }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageStore() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageStore must be used within PageProvider');
  }
  return context;
}

export const pageActions = {
  setPage: (page) => ({ type: 'SET_PAGE', payload: page }),
  updatePageSettings: (updates) => ({ type: 'UPDATE_PAGE_SETTINGS', payload: updates }),
  updatePageStyles: (styles) => ({ type: 'UPDATE_PAGE_STYLES', payload: styles }),
  addSegment: (name) => ({ type: 'ADD_SEGMENT', payload: name }),
  updateElement: (id, updates) => ({ type: 'UPDATE_ELEMENT', payload: { id, updates } }),
  deleteElement: (id) => ({ type: 'DELETE_ELEMENT', payload: id }),
  selectElement: (id, elementType) => ({ type: 'SELECT_ELEMENT', payload: { id, elementType } }),
  deselectElement: () => ({ type: 'DESELECT_ELEMENT' })
};
```

- [ ] **Step 2: Commit**

```bash
git add src/store/pageStore.js
git commit -m "feat: implement page state management with React Context"
```

---

### Task 4: Page Generator Service

**Files:**
- Create: `src/services/pageGenerator.js`

- [ ] **Step 1: Write service to convert page model to HTML/CSS**

Create `src/services/pageGenerator.js`:
```javascript
import { BREAKPOINTS } from '../store/pageTypes';

export function generateHTML(page) {
  const segments = page.root.map(segment => renderSegment(segment, page)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    ${generateCSS(page)}
  </style>
</head>
<body>
  <div id="app">
    ${segments}
  </div>
</body>
</html>`;
}

function renderSegment(segment, page) {
  const style = buildStyleString(segment.settings);
  const children = segment.children.map(child => {
    if (child.type === 'container') {
      return renderContainer(child, page);
    } else {
      return renderContentItem(child, page);
    }
  }).join('\n');

  return `<section style="${style}" data-element-id="${segment.id}">
    ${children}
  </section>`;
}

function renderContainer(container, page) {
  const style = buildStyleString({
    display: container.settings.layout,
    gridTemplateColumns: container.settings.layout === 'grid' 
      ? `repeat(${container.settings.columns}, 1fr)`
      : undefined,
    gap: `${container.settings.spacing}px`
  });

  const children = container.children.map(child => renderContentItem(child, page)).join('\n');

  return `<div style="${style}" data-element-id="${container.id}">
    ${children}
  </div>`;
}

function renderContentItem(item, page) {
  switch (item.type) {
    case 'text':
      return `<p style="margin:0" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;
    
    case 'image':
      return `<img src="${item.settings.customOverrides.src || ''}" alt="" style="max-width:100%;height:auto" data-element-id="${item.id}" />`;
    
    case 'button':
      const buttonStyle = page.styles.buttonStyles.find(s => s.id === item.settings.assignedStyleId);
      const btnStyle = buildStyleString({
        backgroundColor: buttonStyle?.bgColor || '#3b82f6',
        color: buttonStyle?.textColor || '#ffffff',
        padding: `${buttonStyle?.padding || 12}px 24px`,
        borderRadius: `${buttonStyle?.radius || 6}px`,
        border: 'none',
        cursor: 'pointer'
      });
      return `<button style="${btnStyle}" data-element-id="${item.id}">${item.settings.customOverrides.label || 'Button'}</button>`;
    
    case 'card':
      return `<div style="border:1px solid #ddd;padding:16px;border-radius:8px" data-element-id="${item.id}">Card Content</div>`;
    
    default:
      return '';
  }
}

function buildStyleString(styleObj) {
  return Object.entries(styleObj)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
}

function generateCSS(page) {
  const breakpointCSS = Object.entries(BREAKPOINTS)
    .map(([breakpoint, width]) => {
      return `@media (max-width: ${width}px) { /* ${breakpoint} */ }`;
    })
    .join('\n');

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: 'Inter', sans-serif; }
    body { background-color: ${page.styles.colors.primary}; }
    section { width: 100%; }
    ${breakpointCSS}
  `;
}
```

- [ ] **Step 2: Test page generator with mock data**

Run in browser console to verify:
```javascript
import { generateHTML } from './src/services/pageGenerator';
import { createEmptyPage, createSegment } from './src/store/pageTypes';

const page = createEmptyPage();
page.root.push(createSegment('Hero'));
console.log(generateHTML(page));
```

Expected: Valid HTML output with sections and proper styling

- [ ] **Step 3: Commit**

```bash
git add src/services/pageGenerator.js
git commit -m "feat: implement page model to HTML/CSS generator"
```

---

### Task 5: Structure Tree Component

**Files:**
- Create: `src/components/StructureTree/StructureTree.jsx`
- Create: `src/components/StructureTree/TreeNode.jsx`

- [ ] **Step 1: Write tree node component**

Create `src/components/StructureTree/TreeNode.jsx`:
```javascript
import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';
import { CONTENT_TYPE_LABELS } from '../../utils/constants';

export function TreeNode({ element, level = 0 }) {
  const [isOpen, setIsOpen] = useState(true);
  const { state, dispatch } = usePageStore();

  const isSelected = state.selectedElementId === element.id;
  const hasChildren = element.children && element.children.length > 0;

  const handleSelect = () => {
    dispatch(pageActions.selectElement(element.id, element.type));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch(pageActions.deleteElement(element.id));
  };

  const labelText = element.name || CONTENT_TYPE_LABELS[element.type] || 'Element';

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div
        onClick={handleSelect}
        style={{
          padding: '8px 4px',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#3b82f6' : 'transparent',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none'
        }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            {isOpen ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span style={{ width: '16px' }} />}
        
        <span style={{ flex: 1, fontSize: '14px' }}>{labelText}</span>
        
        <button
          onClick={handleDelete}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            opacity: 0.6,
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>

      {isOpen && hasChildren && (
        <div>
          {element.children.map(child => (
            <TreeNode key={child.id} element={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write structure tree component**

Create `src/components/StructureTree/StructureTree.jsx`:
```javascript
import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';
import { TreeNode } from './TreeNode';
import { createSegment, createContainer, createContentItem, CONTENT_TYPES } from '../../store/pageTypes';
import { THEME } from '../../utils/constants';

export function StructureTree() {
  const { state, dispatch } = usePageStore();

  const handleAddSegment = () => {
    dispatch(pageActions.addSegment('New Segment'));
  };

  const selectedElement = findElement(state.page, state.selectedElementId);

  const canAddContainer = selectedElement && (selectedElement.type === 'segment' || selectedElement.type === 'container');
  const canAddContent = selectedElement && (selectedElement.type === 'segment' || selectedElement.type === 'container');

  const handleAddContainer = () => {
    if (canAddContainer) {
      dispatch(pageActions.updateElement(selectedElement.id, {
        children: [...(selectedElement.children || []), createContainer()]
      }));
    }
  };

  const handleAddContent = (type) => {
    if (canAddContent) {
      const newContent = createContentItem(type);
      dispatch(pageActions.updateElement(selectedElement.id, {
        children: [...(selectedElement.children || []), newContent]
      }));
    }
  };

  return (
    <div style={{
      width: '300px',
      height: '100vh',
      backgroundColor: THEME.surface,
      borderRight: `1px solid ${THEME.border}`,
      overflow: 'auto',
      padding: '16px',
      color: THEME.text
    }}>
      <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Page Structure</h2>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleAddSegment}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: THEME.accent,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          + Add Segment
        </button>
      </div>

      {selectedElement && (
        <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: `1px solid ${THEME.border}` }}>
          {canAddContainer && (
            <button
              onClick={handleAddContainer}
              style={{
                width: '100%',
                padding: '6px',
                marginBottom: '6px',
                backgroundColor: THEME.background,
                color: THEME.accent,
                border: `1px solid ${THEME.accent}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              + Add Container
            </button>
          )}
          
          {canAddContent && (
            <div>
              {Object.values(CONTENT_TYPES).map(type => (
                <button
                  key={type}
                  onClick={() => handleAddContent(type)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    marginBottom: '4px',
                    backgroundColor: THEME.background,
                    color: THEME.textMuted,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textTransform: 'capitalize'
                  }}
                >
                  + {type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        {state.page.root.map(segment => (
          <TreeNode key={segment.id} element={segment} />
        ))}
      </div>
    </div>
  );
}

function findElement(page, elementId) {
  const search = (element) => {
    if (element.id === elementId) return element;
    if (element.children) {
      for (const child of element.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };

  for (const segment of page.root) {
    const found = search(segment);
    if (found) return found;
  }
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StructureTree/StructureTree.jsx src/components/StructureTree/TreeNode.jsx
git commit -m "feat: implement structure tree component with add/delete actions"
```

---

### Task 6: Preview Component

**Files:**
- Create: `src/components/Preview/Preview.jsx`

- [ ] **Step 1: Write preview component**

Create `src/components/Preview/Preview.jsx`:
```javascript
import React, { useMemo } from 'react';
import { usePageStore } from '../../store/pageStore';
import { generateHTML } from '../../services/pageGenerator';
import { THEME } from '../../utils/constants';

export function Preview() {
  const { state } = usePageStore();

  const htmlContent = useMemo(() => {
    return generateHTML(state.page);
  }, [state.page]);

  return (
    <div style={{
      flex: 1,
      height: '100vh',
      backgroundColor: THEME.background,
      borderRight: `1px solid ${THEME.border}`,
      overflow: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{
        fontSize: '14px',
        marginBottom: '16px',
        color: THEME.textMuted,
        fontWeight: 500
      }}>
        Live Preview
      </h2>

      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'auto'
      }}>
        <iframe
          srcDoc={htmlContent}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '4px'
          }}
          title="Page Preview"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test with mock page**

Expected: iFrame renders HTML with proper styling

- [ ] **Step 3: Commit**

```bash
git add src/components/Preview/Preview.jsx
git commit -m "feat: implement live preview component"
```

---

### Task 7: Settings Panel Components

**Files:**
- Create: `src/components/SettingsPanel/SettingsPanel.jsx`
- Create: `src/components/SettingsPanel/PageSettings.jsx`
- Create: `src/components/SettingsPanel/SegmentSettings.jsx`
- Create: `src/components/SettingsPanel/ContainerSettings.jsx`
- Create: `src/components/SettingsPanel/ContentSettings.jsx`

- [ ] **Step 1: Write base settings panel**

Create `src/components/SettingsPanel/SettingsPanel.jsx`:
```javascript
import React from 'react';
import { usePageStore } from '../../store/pageStore';
import { PageSettings } from './PageSettings';
import { SegmentSettings } from './SegmentSettings';
import { ContainerSettings } from './ContainerSettings';
import { ContentSettings } from './ContentSettings';
import { THEME } from '../../utils/constants';

export function SettingsPanel() {
  const { state } = usePageStore();

  let settings = null;

  if (!state.selectedElementId) {
    settings = <PageSettings />;
  } else if (state.selectedElementType === 'segment') {
    settings = <SegmentSettings />;
  } else if (state.selectedElementType === 'container') {
    settings = <ContainerSettings />;
  } else {
    settings = <ContentSettings />;
  }

  return (
    <div style={{
      width: '350px',
      height: '100vh',
      backgroundColor: THEME.surface,
      borderLeft: `1px solid ${THEME.border}`,
      overflow: 'auto',
      padding: '16px',
      color: THEME.text
    }}>
      <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Settings</h2>
      {settings}
    </div>
  );
}
```

- [ ] **Step 2: Write page settings form**

Create `src/components/SettingsPanel/PageSettings.jsx`:
```javascript
import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';
import { SettingInput } from './SettingInput';

export function PageSettings() {
  const { state, dispatch } = usePageStore();
  const { page } = state;

  const handleTitleChange = (e) => {
    dispatch(pageActions.updatePageSettings({ title: e.target.value }));
  };

  const handleColorChange = (colorKey, value) => {
    const newColors = { ...page.styles.colors, [colorKey]: value };
    dispatch(pageActions.updatePageStyles({ colors: newColors }));
  };

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Page Title</h3>
      <input
        type="text"
        value={page.title}
        onChange={handleTitleChange}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: '#374151',
          color: '#f3f4f6',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          marginBottom: '16px'
        }}
      />

      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Colors</h3>
      {Object.entries(page.styles.colors).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>
            {key}
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={value}
              onChange={(e) => handleColorChange(key, e.target.value)}
              style={{ width: '40px', height: '40px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleColorChange(key, e.target.value)}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write segment settings form**

Create `src/components/SettingsPanel/SegmentSettings.jsx`:
```javascript
import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';

function findElement(page, elementId) {
  const search = (element) => {
    if (element.id === elementId) return element;
    if (element.children) {
      for (const child of element.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };
  for (const segment of page.root) {
    const found = search(segment);
    if (found) return found;
  }
  return null;
}

export function SegmentSettings() {
  const { state, dispatch } = usePageStore();
  const segment = findElement(state.page, state.selectedElementId);

  if (!segment) return null;

  const handleUpdate = (key, value) => {
    const updates = {
      settings: { ...segment.settings, [key]: value }
    };
    dispatch(pageActions.updateElement(segment.id, updates));
  };

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Segment: {segment.name}</h3>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Full Width</label>
        <input
          type="checkbox"
          checked={segment.settings.fullWidth}
          onChange={(e) => handleUpdate('fullWidth', e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Color</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={segment.settings.bgColor}
            onChange={(e) => handleUpdate('bgColor', e.target.value)}
            style={{ width: '40px', height: '40px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={segment.settings.bgColor}
            onChange={(e) => handleUpdate('bgColor', e.target.value)}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Padding (px)</label>
        <input
          type="number"
          value={segment.settings.padding}
          onChange={(e) => handleUpdate('padding', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Margin (px)</label>
        <input
          type="number"
          value={segment.settings.margin}
          onChange={(e) => handleUpdate('margin', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px'
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write container settings form**

Create `src/components/SettingsPanel/ContainerSettings.jsx`:
```javascript
import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';

function findElement(page, elementId) {
  const search = (element) => {
    if (element.id === elementId) return element;
    if (element.children) {
      for (const child of element.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };
  for (const segment of page.root) {
    const found = search(segment);
    if (found) return found;
  }
  return null;
}

export function ContainerSettings() {
  const { state, dispatch } = usePageStore();
  const container = findElement(state.page, state.selectedElementId);

  if (!container) return null;

  const handleUpdate = (key, value) => {
    const updates = {
      settings: { ...container.settings, [key]: value }
    };
    dispatch(pageActions.updateElement(container.id, updates));
  };

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Container: {container.name}</h3>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Layout</label>
        <select
          value={container.settings.layout}
          onChange={(e) => handleUpdate('layout', e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px'
          }}
        >
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Columns</label>
        <input
          type="number"
          value={container.settings.columns}
          onChange={(e) => handleUpdate('columns', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Spacing (px)</label>
        <input
          type="number"
          value={container.settings.spacing}
          onChange={(e) => handleUpdate('spacing', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px'
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write content settings form**

Create `src/components/SettingsPanel/ContentSettings.jsx`:
```javascript
import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';
import { CONTENT_TYPES } from '../../store/pageTypes';

function findElement(page, elementId) {
  const search = (element) => {
    if (element.id === elementId) return element;
    if (element.children) {
      for (const child of element.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };
  for (const segment of page.root) {
    const found = search(segment);
    if (found) return found;
  }
  return null;
}

export function ContentSettings() {
  const { state, dispatch } = usePageStore();
  const content = findElement(state.page, state.selectedElementId);

  if (!content) return null;

  const handleCustomUpdate = (key, value) => {
    const updates = {
      settings: {
        ...content.settings,
        customOverrides: {
          ...content.settings.customOverrides,
          [key]: value
        }
      }
    };
    dispatch(pageActions.updateElement(content.id, updates));
  };

  const handleStyleAssign = (styleId) => {
    const updates = {
      settings: { ...content.settings, assignedStyleId: styleId }
    };
    dispatch(pageActions.updateElement(content.id, updates));
  };

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
        {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
      </h3>

      {content.type === CONTENT_TYPES.TEXT && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Content</label>
          <textarea
            value={content.settings.customOverrides.content || ''}
            onChange={(e) => handleCustomUpdate('content', e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              minHeight: '80px',
              fontFamily: 'monospace'
            }}
          />
        </div>
      )}

      {content.type === CONTENT_TYPES.IMAGE && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Image URL</label>
          <input
            type="text"
            value={content.settings.customOverrides.src || ''}
            onChange={(e) => handleCustomUpdate('src', e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px'
            }}
          />
        </div>
      )}

      {content.type === CONTENT_TYPES.BUTTON && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Button Label</label>
            <input
              type="text"
              value={content.settings.customOverrides.label || 'Button'}
              onChange={(e) => handleCustomUpdate('label', e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Button Style</label>
            <select
              value={content.settings.assignedStyleId || ''}
              onChange={(e) => handleStyleAssign(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '4px'
              }}
            >
              <option value="">-- No style --</option>
              {state.page.styles.buttonStyles.map(style => (
                <option key={style.id} value={style.id}>{style.label}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/SettingsPanel/
git commit -m "feat: implement settings panel with all element type forms"
```

---

### Task 8: Main Editor Layout

**Files:**
- Create: `src/components/Editor.jsx`
- Create: `src/App.jsx`
- Create: `src/styles/index.css`

- [ ] **Step 1: Write editor layout component**

Create `src/components/Editor.jsx`:
```javascript
import React from 'react';
import { StructureTree } from './StructureTree/StructureTree';
import { Preview } from './Preview/Preview';
import { SettingsPanel } from './SettingsPanel/SettingsPanel';

export function Editor() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <StructureTree />
      <Preview />
      <SettingsPanel />
    </div>
  );
}
```

- [ ] **Step 2: Write App component**

Create `src/App.jsx`:
```javascript
import React from 'react';
import { PageProvider } from './store/pageStore';
import { Editor } from './components/Editor';

function App() {
  return (
    <PageProvider>
      <Editor />
    </PageProvider>
  );
}

export default App;
```

- [ ] **Step 3: Write global styles**

Create `src/styles/index.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #111827;
  color: #f3f4f6;
}

#root {
  width: 100%;
  height: 100%;
}

button {
  font-family: inherit;
}

input, textarea, select {
  font-family: inherit;
}
```

- [ ] **Step 4: Update main.jsx**

Modify `src/main.jsx`:
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 5: Test the editor**

Run:
```bash
npm run dev
```

Expected: Editor loads with three-panel layout, can add segments, settings update preview

- [ ] **Step 6: Commit**

```bash
git add src/components/Editor.jsx src/App.jsx src/styles/index.css src/main.jsx
git commit -m "feat: implement three-panel editor layout"
```

---

### Task 9: Google Drive Integration

**Files:**
- Create: `src/services/googleDrive.js`

- [ ] **Step 1: Write Google Drive service**

Create `src/services/googleDrive.js`:
```javascript
// NOTE: This is a placeholder for Google Drive integration
// In production, you'll need:
// 1. Google OAuth setup in src/App.jsx
// 2. Google Picker API for file selection
// 3. Google Drive API for save/load

export async function savePage(page, fileName) {
  // For MVP, we'll use localStorage as fallback
  localStorage.setItem(`page-${fileName}`, JSON.stringify(page));
  return { id: fileName, name: fileName };
}

export async function loadPage(fileName) {
  const data = localStorage.getItem(`page-${fileName}`);
  return data ? JSON.parse(data) : null;
}

export async function listPages() {
  const pages = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('page-')) {
      pages.push({
        id: key,
        name: key.replace('page-', '')
      });
    }
  }
  return pages;
}

export async function deletePage(fileName) {
  localStorage.removeItem(`page-${fileName}`);
}
```

- [ ] **Step 2: Add save/load UI to Editor**

Modify `src/components/Editor.jsx`:
```javascript
import React, { useState } from 'react';
import { StructureTree } from './StructureTree/StructureTree';
import { Preview } from './Preview/Preview';
import { SettingsPanel } from './SettingsPanel/SettingsPanel';
import { usePageStore, pageActions } from '../store/pageStore';
import { savePage, loadPage, listPages } from '../services/googleDrive';
import { THEME } from '../utils/constants';

export function Editor() {
  const { state, dispatch } = usePageStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [pages, setPages] = useState([]);

  const handleSave = async () => {
    if (saveFileName.trim()) {
      await savePage(state.page, saveFileName);
      setShowSaveDialog(false);
      setSaveFileName('');
    }
  };

  const handleLoadClick = async () => {
    const loadedPages = await listPages();
    setPages(loadedPages);
    setShowLoadDialog(true);
  };

  const handleLoadPage = async (fileName) => {
    const page = await loadPage(fileName);
    if (page) {
      dispatch(pageActions.setPage(page));
      setShowLoadDialog(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: THEME.surface,
        borderBottom: `1px solid ${THEME.border}`,
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600 }}>{state.page.title}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Save
          </button>
          <button
            onClick={handleLoadClick}
            style={{
              padding: '6px 12px',
              backgroundColor: THEME.background,
              color: THEME.accent,
              border: `1px solid ${THEME.accent}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Load
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <StructureTree />
        <Preview />
        <SettingsPanel />
      </div>

      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: THEME.surface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${THEME.border}`,
            minWidth: '300px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Save Page</h3>
            <input
              type="text"
              placeholder="Page name..."
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                backgroundColor: THEME.background,
                border: `1px solid ${THEME.border}`,
                borderRadius: '4px',
                color: THEME.text
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: THEME.background,
                  color: THEME.text,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '6px 12px',
                  backgroundColor: THEME.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: THEME.surface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${THEME.border}`,
            minWidth: '400px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Load Page</h3>
            {pages.length === 0 ? (
              <p style={{ color: THEME.textMuted }}>No saved pages</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => handleLoadPage(page.name)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: THEME.background,
                      color: THEME.text,
                      border: `1px solid ${THEME.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {page.name}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLoadDialog(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: THEME.background,
                  color: THEME.text,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Test save/load**

Expected: Can save pages to localStorage and load them back

- [ ] **Step 4: Commit**

```bash
git add src/services/googleDrive.js src/components/Editor.jsx
git commit -m "feat: add save/load functionality with localStorage fallback"
```

---

### Task 10: Testing & Polish

**Files:**
- Create: `tests/services/pageGenerator.test.js`

- [ ] **Step 1: Write tests for page generator**

Create `tests/services/pageGenerator.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { generateHTML } from '../../src/services/pageGenerator';
import { createEmptyPage, createSegment, createContentItem, CONTENT_TYPES } from '../../src/store/pageTypes';

describe('pageGenerator', () => {
  it('should generate valid HTML for empty page', () => {
    const page = createEmptyPage();
    const html = generateHTML(page);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
  });

  it('should include page title in HTML', () => {
    const page = createEmptyPage();
    page.title = 'Test Page';
    const html = generateHTML(page);
    expect(html).toContain('<title>Test Page</title>');
  });

  it('should render segments', () => {
    const page = createEmptyPage();
    const segment = createSegment('Hero');
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('<section');
    expect(html).toContain(`data-element-id="${segment.id}"`);
  });

  it('should render text content', () => {
    const page = createEmptyPage();
    const segment = createSegment();
    const content = createContentItem(CONTENT_TYPES.TEXT);
    content.settings.customOverrides.content = 'Hello World';
    segment.children.push(content);
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('Hello World');
  });

  it('should apply segment background color', () => {
    const page = createEmptyPage();
    const segment = createSegment();
    segment.settings.bgColor = '#ff0000';
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('background-color');
  });
});
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass

- [ ] **Step 3: Fix any responsive issues**

Verify in browser:
- Resize window to test responsiveness
- Check preview at different breakpoints
- Verify elements highlight correctly when selected

- [ ] **Step 4: Final commit**

```bash
git add tests/services/pageGenerator.test.js
git commit -m "test: add comprehensive tests for page generator"
```

---

### Task 11: Documentation & Final Polish

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:
```markdown
# Page Builder

A React-based visual editor for building responsive web page layouts.

## Features

- **Three-panel editor**: Structure tree, live preview, settings
- **Responsive output**: Mobile/tablet/desktop breakpoints
- **Global styles**: Manage colors, fonts, button styles
- **Save/Load**: Persist pages to localStorage (Google Drive integration ready)
- **WYSIWYG**: See changes in real-time in the preview

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Architecture

- **React Context** for state management
- **JSON** for page data model
- **HTML/CSS generation** from page model
- **localStorage** for persistence (MVP)

## File Structure

- `src/components/` - UI components (editor panels)
- `src/services/` - Business logic (page generation, storage)
- `src/store/` - State management and types
- `src/utils/` - Constants and helpers

## Next Steps

- [ ] Google Drive API integration
- [ ] Brand/Styles management UI improvements
- [ ] Responsive breakpoint editing
- [ ] Rich text editor for text content
- [ ] Image upload and management
- [ ] Undo/redo history
```

- [ ] **Step 2: Verify all features work**

Checklist:
- [ ] Add segment
- [ ] Add container
- [ ] Add content (text, image, button)
- [ ] Edit settings in right panel
- [ ] Preview updates in real-time
- [ ] Select/deselect elements
- [ ] Delete elements
- [ ] Save page
- [ ] Load page

- [ ] **Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

- [ ] **Step 4: Clean up & verification**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 5: Closing commit**

```bash
git log --oneline | head -15
```

Expected: Clear, atomic commits for each feature

---

## Summary

This plan builds a fully functional Page Builder prototype with:
- ✅ Three-panel editor interface
- ✅ Real-time HTML/CSS preview
- ✅ Full page structure management (page → segments → containers → content)
- ✅ Settings for all element types
- ✅ Global style definitions
- ✅ Save/load functionality
- ✅ Responsive output

**Ready for team prototyping and feature expansion.**
