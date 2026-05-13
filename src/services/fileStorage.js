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
    // Check if we're not on localhost/127.0.0.1
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '');

    if (!isLocalhost) {
      const { fileStorageGitHub } = await import('./fileStorageGitHub.js');
      cachedImpl = fileStorageGitHub;
      return fileStorageGitHub;
    }

    // In local dev, use Express backend
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
  },

  /**
   * Delete a page from storage
   * @param {string} pageName - Name of page to delete
   * @returns {Promise<object>} Success response
   * @throws {Error} If deletion fails
   */
  async deletePage(pageName) {
    const impl = await getStorageImplementation();
    return impl.deletePage(pageName);
  },

  /**
   * Duplicate an existing page
   * @param {string} pageName - Name of page to duplicate
   * @param {string} newName - Name for the duplicated page
   * @returns {Promise<object>} New page object
   * @throws {Error} If duplication fails
   */
  async duplicatePage(pageName, newName) {
    const impl = await getStorageImplementation();
    return impl.duplicatePage(pageName, newName);
  },

  /**
   * List all available segments in storage
   * @returns {Promise<Array>} Array of segment objects
   * @throws {Error} If list operation fails
   */
  async listSegments() {
    const impl = await getStorageImplementation();
    return impl.listSegments();
  },

  /**
   * Save a segment to storage and commit to GitHub
   * @param {string} name - Name of segment
   * @param {object} data - Segment data
   * @returns {Promise<object>} Object with success and segment info
   * @throws {Error} If save operation fails
   */
  async saveSegment(name, data) {
    const impl = await getStorageImplementation();
    return impl.saveSegment(name, data);
  },

  /**
   * Load a single segment from storage
   * @param {string} id - ID of segment to load
   * @returns {Promise<object|null>} Segment object or null if not found
   * @throws {Error} If load operation fails
   */
  async loadSegment(id) {
    const impl = await getStorageImplementation();
    return impl.loadSegment(id);
  },

  /**
   * Delete a segment from storage
   * @param {string} id - ID of segment to delete
   * @returns {Promise<object>} Success response
   * @throws {Error} If deletion fails
   */
  async deleteSegment(id) {
    const impl = await getStorageImplementation();
    return impl.deleteSegment(id);
  }
};

export default storage;
