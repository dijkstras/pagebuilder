// src/services/segmentStorage.js

const STORAGE_KEY = 'pagebuilder_saved_segments';

export const segmentStorage = {
  /**
   * Get all saved segments
   * @returns {Array} Array of saved segment objects with id, name, data, and savedAt
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading saved segments:', error);
      return [];
    }
  },

  /**
   * Save a segment
   * @param {string} name - Display name for the segment
   * @param {object} segmentData - The segment data to save
   * @returns {object} The saved segment with generated id
   */
  save(name, segmentData) {
    try {
      const segments = this.getAll();
      const newSegment = {
        id: `saved-segment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        data: JSON.parse(JSON.stringify(segmentData)), // Deep clone
        savedAt: new Date().toISOString()
      };
      segments.push(newSegment);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
      return newSegment;
    } catch (error) {
      console.error('Error saving segment:', error);
      throw new Error('Failed to save segment');
    }
  },

  /**
   * Delete a saved segment
   * @param {string} id - The segment id to delete
   */
  delete(id) {
    try {
      const segments = this.getAll().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
    } catch (error) {
      console.error('Error deleting segment:', error);
      throw new Error('Failed to delete segment');
    }
  },

  /**
   * Get a single saved segment by id
   * @param {string} id - The segment id
   * @returns {object|null} The segment or null if not found
   */
  getById(id) {
    return this.getAll().find(s => s.id === id) || null;
  },

  /**
   * Update a saved segment
   * @param {string} id - The segment id
   * @param {object} updates - Object with name and/or data to update
   */
  update(id, updates) {
    try {
      const segments = this.getAll();
      const index = segments.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Segment not found');
      
      segments[index] = {
        ...segments[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
      return segments[index];
    } catch (error) {
      console.error('Error updating segment:', error);
      throw new Error('Failed to update segment');
    }
  }
};

export default segmentStorage;
