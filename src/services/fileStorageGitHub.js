// src/services/fileStorageGitHub.js

/**
 * GitHub API storage implementation for production (Netlify).
 * Uses GitHub API to read/write files and create commits.
 * Env vars: GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH
 */

import { Octokit } from 'octokit';
import { createEmptyPage } from '../store/pageTypes.js';

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

      // Get commit info for last modified timestamps
      const pages = data
        .filter(item => item.name.endsWith('.json'))
        .map(item => ({
          name: item.name.replace('.json', ''),
          path: item.path,
          id: item.name.replace('.json', '')
        }));

      // Fetch commit history for each file to get lastModified
      const pagesWithTimestamps = await Promise.all(
        pages.map(async (page) => {
          try {
            const { data: commits } = await octokit.rest.repos.listCommits({
              owner, repo, path: page.path, branch, per_page: 1
            });
            const lastModified = commits[0]?.commit?.author?.date || new Date().toISOString();
            return { ...page, lastModified };
          } catch (e) {
            return { ...page, lastModified: new Date().toISOString() };
          }
        })
      );

      // Sort by lastModified descending
      pagesWithTimestamps.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      return pagesWithTimestamps;
    } catch (error) {
      if (error.status === 404) return [];
      throw new Error(`Failed to list pages: ${error.message}`);
    }
  },

  async createNewPage(pageName) {
    return {
      id: `page-${Date.now()}`,
      title: pageName,
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
          label: { family: 'Inter', size: 12, weight: 500 },
          button: { family: 'Inter', weight: 500 }
        },
        buttonStyles: [
          { id: 'primary', label: 'Primary', bgColor: '#3b82f6', textColor: '#ffffff', padding: 12, radius: 6, bgType: 'solid', bgGradient: null, fontSize: 14 },
          { id: 'secondary', label: 'Secondary', bgColor: '#e5e7eb', textColor: '#1f2937', padding: 12, radius: 6, bgType: 'solid', bgGradient: null, fontSize: 14 },
          { id: 'tertiary', label: 'Tertiary', bgColor: 'transparent', textColor: '#3b82f6', padding: 12, radius: 6, bgType: 'solid', bgGradient: null, fontSize: 14 }
        ],
        shapes: { borderRadius: 6 },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
        bgColor: '#f9fafb'
      }
    };
  },

  async deletePage(pageName) {
    validateEnv();

    const path = `templates/${pageName}.json`;

    try {
      // Get current file SHA
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path, ref: branch
      });

      // Delete file
      await octokit.rest.repos.deleteFile({
        owner, repo, path,
        message: `Delete page: ${pageName}`,
        sha: data.sha,
        branch
      });

      return { success: true, message: 'Page deleted' };
    } catch (error) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  },

  async duplicatePage(pageName, newName) {
    validateEnv();

    const oldPath = `templates/${pageName}.json`;
    const newPath = `templates/${newName}.json`;

    try {
      // Get source file
      const { data: sourceData } = await octokit.rest.repos.getContent({
        owner, repo, path: oldPath, ref: branch
      });

      const content = Buffer.from(sourceData.content, 'base64').toString('utf-8');
      const pageData = JSON.parse(content);
      pageData.title = newName;
      pageData.id = `page-${Date.now()}`;

      // Create new file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner, repo, path: newPath,
        message: `Duplicate page: ${pageName} -> ${newName}`,
        content: Buffer.from(JSON.stringify(pageData, null, 2)).toString('base64'),
        branch
      });

      return { success: true, page: pageData };
    } catch (error) {
      throw new Error(`Failed to duplicate: ${error.message}`);
    }
  }
};
