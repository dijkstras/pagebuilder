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
