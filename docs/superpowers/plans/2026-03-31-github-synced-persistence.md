# GitHub-Synced Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auto-save persistence that commits page changes to GitHub, working identically on local dev and Netlify production.

**Architecture:** Three-layer abstraction (Frontend → Storage Service → Backend). Storage service detects environment and routes to either local filesystem+git or GitHub API. Auto-save triggers after 3s inactivity and shows status to user. New Page button replaces Save button for creating blank pages.

**Tech Stack:** Express.js (local dev), Octokit (GitHub API), Netlify Functions (production), git CLI (local commits)

---

## File Structure

**New Files:**
- `src/services/fileStorage.js` - Factory and abstraction interface
- `src/services/fileStorageLocal.js` - Local filesystem implementation (calls Express backend)
- `src/services/fileStorageGitHub.js` - GitHub API implementation
- `server/index.js` - Express backend for local development
- `netlify/functions/api.js` - Netlify Functions for production
- `.env.example` - Environment variable template
- `.env.local` - Local dev credentials (gitignored, created manually)
- `netlify.toml` - Netlify configuration

**Modified Files:**
- `src/components/Editor.jsx` - Auto-save logic, New Page button, status indicator
- `src/store/pageStore.jsx` - Save status action
- `vite.config.js` - Proxy setup for dev API calls
- `package.json` - Dependencies

---

## Task 1: Setup Dependencies and Configuration

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `.env.local` (manual, user creates)
- Modify: `vite.config.js`

- [ ] **Step 1: Add dependencies to package.json**

Add these to `package.json` under `devDependencies`:
```json
{
  "devDependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "octokit": "^2.1.0",
    "concurrently": "^7.6.0"
  }
}
```

Also add to `scripts` section:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:server\"",
    "dev:vite": "vite",
    "dev:server": "node server/index.js"
  }
}
```

- [ ] **Step 2: Create .env.example**

```bash
cat > .env.example << 'EOF'
# GitHub Configuration (for production/Netlify)
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=owner/repo-name
GITHUB_BRANCH=main
GITHUB_USER_EMAIL=your-email@example.com

# Local Development (Express)
VITE_API_URL=http://localhost:3001
EOF
```

- [ ] **Step 3: Copy .env.example to .env.local (user does this manually)**

User creates `.env.local` with their actual values:
```bash
cp .env.example .env.local
# User edits .env.local with their GitHub token
```

Add to `.gitignore`:
```
.env.local
.env
node_modules/
```

- [ ] **Step 4: Configure vite.config.js for API proxy**

Update or create `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
```

- [ ] **Step 5: Run npm install**

```bash
npm install
```

Expected: All packages installed, no errors

- [ ] **Step 6: Commit**

```bash
git add package.json .env.example vite.config.js .gitignore
git commit -m "chore: add dependencies for file persistence"
```

---

## Task 2: Create File Storage Abstraction

**Files:**
- Create: `src/services/fileStorage.js`

- [ ] **Step 1: Create the abstraction interface**

```javascript
// src/services/fileStorage.js

/**
 * Storage abstraction that detects environment and returns appropriate implementation.
 * Works on both local dev (Express) and Netlify (Functions with GitHub API).
 */

let storageInstance = null;

function getStorageImplementation() {
  // In production (Netlify), use GitHub API
  if (typeof window === 'undefined' || process.env.NETLIFY) {
    const { fileStorageGitHub } = require('./fileStorageGitHub');
    return fileStorageGitHub;
  }

  // In browser, use Express backend (local dev or Netlify preview)
  const { fileStorageLocal } = require('./fileStorageLocal');
  return fileStorageLocal;
}

export const storage = {
  /**
   * Save a page to storage and commit to GitHub
   * @param {string} pageName - Name of page (e.g., "homepage")
   * @param {object} pageData - Full page object with all settings
   * @returns {Promise<{success: true, commitHash?: string, message: string}>}
   */
  async savePage(pageName, pageData) {
    const impl = getStorageImplementation();
    return impl.savePage(pageName, pageData);
  },

  /**
   * Load a single page from storage
   * @param {string} pageName - Name of page to load
   * @returns {Promise<object|null>} Page object or null if not found
   */
  async loadPage(pageName) {
    const impl = getStorageImplementation();
    return impl.loadPage(pageName);
  },

  /**
   * List all available pages in storage
   * @returns {Promise<Array>} Array of {name, path} objects
   */
  async listPages() {
    const impl = getStorageImplementation();
    return impl.listPages();
  },

  /**
   * Create a new blank page
   * @param {string} pageName - Name for new page
   * @returns {Promise<object>} Blank page object
   */
  async createNewPage(pageName) {
    const impl = getStorageImplementation();
    return impl.createNewPage(pageName);
  }
};

export default storage;
```

- [ ] **Step 2: Commit**

```bash
git add src/services/fileStorage.js
git commit -m "feat: add file storage abstraction layer"
```

---

## Task 3: Create Local File Storage Implementation

**Files:**
- Create: `src/services/fileStorageLocal.js`

- [ ] **Step 1: Create local storage implementation**

```javascript
// src/services/fileStorageLocal.js

/**
 * Local development storage implementation.
 * Calls Express backend which handles file I/O and git commits.
 */

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const fileStorageLocal = {
  async savePage(pageName, pageData) {
    const response = await fetch(`${API_URL}/api/pages/${pageName}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: fileData })
    });
    return handleResponse(response);
  },

  async loadPage(pageName) {
    try {
      const response = await fetch(`${API_URL}/api/pages/${pageName}`);
      if (response.status === 404) return null;
      return handleResponse(response);
    } catch (error) {
      console.error('Error loading page:', error);
      return null;
    }
  },

  async listPages() {
    const response = await fetch(`${API_URL}/api/pages`);
    return handleResponse(response);
  },

  async createNewPage(pageName) {
    const response = await fetch(`${API_URL}/api/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: pageName })
    });
    return handleResponse(response);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/fileStorageLocal.js
git commit -m "feat: add local file storage backend implementation"
```

---

## Task 4: Create GitHub API Storage Implementation

**Files:**
- Create: `src/services/fileStorageGitHub.js`

- [ ] **Step 1: Create GitHub storage implementation**

```javascript
// src/services/fileStorageGitHub.js

/**
 * GitHub API storage implementation for production (Netlify).
 * Uses GitHub API to read/write files and create commits.
 * Env vars: GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH
 */

const { Octokit } = require('octokit');

function validateEnv() {
  const required = ['GITHUB_TOKEN', 'GITHUB_REPO', 'GITHUB_BRANCH'];
  const missing = required.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPO.split('/');
const branch = process.env.GITHUB_BRANCH;

export const fileStorageGitHub = {
  async savePage(pageName, pageData) {
    validateEnv();

    const path = `templates/${pageName}.json`;
    const content = JSON.stringify(pageData, null, 2);
    const encoding = 'utf-8';

    try {
      // Get current file SHA (needed for update)
      let sha = null;
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner, repo, path, ref: branch
        });
        sha = data.sha;
      } catch (e) {
        // File doesn't exist yet, that's okay
      }

      // Create or update file
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner, repo, path,
        message: `Auto-save: ${pageName} @ ${new Date().toISOString()}`,
        content: Buffer.from(content).toString('base64'),
        branch,
        ...(sha && { sha })
      });

      return {
        success: true,
        commitHash: data.commit.sha,
        message: 'Saved to GitHub'
      };
    } catch (error) {
      throw new Error(`Failed to save: ${error.message}`);
    }
  },

  async loadPage(pageName) {
    validateEnv();

    const path = `templates/${pageName}.json`;

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path, ref: branch
      });

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.status === 404) return null;
      throw new Error(`Failed to load: ${error.message}`);
    }
  },

  async listPages() {
    validateEnv();

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path: 'templates', ref: branch
      });

      return data
        .filter(item => item.name.endsWith('.json'))
        .map(item => ({
          name: item.name.replace('.json', ''),
          path: item.path
        }));
    } catch (error) {
      if (error.status === 404) return [];
      throw new Error(`Failed to list pages: ${error.message}`);
    }
  },

  async createNewPage(pageName) {
    // Return blank page template
    return {
      id: `page-${Date.now()}`,
      title: pageName,
      root: [],
      styles: {
        colors: { primary: '#3b82f6', secondary: '#8b5cf6', neutral: '#6b7280' },
        fonts: {
          heading: { family: 'Inter', sizeMin: 28, sizeMax: 48, weight: 700 },
          body: { family: 'Inter', sizeMin: 14, sizeMax: 18, weight: 400 }
        },
        buttonStyles: [{ id: 'default', bgColor: '#3b82f6', textColor: '#ffffff', padding: 12, radius: 6 }],
        bgColor: '#f9fafb'
      }
    };
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/fileStorageGitHub.js
git commit -m "feat: add GitHub API storage implementation"
```

---

## Task 5: Create Express Backend Server

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: Create Express server with API routes**

```javascript
// server/index.js

require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const TEMPLATES_DIR = path.join(__dirname, '../templates');

app.use(cors());
app.use(express.json());

// Ensure templates directory exists
async function ensureTemplatesDir() {
  try {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create templates directory:', error);
  }
}

// API Routes

// POST /api/pages - Create new page
app.post('/api/pages', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.match(/^[a-z0-9\-]+$/i)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page name (alphanumeric and hyphens only)'
      });
    }

    const filePath = path.join(TEMPLATES_DIR, `${name}.json`);

    // Check if already exists
    try {
      await fs.access(filePath);
      return res.status(409).json({
        success: false,
        message: 'Page already exists'
      });
    } catch {
      // Doesn't exist, that's good
    }

    // Create blank page
    const blankPage = {
      id: `page-${Date.now()}`,
      title: name,
      root: [],
      styles: {
        colors: { primary: '#3b82f6', secondary: '#8b5cf6', neutral: '#6b7280' },
        fonts: {
          heading: { family: 'Inter', sizeMin: 28, sizeMax: 48, weight: 700 },
          body: { family: 'Inter', sizeMin: 14, sizeMax: 18, weight: 400 }
        },
        buttonStyles: [{ id: 'default', bgColor: '#3b82f6', textColor: '#ffffff', padding: 12, radius: 6 }],
        bgColor: '#f9fafb'
      }
    };

    await fs.writeFile(filePath, JSON.stringify(blankPage, null, 2));

    // Commit to git
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(`git commit -m "Create page: ${name}"`, { cwd: path.dirname(TEMPLATES_DIR) });
    } catch (error) {
      console.warn('Git commit failed (might not be in repo):', error.message);
    }

    res.json({ success: true, page: blankPage });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/pages - List all pages
app.get('/api/pages', async (req, res) => {
  try {
    await ensureTemplatesDir();
    const files = await fs.readdir(TEMPLATES_DIR);
    const pages = files
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f.replace('.json', ''),
        path: `templates/${f}`
      }));
    res.json(pages);
  } catch (error) {
    console.error('List pages error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/pages/:name - Load single page
app.get('/api/pages/:name', async (req, res) => {
  try {
    const filePath = path.join(TEMPLATES_DIR, `${req.params.name}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Page not found' });
    }
    console.error('Load page error:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/pages/:name/save - Auto-save page
app.post('/api/pages/:name/save', async (req, res) => {
  try {
    const { page } = req.body;
    const filePath = path.join(TEMPLATES_DIR, `${req.params.name}.json`);

    await ensureTemplatesDir();
    await fs.writeFile(filePath, JSON.stringify(page, null, 2));

    // Commit to git
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(
        `git commit -m "Auto-save: ${req.params.name} @ ${new Date().toISOString()}"`,
        { cwd: path.dirname(TEMPLATES_DIR) }
      );
    } catch (error) {
      // Commit might fail if nothing changed, that's okay
    }

    res.json({ success: true, message: 'Saved' });
  } catch (error) {
    console.error('Save page error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// Start server
ensureTemplatesDir().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Pagebuilder API server running on http://localhost:${PORT}`);
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add server/index.js
git commit -m "feat: add Express backend for file persistence"
```

---

## Task 6: Add Auto-Save and Save Status to Page Store

**Files:**
- Modify: `src/store/pageStore.jsx`

- [ ] **Step 1: Add save status state to reducer**

Update the `initialState` in `pageStore.jsx`:
```javascript
const initialState = {
  page: createEmptyPage(),
  selectedElementId: null,
  selectedElementType: null,
  activeBrandSection: null,
  saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
  saveError: null
};
```

- [ ] **Step 2: Add save status actions**

Add these cases to the `pageReducer` function:
```javascript
case 'SET_SAVE_STATUS':
  return {
    ...state,
    saveStatus: action.payload.status,
    saveError: action.payload.error || null
  };

case 'CLEAR_SAVE_ERROR':
  return {
    ...state,
    saveError: null
  };
```

- [ ] **Step 3: Export new actions**

Add to `pageActions` object:
```javascript
setSaveStatus: (status, error = null) => ({
  type: 'SET_SAVE_STATUS',
  payload: { status, error }
}),
clearSaveError: () => ({ type: 'CLEAR_SAVE_ERROR' })
```

- [ ] **Step 4: Commit**

```bash
git add src/store/pageStore.jsx
git commit -m "feat: add save status tracking to page store"
```

---

## Task 7: Add Auto-Save Logic to Editor

**Files:**
- Modify: `src/components/Editor.jsx`

- [ ] **Step 1: Import storage service and add auto-save effect**

At the top of `Editor.jsx`, add:
```javascript
import { storage } from '../services/fileStorage';
```

Then add this hook inside the `Editor` component (after line 14):
```javascript
const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);

// Auto-save when page changes
useEffect(() => {
  // Clear existing timeout
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

  // Only auto-save if page has a name (not untitled)
  if (!state.page.title || state.page.title === 'Untitled Page') {
    return;
  }

  // Set new timeout for auto-save
  const timeout = setTimeout(async () => {
    dispatch(pageActions.setSaveStatus('saving'));
    try {
      const result = await storage.savePage(state.page.title, state.page);
      dispatch(pageActions.setSaveStatus('saved'));
      // Clear saved status after 2 seconds
      setTimeout(() => {
        dispatch(pageActions.setSaveStatus('idle'));
      }, 2000);
    } catch (error) {
      dispatch(pageActions.setSaveStatus('error', error.message));
    }
  }, 3000); // 3 second debounce

  setAutoSaveTimeout(timeout);

  return () => clearTimeout(timeout);
}, [state.page, dispatch]); // Re-run when page changes
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Editor.jsx
git commit -m "feat: add auto-save with 3-second debounce"
```

---

## Task 8: Replace Save Button with New Page Button

**Files:**
- Modify: `src/components/Editor.jsx`

- [ ] **Step 1: Update handleSave to handleNewPage**

Replace the `handleSave` function (line 16-22) with:
```javascript
const handleNewPage = async () => {
  const pageName = saveFileName.trim();

  if (!pageName) {
    return;
  }

  // Validate name
  if (!pageName.match(/^[a-z0-9\-]+$/i)) {
    alert('Page name must contain only letters, numbers, and hyphens');
    return;
  }

  try {
    dispatch(pageActions.setSaveStatus('saving'));
    const newPage = await storage.createNewPage(pageName);
    dispatch(pageActions.setPage(newPage));
    dispatch(pageActions.setSaveStatus('saved'));
    setShowSaveDialog(false);
    setSaveFileName('');

    // Clear saved status after 2 seconds
    setTimeout(() => {
      dispatch(pageActions.setSaveStatus('idle'));
    }, 2000);
  } catch (error) {
    dispatch(pageActions.setSaveStatus('error', error.message));
  }
};
```

- [ ] **Step 2: Update Save button text and handler**

Find the first button (line 51-65) and update it:
```javascript
<button
  onClick={() => setShowSaveDialog(true)}
  style={{
    padding: '6px 12px',
    backgroundColor: THEME.accent,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  }}
>
  New Page
</button>
```

- [ ] **Step 3: Update dialog title and button**

In the save dialog (line 96-167), change:
- Line 116: `<h3 style={{ marginBottom: '16px' }}>Save Page</h3>` → `Create Page`
- Line 119: `placeholder="Page name..."` (keep as is)
- Line 150-163: The save button text and handler:

```javascript
<button
  onClick={handleNewPage}
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
  Create
</button>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor.jsx
git commit -m "feat: replace Save with New Page button"
```

---

## Task 9: Add Save Status Indicator

**Files:**
- Modify: `src/components/Editor.jsx`

- [ ] **Step 1: Add status indicator to header**

In the header section (around line 49), add the status indicator next to the title:
```javascript
<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
    {state.page.title || 'Untitled Page'}
  </h1>
  {state.saveStatus !== 'idle' && (
    <span style={{
      fontSize: '12px',
      fontWeight: 500,
      color: state.saveStatus === 'error' ? '#ef4444' : '#10b981',
      minWidth: '80px'
    }}>
      {state.saveStatus === 'saving' && '⟳ Saving...'}
      {state.saveStatus === 'saved' && '✓ Saved'}
      {state.saveStatus === 'error' && `✗ Error: ${state.saveError}`}
    </span>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Editor.jsx
git commit -m "feat: add save status indicator to header"
```

---

## Task 10: Create Netlify Functions for Production

**Files:**
- Create: `netlify/functions/api.js`
- Create: `netlify.toml`

- [ ] **Step 1: Create Netlify configuration**

```toml
# netlify.toml

[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api:splat"
  status = 200

[env.production]
  [env.production.build.environment]
    NODE_VERSION = "18"
```

- [ ] **Step 2: Create Netlify Functions wrapper**

```javascript
// netlify/functions/api.js

import { storage } from '../../src/services/fileStorageGitHub.js';

// Netlify Functions handler
export default async (request, context) => {
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/.netlify/functions/api', '');
  const method = request.method;

  try {
    // POST /api/pages - Create new page
    if (method === 'POST' && pathname === '/api/pages') {
      const { name } = await request.json();

      if (!name || !name.match(/^[a-z0-9\-]+$/i)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid page name' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const page = await storage.createNewPage(name);
      // Commit to GitHub
      await storage.savePage(name, page);

      return new Response(JSON.stringify({ success: true, page }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/pages - List all pages
    if (method === 'GET' && pathname === '/api/pages') {
      const pages = await storage.listPages();
      return new Response(JSON.stringify(pages),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/pages/:name - Load page
    const pageMatch = pathname.match(/^\/api\/pages\/([^\/]+)$/);
    if (method === 'GET' && pageMatch) {
      const page = await storage.loadPage(pageMatch[1]);
      if (!page) {
        return new Response(JSON.stringify({ message: 'Not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify(page),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/pages/:name/save - Save page
    const saveMatch = pathname.match(/^\/api\/pages\/([^\/]+)\/save$/);
    if (method === 'POST' && saveMatch) {
      const { page } = await request.json();
      const result = await storage.savePage(saveMatch[1], page);
      return new Response(JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Not found
    return new Response(JSON.stringify({ message: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/api.js netlify.toml
git commit -m "feat: add Netlify Functions for production"
```

---

## Task 11: Test Locally

**Files:**
- No new files, testing existing implementation

- [ ] **Step 1: Start dev servers**

In one terminal:
```bash
npm run dev
```

Expected output:
```
🚀 Pagebuilder API server running on http://localhost:3001
  VITE v... ready in ... ms
  ➜  Local:   http://localhost:5173/
```

- [ ] **Step 2: Create a new page**

1. Click "New Page" button
2. Enter: `test-page`
3. Click "Create"
4. Check that page loads and header shows "test-page"

- [ ] **Step 3: Verify file created**

```bash
ls -la templates/
# Should show: templates/test-page.json
```

- [ ] **Step 4: Edit and auto-save**

1. In editor, click a segment to select it
2. In settings panel, change something (e.g., background color)
3. Wait 3 seconds
4. Check git log:

```bash
git log --oneline | head -5
# Should show: "Auto-save: test-page @ ..."
```

- [ ] **Step 5: Load page in new session**

1. Click "Load" button
2. See "test-page" in list
3. Click to load
4. Verify page renders correctly

- [ ] **Step 6: Test error handling**

1. Stop the Express server (Ctrl+C server terminal)
2. Try to edit page
3. Wait 3 seconds
4. Check that error appears in header: "✗ Error: ..."
5. Restart server
6. Verify auto-save resumes

- [ ] **Step 7: Commit test results**

```bash
git add templates/
git commit -m "test: verify auto-save and new page creation locally"
```

---

## Task 12: Documentation and Final Verification

**Files:**
- Create: `PERSISTENCE_SETUP.md`

- [ ] **Step 1: Create setup documentation**

```markdown
# File Persistence Setup

## Local Development

### Initial Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from template:
   ```bash
   cp .env.example .env.local
   ```

3. For local-only development (no GitHub sync yet):
   - You can leave GitHub vars empty or set dummy values
   - Pages will still auto-save to `templates/` folder

4. To enable GitHub sync during development:
   - Generate GitHub token: https://github.com/settings/tokens
   - Token needs: `repo`, `contents` scopes
   - Add to `.env.local`:
     ```
     GITHUB_TOKEN=your_token_here
     GITHUB_REPO=owner/your-repo
     GITHUB_BRANCH=main
     ```

### Running Locally

```bash
npm run dev
```

This starts:
- Vite dev server on http://localhost:5173
- Express API on http://localhost:3001

### How It Works

- Auto-save triggers 3 seconds after you stop editing
- Pages saved as JSON in `templates/` folder
- Changes committed to git automatically
- You can commit to GitHub with normal git push

## Production (Netlify)

### Environment Setup

In Netlify dashboard, set these:
- `GITHUB_TOKEN` - Personal access token
- `GITHUB_REPO` - e.g., `owner/pagebuilder`
- `GITHUB_BRANCH` - e.g., `main`

### How It Works

- API calls routed to Netlify Functions
- Functions use GitHub API (no local files)
- Pages saved directly to GitHub
- All changes appear in commits

## Troubleshooting

**"Cannot GET /api/pages"**
- Make sure Express server is running
- Check both terminals in `npm run dev` are active

**"Error: GITHUB_TOKEN not set"**
- Set `GITHUB_TOKEN` in `.env.local` (dev) or Netlify dashboard (prod)

**Pages not appearing after save**
- Check `templates/` folder exists
- Check git log: `git log templates/`

**Git commits failing locally**
- Make sure git is configured: `git config user.name` and `user.email`
```

- [ ] **Step 2: Add to README (if exists)**

If project has README.md, add a section:

```markdown
## Data Persistence

Pages are auto-saved as JSON files and committed to git. See [PERSISTENCE_SETUP.md](./PERSISTENCE_SETUP.md) for configuration.
```

- [ ] **Step 3: Final verification checklist**

Run through each scenario:
- [ ] Create new page works
- [ ] Auto-save triggers after 3s
- [ ] Git commits created for each save
- [ ] Load page loads correct data
- [ ] Save status indicator shows
- [ ] Error handling works (stop server, see error)
- [ ] Netlify env vars documented

- [ ] **Step 4: Commit**

```bash
git add PERSISTENCE_SETUP.md
# Update README if needed
git commit -m "docs: add persistence setup guide"
```

- [ ] **Step 5: Final commit**

```bash
git log --oneline | head -10
# Review commits look good
```

---

## Spec Coverage Checklist

- ✅ Auto-save: Triggers 3s after inactivity, shows status
- ✅ File storage: JSON files in `templates/` folder
- ✅ GitHub sync: Auto-commits with timestamps
- ✅ New page: "New Page" button creates blank pages
- ✅ Load: Load dialog lists and opens pages
- ✅ Local dev: Express server with git integration
- ✅ Production: Netlify Functions with GitHub API
- ✅ Error handling: Status indicator shows errors
- ✅ Environment detection: Works in both contexts

