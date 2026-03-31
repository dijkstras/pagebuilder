// src/services/fileStorageGitHub.js

/**
 * GitHub API storage implementation for production (Netlify).
 * Uses GitHub API to read/write files and create commits.
 * Env vars: GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH
 */

import { Octokit } from 'octokit';

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
