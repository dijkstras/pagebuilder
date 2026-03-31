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
