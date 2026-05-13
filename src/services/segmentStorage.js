// src/services/segmentStorage.js

import { storage } from './fileStorage.js';

export const segmentStorage = {
  /**
   * Get all saved segments
   * @returns {Promise<Array>} Array of saved segment objects with id, name, data, and savedAt
   */
  async getAll() {
    try {
      const segments = await storage.listSegments();
      return segments;
    } catch (error) {
      console.error('Error reading saved segments:', error);
      return [];
    }
  },

  /**
   * Save a segment
   * @param {string} name - Display name for the segment
   * @param {object} segmentData - The segment data to save
   * @returns {Promise<object>} The saved segment with generated id
   */
  async save(name, segmentData) {
    try {
      const result = await storage.saveSegment(name, segmentData);
      return result.segment;
    } catch (error) {
      console.error('Error saving segment:', error);
      throw new Error('Failed to save segment');
    }
  },

  /**
   * Delete a saved segment
   * @param {string} id - The segment id to delete
   */
  async delete(id) {
    try {
      await storage.deleteSegment(id);
    } catch (error) {
      console.error('Error deleting segment:', error);
      throw new Error('Failed to delete segment');
    }
  },

  /**
   * Get a single saved segment by id
   * @param {string} id - The segment id
   * @returns {Promise<object|null>} The segment or null if not found
   */
  async getById(id) {
    try {
      const segment = await storage.loadSegment(id);
      return segment;
    } catch (error) {
      console.error('Error loading segment:', error);
      return null;
    }
  },

  /**
   * Update a saved segment
   * @param {string} id - The segment id
   * @param {object} updates - Object with name and/or data to update
   */
  async update(id, updates) {
    try {
      // For update, we delete the old one and save as new
      // This is simpler than implementing update in the API
      const existing = await this.getById(id);
      if (!existing) throw new Error('Segment not found');
      
      const { name, data } = updates;
      const result = await storage.saveSegment(name || existing.name, data || existing.data);
      await storage.deleteSegment(id);
      return result.segment;
    } catch (error) {
      console.error('Error updating segment:', error);
      throw new Error('Failed to update segment');
    }
  }
};

export default segmentStorage;
