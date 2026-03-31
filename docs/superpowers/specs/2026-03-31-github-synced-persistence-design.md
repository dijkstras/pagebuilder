---
name: GitHub-Synced Page Persistence with Auto-Save
description: Design for saving page templates to GitHub with auto-save and manual page creation
type: design
date: 2026-03-31
---

# GitHub-Synced Page Persistence Design

## Overview

This design implements persistent page storage with automatic synchronization to GitHub. Pages are saved as JSON files in a `templates/` directory that's version-controlled and shared across the team. The system works in two environments:
- **Local development**: Express backend writes to disk and commits to GitHub
- **Production (Netlify)**: Netlify Functions use GitHub API to commit directly

## Architecture

### Three-Tier System

```
┌─────────────────┐
│  React Editor   │ (Frontend)
│ Auto-save logic │
└────────┬────────┘
         │ (HTTP API)
         ▼
┌─────────────────────────────────┐
│  Backend Abstraction Layer      │
│  (fileStorage.js)               │
│  - Handles both dev & prod      │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Local      GitHub
(Express)   (API)
    │         │
    ▼         ▼
 /templates/  Repo
```

### File Structure

```
pagebuilder/
├── src/
│   ├── services/
│   │   ├── fileStorage.js          (NEW: abstraction layer)
│   │   ├── fileStorageLocal.js     (NEW: local dev implementation)
│   │   ├── fileStorageGitHub.js    (NEW: GitHub API implementation)
│   │   └── pageGenerator.js        (existing)
│   ├── components/
│   │   └── Editor.jsx              (MODIFY: auto-save + new page logic)
│   └── ...
├── templates/                       (NEW: synced to git)
│   ├── homepage.json
│   ├── about.json
│   └── ...
├── server/                         (NEW: local dev backend)
│   └── index.js                    (Express server, dev only)
└── .env.example                    (NEW: template for env vars)
```

## Feature: Auto-Save

### Behavior

1. User edits page in editor
2. After 3 seconds of inactivity, auto-save triggers
3. Frontend calls `/api/pages/{pageName}/save` with page JSON
4. Backend saves file and commits to GitHub
5. UI shows brief "Saved" status indicator
6. If save fails, user sees error and can retry manually

### Implementation

**Frontend (Editor.jsx):**
- Add `useEffect` to debounce page changes (3s delay)
- Track save state: `idle | saving | saved | error`
- Display status indicator in header
- Disable "New Page" button while saving

**Backend:**
- POST `/api/pages/{pageName}/save`
  - Body: `{ page: {...} }`
  - Returns: `{ success: true, message: "Saved" }`
  - On error: HTTP 500 with error message

### GitHub Commits

Each auto-save creates a commit:
```
Commit message: "Auto-save: {pageName} @ {timestamp}"
Author: pagebuilder-bot (or current GitHub user)
```

Users can see edit history by viewing commit log for `templates/{pageName}.json`

## Feature: New Page Creation

### Behavior

1. User clicks "New Page" button (replaces old Save button)
2. Dialog appears asking for page name
3. Backend creates blank page at `templates/{pageName}.json`
4. New page loads in editor
5. First auto-save commits the new page to GitHub

### Implementation

**Frontend (Editor.jsx):**
- Replace Save button with "New Page" button
- New dialog: "Create Page" with text input
- Call `/api/pages/create` with page name
- On success, dispatch `setPage` with blank template
- On error, show error message in dialog

**Backend:**
- POST `/api/pages/create`
  - Body: `{ name: "page-name" }`
  - Returns: blank page object
  - Creates file: `templates/{name}.json`

## File Storage Service

### Interface (`src/services/fileStorage.js`)

```javascript
// Environment detection - returns correct implementation
export const storage = getStorageImplementation();

storage.savePage(pageName, pageData)
  // Returns: { success: true, commitHash: "abc123" }

storage.loadPage(pageName)
  // Returns: page object or null

storage.listPages()
  // Returns: [{ name: "homepage", path: "templates/homepage.json" }, ...]

storage.createNewPage(name)
  // Returns: blank page object (same structure as empty page)
```

### Local Implementation (`src/services/fileStorageLocal.js`)

- Runs during local development
- Express server writes to `/templates/` directory
- Commits via `child_process.exec('git commit ...')`
- Reads files from disk

### GitHub Implementation (`src/services/fileStorageGitHub.js`)

- Runs on Netlify
- Uses GitHub API (Octokit) to read/write files
- Requires env vars: `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`
- All operations go through API calls
- No local file system dependency

## Environment Setup

### Local Development

**Express server (server/index.js):**
- Runs on port 3001
- Serves API endpoints
- Middleware: auth, JSON parsing, error handling

**Vite dev server (port 5173):**
- Proxies `/api/*` to `http://localhost:3001/api/*`

**Git setup:**
- Auto-commits happen with `user.name` and `user.email` from git config
- Uses local git, no auth needed

**Start command:**
```bash
npm run dev  # starts both Vite (5173) and Express (3001)
```

### Production (Netlify)

**Netlify Functions:**
- Replaces Express routes
- File: `netlify/functions/api.js`
- Routes: `/api/pages/save`, `/api/pages/create`, `/api/pages/list`, `/api/pages/load`

**Environment variables (set in Netlify dashboard):**
- `GITHUB_TOKEN` - Personal access token with repo write access
- `GITHUB_REPO` - Full repo path (e.g., `owner/pagebuilder`)
- `GITHUB_BRANCH` - Target branch (e.g., `main`)

**Behavior:**
- Receives API request
- Calls GitHub API to commit/read files
- Returns response to frontend

## Data Flow: Save Page

### Local Dev
```
1. Editor → POST /api/pages/save
2. Express receives request
3. Write file: templates/pageName.json
4. Run: git add templates/pageName.json
5. Run: git commit -m "Auto-save: pageName @ timestamp"
6. git push origin main (optional, auto or manual)
7. Return success response
```

### Netlify Production
```
1. Editor → POST /.netlify/functions/api
2. Netlify Function receives request
3. GitHub API: PUT /repos/owner/repo/contents/templates/pageName.json
4. GitHub API: POST /repos/owner/repo/commits (create commit)
5. Return success response
6. File is now in GitHub repo
```

## Data Flow: Load Page

### Local Dev
```
1. Editor requests list of pages
2. Express reads /templates directory
3. Returns array of filenames
4. User selects page
5. Express reads templates/{name}.json
6. Parse and return page object
```

### Netlify Production
```
1. Editor requests list of pages
2. Netlify Function calls GitHub API: GET /repos/owner/repo/contents/templates
3. Returns file list
4. User selects page
5. Netlify Function calls GitHub API: GET /repos/owner/repo/contents/templates/{name}.json
6. Parse and return page object
```

## Error Handling

**Save failures:**
- Network error → "Could not save. Check connection." (retry UI)
- GitHub API error → "Save failed: {error message}" (show specific error)
- File conflict → "Page was modified elsewhere. Refresh to reload." (reload)

**Load failures:**
- Page not found → "Page not found" (show list)
- Network error → "Could not load pages" (retry option)
- Parse error → "Page data is corrupted" (delete option)

**UI Behavior:**
- Save errors don't block editing
- User can retry save or continue editing
- Auto-save pauses on error, resumes after 5s
- Error messages clear after 5s

## Security Considerations

### GitHub Token Management

- Never commit `GITHUB_TOKEN` to git
- Use `.env.local` (gitignored) for local development
- On Netlify: set via dashboard (encrypted storage)
- Rotation: Update token in Netlify dashboard, `.env.local`

### API Authentication

- Local dev: No authentication needed (local-only)
- Netlify: Use Netlify Functions environment variables (secure)
- In future: Could add user auth if needed (OAuth, etc.)

### File Operations

- Validate page name (alphanumeric + hyphens only)
- Prevent path traversal (no `../` in names)
- Limit file size (max 1MB per page)

## Testing Strategy

### Local Dev Testing

1. **Create page:** "New Page" → name it → auto-save → check git log
2. **Edit page:** Change content → wait 3s → verify commit in git
3. **Load page:** Click Load → select page → verify it renders
4. **Error case:** Disconnect from git → try to save → verify error message

### Production Testing (Netlify)

1. Set test GitHub token in Netlify dashboard
2. Deploy preview build
3. Create/edit page → verify appears in GitHub repo
4. Load page from different session → verify loads correctly

## Migration Path

**Existing pages:**
- If users have pages in localStorage, provide migration script
- Script reads localStorage, creates JSON files in `/templates/`
- Commits initial state to GitHub with message "Migrate from localStorage"

## Success Criteria

✅ Auto-save works (fires after 3s inactivity)
✅ Pages saved as JSON in `templates/` folder
✅ All page changes committed to GitHub with messages
✅ New Page button creates blank pages
✅ Load dialog shows all pages from GitHub
✅ Works identically on local dev and Netlify
✅ Save/load errors handled gracefully
✅ No GitHub token in commits or logs

## Open Questions / Future Enhancements

- Auto-push to GitHub (currently: manual push or CI)
- Undo/history UI (leverage git history)
- Collaborative editing (git conflicts, merge UI)
- Page templates/presets library
- Duplicate page feature
