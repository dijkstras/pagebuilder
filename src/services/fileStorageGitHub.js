// src/services/fileStorageGitHub.js

/**
 * GitHub API storage implementation for production (Netlify).
 * Uses Netlify Functions to make GitHub API calls on the server side.
 */

import { createEmptyPage } from '../store/pageTypes.js';

const API_BASE = '/.netlify/functions/api';

export const fileStorageGitHub = {
  async savePage(pageName, pageData) {
    const response = await fetch(`${API_BASE}/api/pages/${pageName}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pageData })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to save');
    return result;
  },

  async loadPage(pageName) {
    const response = await fetch(`${API_BASE}/api/pages/${pageName}`);
    if (response.status === 404) return null;
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to load');
    return result;
  },

  async listPages() {
    const response = await fetch(`${API_BASE}/api/pages`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to list pages');
    return result;
  },

  async createNewPage(pageName) {
    const response = await fetch(`${API_BASE}/api/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: pageName })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create page');
    return result.page;
  },

  async deletePage(pageName) {
    const response = await fetch(`${API_BASE}/api/pages/${pageName}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to delete');
    return result;
  },

  async duplicatePage(pageName, newName) {
    const response = await fetch(`${API_BASE}/api/pages/${pageName}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to duplicate');
    return result;
  },

  async listSegments() {
    const response = await fetch(`${API_BASE}/api/segments`);
    if (response.status === 404) return [];
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to list segments');
    return result;
  },

  async saveSegment(name, data) {
    const response = await fetch(`${API_BASE}/api/segments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to save segment');
    return result;
  },

  async loadSegment(id) {
    const response = await fetch(`${API_BASE}/api/segments/${id}`);
    if (response.status === 404) return null;
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to load segment');
    return result;
  },

  async deleteSegment(id) {
    const response = await fetch(`${API_BASE}/api/segments/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to delete segment');
    return result;
  }
};
