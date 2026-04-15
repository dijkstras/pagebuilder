// src/services/typographyPresetStorage.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const typographyPresetStorage = {
  /**
   * Get all saved typography presets
   * @returns {Promise<Array>} Array of saved preset objects with id, name, fonts, and savedAt
   */
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/api/typography-presets`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error reading saved typography presets:', error);
      return [];
    }
  },

  /**
   * Save a typography preset
   * @param {string} name - Display name for the preset
   * @param {object} fonts - The fonts object to save
   * @returns {Promise<object>} The saved preset with generated id
   */
  async save(name, fonts) {
    try {
      const response = await fetch(`${API_URL}/api/typography-presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fonts })
      });
      const result = await handleResponse(response);
      return result.preset;
    } catch (error) {
      console.error('Error saving typography preset:', error);
      throw new Error('Failed to save typography preset');
    }
  },

  /**
   * Delete a saved typography preset
   * @param {string} id - The preset id to delete
   */
  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/api/typography-presets/${id}`, {
        method: 'DELETE'
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error deleting typography preset:', error);
      throw new Error('Failed to delete typography preset');
    }
  },

  /**
   * Get a single saved preset by id
   * @param {string} id - The preset id
   * @returns {Promise<object|null>} The preset or null if not found
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/api/typography-presets/${id}`);
      if (response.status === 404) return null;
      return handleResponse(response);
    } catch (error) {
      console.error('Error loading typography preset:', error);
      return null;
    }
  }
};

export default typographyPresetStorage;
