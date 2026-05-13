// src/services/fileStorageLocal.js

/**
 * Local development storage implementation.
 * Calls Express backend which handles file I/O and git commits.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const fileStorageLocal = {
  async savePage(pageName, pageData) {
    const response = await fetch(`${API_URL}/api/pages/${pageName}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pageData })
    });
    return handleResponse(response);
  },

  async loadPage(pageName) {
    try {
      const response = await fetch(`${API_URL}/api/pages/${pageName}`);
      if (response.status === 404) return null;
      return handleResponse(response);
    } catch (error) {
      console.error('Error loading page:', error);
      return null;
    }
  },

  async listPages() {
    const response = await fetch(`${API_URL}/api/pages`);
    return handleResponse(response);
  },

  async createNewPage(pageName) {
    const response = await fetch(`${API_URL}/api/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: pageName })
    });
    return handleResponse(response);
  },

  async deletePage(pageName) {
    const response = await fetch(`${API_URL}/api/pages/${pageName}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  async duplicatePage(pageName, newName) {
    const response = await fetch(`${API_URL}/api/pages/${pageName}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName })
    });
    return handleResponse(response);
  },

  async listSegments() {
    const response = await fetch(`${API_URL}/api/segments`);
    return handleResponse(response);
  },

  async saveSegment(name, data) {
    const response = await fetch(`${API_URL}/api/segments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data })
    });
    return handleResponse(response);
  },

  async loadSegment(id) {
    try {
      const response = await fetch(`${API_URL}/api/segments/${id}`);
      if (response.status === 404) return null;
      return handleResponse(response);
    } catch (error) {
      console.error('Error loading segment:', error);
      return null;
    }
  },

  async deleteSegment(id) {
    const response = await fetch(`${API_URL}/api/segments/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};
