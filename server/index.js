// server/index.js

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      breakpoints: {
        mobile: 320,
        tablet: 768,
        desktop: 1024
      },
      root: [],
      styles: {
        logo: null,
        colors: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#ec4899',
          text: '#1f2937',
          background: '#f9fafb',
          neutral: '#6b7280'
        },
        fonts: {
          heading1: { family: 'Inter', size: 48, weight: 700 },
          heading2: { family: 'Inter', size: 32, weight: 600 },
          body: { family: 'Inter', size: 16, weight: 400 },
          label: { family: 'Inter', size: 12, weight: 500 }
        },
        buttonStyles: [
          { id: 'primary', label: 'Primary', bgColor: '#3b82f6', textColor: '#ffffff', padding: 12, radius: 6 },
          { id: 'secondary', label: 'Secondary', bgColor: '#e5e7eb', textColor: '#1f2937', padding: 12, radius: 6 },
          { id: 'tertiary', label: 'Tertiary', bgColor: 'transparent', textColor: '#3b82f6', padding: 12, radius: 6 }
        ],
        shapes: { borderRadius: 6 },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
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

// GET /api/pages - List all pages with metadata
app.get('/api/pages', async (req, res) => {
  try {
    await ensureTemplatesDir();
    const files = await fs.readdir(TEMPLATES_DIR);
    const pages = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (f) => {
          const filePath = path.join(TEMPLATES_DIR, f);
          const stat = await fs.stat(filePath);
          return {
            name: f.replace('.json', ''),
            path: `templates/${f}`,
            id: f.replace('.json', ''),
            lastModified: stat.mtime.toISOString()
          };
        })
    );
    // Sort by lastModified descending (newest first)
    pages.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
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

// DELETE /api/pages/:name - Delete a page
app.delete('/api/pages/:name', async (req, res) => {
  try {
    const filePath = path.join(TEMPLATES_DIR, `${req.params.name}.json`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Delete file
    await fs.unlink(filePath);

    // Commit deletion to git
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(
        `git commit -m "Delete page: ${req.params.name}"`,
        { cwd: path.dirname(TEMPLATES_DIR) }
      );
    } catch (error) {
      console.warn('Git commit failed:', error.message);
    }

    res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/pages/:name/duplicate - Duplicate a page
app.post('/api/pages/:name/duplicate', async (req, res) => {
  try {
    const { newName } = req.body;
    const oldFilePath = path.join(TEMPLATES_DIR, `${req.params.name}.json`);
    const newFilePath = path.join(TEMPLATES_DIR, `${newName}.json`);

    if (!newName || !newName.match(/^[a-z0-9\-]+$/i)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page name (alphanumeric and hyphens only)'
      });
    }

    // Check if source exists
    try {
      await fs.access(oldFilePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Source page not found' });
    }

    // Check if destination already exists
    try {
      await fs.access(newFilePath);
      return res.status(409).json({
        success: false,
        message: 'Destination page already exists'
      });
    } catch {
      // Doesn't exist, that's good
    }

    // Read source and duplicate
    const content = await fs.readFile(oldFilePath, 'utf-8');
    const pageData = JSON.parse(content);
    pageData.title = newName;
    pageData.id = `page-${Date.now()}`;

    await fs.writeFile(newFilePath, JSON.stringify(pageData, null, 2));

    // Commit to git
    try {
      execSync(`git add ${newFilePath}`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(
        `git commit -m "Duplicate page: ${req.params.name} -> ${newName}"`,
        { cwd: path.dirname(TEMPLATES_DIR) }
      );
    } catch (error) {
      console.warn('Git commit failed:', error.message);
    }

    res.json({ success: true, page: pageData });
  } catch (error) {
    console.error('Duplicate page error:', error);
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
