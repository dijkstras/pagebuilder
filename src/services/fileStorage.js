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
