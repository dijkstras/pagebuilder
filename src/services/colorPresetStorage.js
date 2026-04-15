// src/services/colorPresetStorage.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const colorPresetStorage = {
  /**
   * Get all saved color presets
   * @returns {Promise<Array>} Array of saved preset objects with id, name, colors, and savedAt
   */
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/api/color-presets`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error reading saved color presets:', error);
      return [];
    }
  },

  /**
   * Save a color preset
   * @param {string} name - Display name for the preset
   * @param {object} colors - The colors object to save
   * @returns {Promise<object>} The saved preset with generated id
   */
  async save(name, colors) {
    try {
      const response = await fetch(`${API_URL}/api/color-presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, colors })
      });
      const result = await handleResponse(response);
      return result.preset;
    } catch (error) {
      console.error('Error saving color preset:', error);
      throw new Error('Failed to save color preset');
    }
  },

  /**
   * Delete a saved color preset
   * @param {string} id - The preset id to delete
   */
  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/api/color-presets/${id}`, {
        method: 'DELETE'
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error deleting color preset:', error);
      throw new Error('Failed to delete color preset');
    }
  },

  /**
   * Get a single saved preset by id
   * @param {string} id - The preset id
   * @returns {Promise<object|null>} The preset or null if not found
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/api/color-presets/${id}`);
      if (response.status === 404) return null;
      return handleResponse(response);
    } catch (error) {
      console.error('Error loading color preset:', error);
      return null;
    }
  }
};

export default colorPresetStorage;
