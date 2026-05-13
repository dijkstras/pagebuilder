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
const COLOR_PRESETS_DIR = path.join(__dirname, '../color-presets');
const TYPOGRAPHY_PRESETS_DIR = path.join(__dirname, '../typography-presets');
const SEGMENTS_DIR = path.join(__dirname, '../segments');

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

// Ensure color-presets directory exists
async function ensureColorPresetsDir() {
  try {
    await fs.mkdir(COLOR_PRESETS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create color-presets directory:', error);
  }
}

// Ensure typography-presets directory exists
async function ensureTypographyPresetsDir() {
  try {
    await fs.mkdir(TYPOGRAPHY_PRESETS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create typography-presets directory:', error);
  }
}

// Ensure segments directory exists
async function ensureSegmentsDir() {
  try {
    await fs.mkdir(SEGMENTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create segments directory:', error);
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

    // Commit to git and push to GitHub
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(`git commit -m "Create page: ${name}"`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(`git push origin HEAD`, { cwd: path.dirname(TEMPLATES_DIR) });
      console.log(`✅ Pushed create page: ${name}`);
    } catch (error) {
      console.warn('Git push failed (might not be in repo):', error.message);
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

    // Commit to git and push to GitHub
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(
        `git commit -m "Auto-save: ${req.params.name} @ ${new Date().toISOString()}"`,
        { cwd: path.dirname(TEMPLATES_DIR) }
      );
      execSync(`git push origin HEAD`, { cwd: path.dirname(TEMPLATES_DIR) });
      console.log(`✅ Pushed auto-save: ${req.params.name}`);
    } catch (error) {
      // Commit/push might fail if nothing changed or auth issues, that's okay
      console.warn('Git push failed:', error.message);
    }

    res.json({ success: true, message: 'Saved to GitHub' });
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

    // Commit deletion to git and push to GitHub
    try {
      execSync(`git add -A`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(
        `git commit -m "Delete page: ${req.params.name}"`,
        { cwd: path.dirname(TEMPLATES_DIR) }
      );
      execSync(`git push origin HEAD`, { cwd: path.dirname(TEMPLATES_DIR) });
      console.log(`✅ Pushed delete page: ${req.params.name}`);
    } catch (error) {
      console.warn('Git push failed:', error.message);
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

    // Commit to git and push to GitHub
    try {
      execSync(`git add ${newFilePath}`, { cwd: path.dirname(TEMPLATES_DIR) });
      execSync(
        `git commit -m "Duplicate page: ${req.params.name} -> ${newName}"`,
        { cwd: path.dirname(TEMPLATES_DIR) }
      );
      execSync(`git push origin HEAD`, { cwd: path.dirname(TEMPLATES_DIR) });
      console.log(`✅ Pushed duplicate page: ${req.params.name} -> ${newName}`);
    } catch (error) {
      console.warn('Git push failed:', error.message);
    }

    res.json({ success: true, page: pageData });
  } catch (error) {
    console.error('Duplicate page error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Color Preset API Routes

// GET /api/color-presets - List all color presets
app.get('/api/color-presets', async (req, res) => {
  try {
    await ensureColorPresetsDir();
    const files = await fs.readdir(COLOR_PRESETS_DIR);
    const presets = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (f) => {
          const filePath = path.join(COLOR_PRESETS_DIR, f);
          const stat = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          return {
            id: f.replace('.json', ''),
            name: data.name || f.replace('.json', ''),
            colors: data.colors,
            savedAt: data.savedAt || stat.mtime.toISOString()
          };
        })
    );
    // Sort by savedAt descending (newest first)
    presets.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    res.json(presets);
  } catch (error) {
    console.error('List color presets error:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/color-presets - Save a color preset
app.post('/api/color-presets', async (req, res) => {
  try {
    const { name, colors } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preset name'
      });
    }

    if (!colors || typeof colors !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid colors object'
      });
    }

    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const filePath = path.join(COLOR_PRESETS_DIR, `${id}.json`);

    const presetData = {
      name: name.trim(),
      colors: colors,
      savedAt: new Date().toISOString()
    };

    await ensureColorPresetsDir();
    await fs.writeFile(filePath, JSON.stringify(presetData, null, 2));

    // Commit to git and push to GitHub
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(COLOR_PRESETS_DIR) });
      execSync(`git commit -m "Save color preset: ${name}"`, { cwd: path.dirname(COLOR_PRESETS_DIR) });
      execSync(`git push origin HEAD`, { cwd: path.dirname(COLOR_PRESETS_DIR) });
      console.log(`✅ Pushed save color preset: ${name}`);
    } catch (error) {
      console.warn('Git push failed (might not be in repo):', error.message);
    }

    res.json({ success: true, preset: { id, ...presetData } });
  } catch (error) {
    console.error('Save color preset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/color-presets/:id - Load a single color preset
app.get('/api/color-presets/:id', async (req, res) => {
  try {
    const filePath = path.join(COLOR_PRESETS_DIR, `${req.params.id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json({
      id: req.params.id,
      name: data.name,
      colors: data.colors,
      savedAt: data.savedAt
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Color preset not found' });
    }
    console.error('Load color preset error:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/color-presets/:id - Delete a color preset
app.delete('/api/color-presets/:id', async (req, res) => {
  try {
    const filePath = path.join(COLOR_PRESETS_DIR, `${req.params.id}.json`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Color preset not found' });
    }

    // Delete file
    await fs.unlink(filePath);

    // Commit deletion to git and push to GitHub
    try {
      execSync(`git add -A`, { cwd: path.dirname(COLOR_PRESETS_DIR) });
      execSync(`git commit -m "Delete color preset: ${req.params.id}"`, { cwd: path.dirname(COLOR_PRESETS_DIR) });
      execSync(`git push origin HEAD`, { cwd: path.dirname(COLOR_PRESETS_DIR) });
      console.log(`✅ Pushed delete color preset: ${req.params.id}`);
    } catch (error) {
      console.warn('Git push failed:', error.message);
    }

    res.json({ success: true, message: 'Color preset deleted' });
  } catch (error) {
    console.error('Delete color preset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Typography Preset API Routes

// GET /api/typography-presets - List all typography presets
app.get('/api/typography-presets', async (req, res) => {
  try {
    await ensureTypographyPresetsDir();
    const files = await fs.readdir(TYPOGRAPHY_PRESETS_DIR);
    const presets = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (f) => {
          const filePath = path.join(TYPOGRAPHY_PRESETS_DIR, f);
          const stat = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          return {
            id: f.replace('.json', ''),
            name: data.name || f.replace('.json', ''),
            fonts: data.fonts,
            savedAt: data.savedAt || stat.mtime.toISOString()
          };
        })
    );
    // Sort by savedAt descending (newest first)
    presets.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    res.json(presets);
  } catch (error) {
    console.error('List typography presets error:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/typography-presets - Save a typography preset
app.post('/api/typography-presets', async (req, res) => {
  try {
    const { name, fonts } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preset name'
      });
    }

    if (!fonts || typeof fonts !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid fonts object'
      });
    }

    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const filePath = path.join(TYPOGRAPHY_PRESETS_DIR, `${id}.json`);

    const presetData = {
      name: name.trim(),
      fonts: fonts,
      savedAt: new Date().toISOString()
    };

    await ensureTypographyPresetsDir();
    await fs.writeFile(filePath, JSON.stringify(presetData, null, 2));

    // Commit to git and push to GitHub
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(TYPOGRAPHY_PRESETS_DIR) });
      execSync(`git commit -m "Save typography preset: ${name}"`, { cwd: path.dirname(TYPOGRAPHY_PRESETS_DIR) });
      execSync(`git push origin HEAD`, { cwd: path.dirname(TYPOGRAPHY_PRESETS_DIR) });
      console.log(`✅ Pushed save typography preset: ${name}`);
    } catch (error) {
      console.warn('Git push failed (might not be in repo):', error.message);
    }

    res.json({ success: true, preset: { id, ...presetData } });
  } catch (error) {
    console.error('Save typography preset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/typography-presets/:id - Load a single typography preset
app.get('/api/typography-presets/:id', async (req, res) => {
  try {
    const filePath = path.join(TYPOGRAPHY_PRESETS_DIR, `${req.params.id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json({
      id: req.params.id,
      name: data.name,
      fonts: data.fonts,
      savedAt: data.savedAt
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Typography preset not found' });
    }
    console.error('Load typography preset error:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/typography-presets/:id - Delete a typography preset
app.delete('/api/typography-presets/:id', async (req, res) => {
  try {
    const filePath = path.join(TYPOGRAPHY_PRESETS_DIR, `${req.params.id}.json`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Typography preset not found' });
    }

    // Delete file
    await fs.unlink(filePath);

    // Commit deletion to git and push to GitHub
    try {
      execSync(`git add -A`, { cwd: path.dirname(TYPOGRAPHY_PRESETS_DIR) });
      execSync(`git commit -m "Delete typography preset: ${req.params.id}"`, { cwd: path.dirname(TYPOGRAPHY_PRESETS_DIR) });
      execSync(`git push origin HEAD`, { cwd: path.dirname(TYPOGRAPHY_PRESETS_DIR) });
      console.log(`✅ Pushed delete typography preset: ${req.params.id}`);
    } catch (error) {
      console.warn('Git push failed:', error.message);
    }

    res.json({ success: true, message: 'Typography preset deleted' });
  } catch (error) {
    console.error('Delete typography preset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Segments API Routes

// GET /api/segments - List all segments
app.get('/api/segments', async (req, res) => {
  try {
    await ensureSegmentsDir();
    const files = await fs.readdir(SEGMENTS_DIR);
    const segments = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (f) => {
          const filePath = path.join(SEGMENTS_DIR, f);
          const stat = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          return {
            id: f.replace('.json', ''),
            name: data.name || f.replace('.json', ''),
            data: data.data,
            savedAt: data.savedAt || stat.mtime.toISOString()
          };
        })
    );
    // Sort by savedAt descending (newest first)
    segments.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    res.json(segments);
  } catch (error) {
    console.error('List segments error:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/segments - Save a segment
app.post('/api/segments', async (req, res) => {
  try {
    const { name, data } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid segment name'
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid segment data'
      });
    }

    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const filePath = path.join(SEGMENTS_DIR, `${id}.json`);

    const segmentData = {
      name: name.trim(),
      data: data,
      savedAt: new Date().toISOString()
    };

    await ensureSegmentsDir();
    await fs.writeFile(filePath, JSON.stringify(segmentData, null, 2));

    // Commit to git and push to GitHub
    try {
      execSync(`git add ${filePath}`, { cwd: path.dirname(SEGMENTS_DIR) });
      execSync(`git commit -m "Save segment: ${name}"`, { cwd: path.dirname(SEGMENTS_DIR) });
      execSync(`git push origin HEAD`, { cwd: path.dirname(SEGMENTS_DIR) });
      console.log(`✅ Pushed save segment: ${name}`);
    } catch (error) {
      console.warn('Git push failed (might not be in repo):', error.message);
    }

    res.json({ success: true, segment: { id, ...segmentData } });
  } catch (error) {
    console.error('Save segment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/segments/:id - Load a single segment
app.get('/api/segments/:id', async (req, res) => {
  try {
    const filePath = path.join(SEGMENTS_DIR, `${req.params.id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json({
      id: req.params.id,
      name: data.name,
      data: data.data,
      savedAt: data.savedAt
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Segment not found' });
    }
    console.error('Load segment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/segments/:id - Delete a segment
app.delete('/api/segments/:id', async (req, res) => {
  try {
    const filePath = path.join(SEGMENTS_DIR, `${req.params.id}.json`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Segment not found' });
    }

    // Delete file
    await fs.unlink(filePath);

    // Commit deletion to git and push to GitHub
    try {
      execSync(`git add -A`, { cwd: path.dirname(SEGMENTS_DIR) });
      execSync(`git commit -m "Delete segment: ${req.params.id}"`, { cwd: path.dirname(SEGMENTS_DIR) });
      execSync(`git push origin HEAD`, { cwd: path.dirname(SEGMENTS_DIR) });
      console.log(`✅ Pushed delete segment: ${req.params.id}`);
    } catch (error) {
      console.warn('Git push failed:', error.message);
    }

    res.json({ success: true, message: 'Segment deleted' });
  } catch (error) {
    console.error('Delete segment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// Start server
Promise.all([
  ensureTemplatesDir(),
  ensureColorPresetsDir(),
  ensureTypographyPresetsDir(),
  ensureSegmentsDir()
]).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Pagebuilder API server running on http://localhost:${PORT}`);
  });
});
