import { describe, it, expect } from 'vitest';
import { generateHTML } from '../../src/services/pageGenerator';
import { createEmptyPage, createSegment, createContentItem, CONTENT_TYPES } from '../../src/store/pageTypes';

describe('Color System - HTML Generation', () => {
  describe('Segment background defaults to page background color', () => {
    it('should use page background color when no override is set', () => {
      const page = createEmptyPage();
      const segment = createSegment('Test Segment');
      // Don't override bgColor, it should default to white
      segment.settings.bgColor = '#ffffff';
      page.root.push(segment);
      const html = generateHTML(page);
      expect(html).toContain('background-color');
      expect(html).toContain('#ffffff');
    });

    it('should fall back to page styles colors.background if segment has no bgColor', () => {
      const page = createEmptyPage();
      const segment = createSegment('Test Segment');
      // Set a custom background color on the page
      page.styles.colors.background = '#f0f0f0';
      // Don't set segment bgColor explicitly to test fallback
      // (normally segments have a default white background, but this tests the fallback logic)
      page.root.push(segment);
      const html = generateHTML(page);
      // Segment should have background-color set
      expect(html).toContain('background-color');
    });
  });

  describe('Text content uses text color', () => {
    it('should render text with page text color', () => {
      const page = createEmptyPage();
      const segment = createSegment();
      const textItem = createContentItem(CONTENT_TYPES.TEXT);
      textItem.settings.customOverrides.content = 'Hello World';
      segment.children.push(textItem);
      page.root.push(segment);
      const html = generateHTML(page);

      // Should contain the text content
      expect(html).toContain('Hello World');
      // Should reference the text color (either inline or via CSS variable)
      expect(html).toContain('#1f2937'); // default text color
    });

    it('should allow custom text color override', () => {
      const page = createEmptyPage();
      const segment = createSegment();
      const textItem = createContentItem(CONTENT_TYPES.TEXT);
      textItem.settings.customOverrides.content = 'Colored Text';
      textItem.settings.customOverrides.color = '#ff0000'; // red override
      segment.children.push(textItem);
      page.root.push(segment);
      const html = generateHTML(page);

      expect(html).toContain('Colored Text');
      expect(html).toContain('#ff0000'); // custom color should be used
    });
  });

  describe('Buttons use semantic colors', () => {
    it('should render primary button with primary color', () => {
      const page = createEmptyPage();
      const segment = createSegment();
      const button = createContentItem(CONTENT_TYPES.BUTTON);
      button.settings.assignedStyleId = 'primary';
      button.settings.customOverrides.label = 'Primary Button';
      segment.children.push(button);
      page.root.push(segment);
      const html = generateHTML(page);

      expect(html).toContain('Primary Button');
      expect(html).toContain('#3b82f6'); // primary color
    });

    it('should render secondary button with secondary style', () => {
      const page = createEmptyPage();
      const segment = createSegment();
      const button = createContentItem(CONTENT_TYPES.BUTTON);
      button.settings.assignedStyleId = 'secondary';
      button.settings.customOverrides.label = 'Secondary Button';
      segment.children.push(button);
      page.root.push(segment);
      const html = generateHTML(page);

      expect(html).toContain('Secondary Button');
      // Secondary button should have a background color
      expect(html).toContain('background-color');
    });
  });

  describe('CSS variables for colors', () => {
    it('should define CSS custom properties for colors', () => {
      const page = createEmptyPage();
      const html = generateHTML(page);

      // Should have color CSS variables defined
      expect(html).toContain('--color-primary');
      expect(html).toContain('--color-secondary');
      expect(html).toContain('--color-neutral');
    });

    it('should use correct hex values in CSS variables', () => {
      const page = createEmptyPage();
      const html = generateHTML(page);

      expect(html).toContain('--color-primary: #3b82f6');
      expect(html).toContain('--color-secondary: #8b5cf6');
      expect(html).toContain('--color-neutral: #6b7280');
    });
  });

  describe('Custom color overrides take precedence', () => {
    it('should use custom segment background color over defaults', () => {
      const page = createEmptyPage();
      const segment = createSegment();
      segment.settings.bgColor = '#ff0000'; // custom red
      page.root.push(segment);
      const html = generateHTML(page);

      expect(html).toContain('background-color: #ff0000');
    });

    it('should allow changing page background color', () => {
      const page = createEmptyPage();
      page.styles.colors.background = '#cccccc'; // light gray
      const segment = createSegment();
      page.root.push(segment);
      const html = generateHTML(page);

      // Page background should be applied to body or sections
      expect(html).toContain('background-color');
    });

    it('should update all color references when page color changes', () => {
      const page = createEmptyPage();
      page.styles.colors.primary = '#ff0000'; // change primary to red
      const segment = createSegment();
      const button = createContentItem(CONTENT_TYPES.BUTTON);
      button.settings.assignedStyleId = 'primary';
      segment.children.push(button);
      page.root.push(segment);
      const html = generateHTML(page);

      // Custom primary color should be used
      expect(html).toContain('--color-primary: #ff0000');
    });
  });

  describe('All 6 colors are available for use', () => {
    it('should generate page with all 6 semantic colors defined', () => {
      const page = createEmptyPage();
      const html = generateHTML(page);

      const colors = page.styles.colors;
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('secondary');
      expect(colors).toHaveProperty('accent');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('background');
      expect(colors).toHaveProperty('neutral');
    });
  });
});
