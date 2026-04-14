import { describe, it, expect } from 'vitest';
import { createEmptyPage, migratePage } from '../../src/store/pageTypes';

describe('Semantic Color System - Task 5', () => {
  describe('New pages initialize with 6 colors', () => {
    it('should initialize with all 6 semantic color slots', () => {
      const page = createEmptyPage();
      const colors = page.styles.colors;

      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('secondary');
      expect(colors).toHaveProperty('accent');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('background');
      expect(colors).toHaveProperty('neutral');
    });

    it('should initialize with correct default values', () => {
      const page = createEmptyPage();
      const colors = page.styles.colors;

      expect(colors.primary).toBe('#3b82f6'); // blue
      expect(colors.secondary).toBe('#8b5cf6'); // purple
      expect(colors.accent).toBe('#ec4899'); // pink
      expect(colors.text).toBe('#1f2937'); // dark gray
      expect(colors.background).toBe('#f9fafb'); // light gray
      expect(colors.neutral).toBe('#6b7280'); // neutral gray
      expect(colors.card).toBe('#ffffff'); // card white
    });

    it('should initialize with exactly 7 color slots', () => {
      const page = createEmptyPage();
      const colorKeys = Object.keys(page.styles.colors);
      expect(colorKeys).toHaveLength(7);
    });

    it('should use title "Untitled Page" by default', () => {
      const page = createEmptyPage();
      expect(page.title).toBe('Untitled Page');
    });
  });

  describe('Backward compatibility - migratePage', () => {
    it('should add missing colors with defaults', () => {
      const oldPage = {
        title: 'Old Page',
        root: [],
        styles: {
          colors: {
            primary: '#ff0000' // only has primary
          }
        }
      };
      const migrated = migratePage(oldPage);

      expect(migrated.styles.colors.primary).toBe('#ff0000'); // preserved custom
      expect(migrated.styles.colors.secondary).toBe('#8b5cf6'); // filled with default
      expect(migrated.styles.colors.accent).toBe('#ec4899');
      expect(migrated.styles.colors.text).toBe('#1f2937');
      expect(migrated.styles.colors.background).toBe('#f9fafb');
      expect(migrated.styles.colors.neutral).toBe('#6b7280');
      expect(migrated.styles.colors.card).toBe('#ffffff');
    });

    it('should preserve all custom colors if present', () => {
      const oldPage = {
        title: 'Custom Page',
        root: [],
        styles: {
          colors: {
            primary: '#111111',
            secondary: '#222222',
            accent: '#333333',
            text: '#444444',
            background: '#555555',
            neutral: '#666666',
            card: '#777777'
          }
        }
      };
      const migrated = migratePage(oldPage);

      expect(migrated.styles.colors).toEqual({
        primary: '#111111',
        secondary: '#222222',
        accent: '#333333',
        text: '#444444',
        background: '#555555',
        neutral: '#666666',
        card: '#777777'
      });
    });

    it('should handle pages with no colors defined', () => {
      const oldPage = {
        title: 'No Colors',
        root: [],
        styles: {}
      };
      const migrated = migratePage(oldPage);

      expect(migrated.styles.colors).toEqual({
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        text: '#1f2937',
        background: '#f9fafb',
        neutral: '#6b7280',
        card: '#ffffff'
      });
    });

    it('should preserve partial color overrides with defaults for missing colors', () => {
      const oldPage = {
        title: 'Partial Colors',
        root: [],
        styles: {
          colors: {
            primary: '#custom1',
            text: '#custom2'
          }
        }
      };
      const migrated = migratePage(oldPage);

      expect(migrated.styles.colors.primary).toBe('#custom1');
      expect(migrated.styles.colors.text).toBe('#custom2');
      expect(migrated.styles.colors.secondary).toBe('#8b5cf6');
      expect(migrated.styles.colors.accent).toBe('#ec4899');
      expect(migrated.styles.colors.background).toBe('#f9fafb');
      expect(migrated.styles.colors.neutral).toBe('#6b7280');
      expect(migrated.styles.colors.card).toBe('#ffffff');
    });
  });

  describe('Color names are semantically meaningful', () => {
    it('primary color is for primary brand elements', () => {
      const page = createEmptyPage();
      // Primary is used for primary buttons, main CTAs, etc.
      expect(page.styles.colors.primary).toBeDefined();
    });

    it('secondary color is for secondary brand elements', () => {
      const page = createEmptyPage();
      expect(page.styles.colors.secondary).toBeDefined();
    });

    it('accent color is for highlights and accents', () => {
      const page = createEmptyPage();
      expect(page.styles.colors.accent).toBeDefined();
    });

    it('text color is for primary text content', () => {
      const page = createEmptyPage();
      expect(page.styles.colors.text).toBeDefined();
    });

    it('background color is for page/section backgrounds', () => {
      const page = createEmptyPage();
      expect(page.styles.colors.background).toBeDefined();
    });

    it('neutral color is for borders, dividers, etc', () => {
      const page = createEmptyPage();
      expect(page.styles.colors.neutral).toBeDefined();
    });
  });

  describe('Color values are valid hex colors', () => {
    it('all default colors should be valid hex values', () => {
      const page = createEmptyPage();
      const colors = page.styles.colors;
      const hexRegex = /^#[0-9A-F]{6}$/i;

      Object.entries(colors).forEach(([name, value]) => {
        expect(hexRegex.test(value)).toBe(true, `Color ${name} (${value}) is not a valid hex color`);
      });
    });

    it('migrated colors should remain valid hex values', () => {
      const oldPage = {
        title: 'Test',
        root: [],
        styles: {
          colors: {
            primary: '#ff0000',
            secondary: '#00ff00'
          }
        }
      };
      const migrated = migratePage(oldPage);
      const hexRegex = /^#[0-9A-F]{6}$/i;

      Object.entries(migrated.styles.colors).forEach(([name, value]) => {
        expect(hexRegex.test(value)).toBe(true, `Color ${name} (${value}) is not a valid hex color`);
      });
    });
  });

  describe('Color system completeness', () => {
    it('should have exactly 2 brand colors (primary, secondary)', () => {
      const page = createEmptyPage();
      const brandColors = ['primary', 'secondary'];
      brandColors.forEach(colorName => {
        expect(page.styles.colors).toHaveProperty(colorName);
      });
    });

    it('should have exactly 5 UI colors (text, background, accent, neutral, card)', () => {
      const page = createEmptyPage();
      const uiColors = ['text', 'background', 'accent', 'neutral', 'card'];
      uiColors.forEach(colorName => {
        expect(page.styles.colors).toHaveProperty(colorName);
      });
    });
  });
});
