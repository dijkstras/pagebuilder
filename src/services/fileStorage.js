// src/services/fileStorage.js

/**
 * Storage abstraction that detects environment and returns appropriate implementation.
 * Works on both local dev (Express) and Netlify (Functions with GitHub API).
 */

import { fileStorageLocal } from './fileStorageLocal.js';

let cachedImpl = null;

async function getStorageImplementation() {
  if (cachedImpl) return cachedImpl;

  try {
    // In production (Netlify), use GitHub API
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.env.NETLIFY === 'true') {
      const { fileStorageGitHub } = await import('./fileStorageGitHub.js');
      cachedImpl = fileStorageGitHub;
      return fileStorageGitHub;
    }

    // In browser or local dev, use Express backend
    cachedImpl = fileStorageLocal;
    return fileStorageLocal;
  } catch (error) {
    throw new Error(`Failed to load storage implementation: ${error.message}`);
  }
}

export const storage = {
  /**
   * Save a page to storage and commit to GitHub
   * @param {string} pageName - Name of page (e.g., "homepage")
   * @param {object} pageData - Full page object with all settings
   * @returns {Promise<object>} Object with success, commitHash (optional), and message
   * @throws {Error} If save operation fails
   */
  async savePage(pageName, pageData) {
    const impl = await getStorageImplementation();
    return impl.savePage(pageName, pageData);
  },

  /**
   * Load a single page from storage
   * @param {string} pageName - Name of page to load
   * @returns {Promise<object|null>} Page object or null if not found
   * @throws {Error} If load operation fails
   */
  async loadPage(pageName) {
    const impl = await getStorageImplementation();
    return impl.loadPage(pageName);
  },

  /**
   * List all available pages in storage
   * @returns {Promise<Array>} Array of {name, path} objects
   * @throws {Error} If list operation fails
   */
  async listPages() {
    const impl = await getStorageImplementation();
    return impl.listPages();
  },

  /**
   * Create a new blank page
   * @param {string} pageName - Name for new page
   * @returns {Promise<object>} Blank page object
   * @throws {Error} If creation fails
   */
  async createNewPage(pageName) {
    const impl = await getStorageImplementation();
    return impl.createNewPage(pageName);
  }
};

export default storage;
