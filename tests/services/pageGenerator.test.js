import { describe, it, expect } from 'vitest';
import { generateHTML, generateGoogleFontsImport } from '../../src/services/pageGenerator';
import { createEmptyPage, createSegment, createContentItem, CONTENT_TYPES } from '../../src/store/pageTypes';

describe('pageGenerator', () => {
  it('should generate valid HTML for empty page', () => {
    const page = createEmptyPage();
    const html = generateHTML(page);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
  });

  it('should include page title in HTML', () => {
    const page = createEmptyPage();
    page.title = 'Test Page';
    const html = generateHTML(page);
    expect(html).toContain('<title>Test Page</title>');
  });

  it('should render segments', () => {
    const page = createEmptyPage();
    const segment = createSegment('Hero');
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('<section');
    expect(html).toContain(`data-element-id="${segment.id}"`);
  });

  it('should render text content', () => {
    const page = createEmptyPage();
    const segment = createSegment();
    const content = createContentItem(CONTENT_TYPES.TEXT);
    content.settings.customOverrides.content = 'Hello World';
    segment.children.push(content);
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('Hello World');
  });

  it('should apply segment background color', () => {
    const page = createEmptyPage();
    const segment = createSegment();
    segment.settings.bgColor = '#ff0000';
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('background-color');
  });

  it('should render buttons with assigned styles', () => {
    const page = createEmptyPage();
    const segment = createSegment();
    const button = createContentItem(CONTENT_TYPES.BUTTON);
    button.settings.assignedStyleId = 'primary';
    button.settings.customOverrides.label = 'Click Me';
    segment.children.push(button);
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('Click Me');
    expect(html).toContain('#3b82f6'); // primary color
  });

  it('should render images with src attribute', () => {
    const page = createEmptyPage();
    const segment = createSegment();
    const image = createContentItem(CONTENT_TYPES.IMAGE);
    image.settings.customOverrides.src = 'https://example.com/image.jpg';
    segment.children.push(image);
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('https://example.com/image.jpg');
  });

  it('should render nested containers', () => {
    const page = createEmptyPage();
    const segment = createSegment();
    const container = {
      id: 'container-1',
      type: 'container',
      settings: {
        layout: 'grid',
        columns: 2,
        spacing: 16
      },
      children: []
    };
    segment.children.push(container);
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('display: grid');
    expect(html).toContain('grid-template-columns: repeat(2, 1fr)');
  });

  it('should include responsive breakpoints in CSS', () => {
    const page = createEmptyPage();
    const html = generateHTML(page);
    expect(html).toContain('@media (max-width: 320px)');
    expect(html).toContain('@media (max-width: 768px)');
    expect(html).toContain('@media (max-width: 1024px)');
  });

  it('should generate valid HTML structure', () => {
    const page = createEmptyPage();
    page.root.push(createSegment('Hero'));
    const html = generateHTML(page);
    // Basic structure checks
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('<meta name="viewport"');
  });
});

describe('generateGoogleFontsImport', () => {
  it('returns empty string when no fonts provided', () => {
    expect(generateGoogleFontsImport({})).toBe('');
  });

  it('generates import for single font with single weight', () => {
    const fonts = {
      heading1: { family: 'Inter', size: 48, weight: 700 },
      heading2: { family: 'Inter', size: 32, weight: 600 },
      body: { family: 'Inter', size: 16, weight: 400 },
      label: { family: 'Inter', size: 12, weight: 500 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toContain('fonts.googleapis.com/css2');
    expect(result).toContain('Inter');
    expect(result).toContain('wght@400;500;600;700');
    expect(result).toContain('display=swap');
  });

  it('generates import for multiple fonts with correct URL encoding', () => {
    const fonts = {
      heading1: { family: 'Playfair Display', size: 48, weight: 700 },
      body: { family: 'Inter', size: 16, weight: 400 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toContain('Playfair+Display');
    expect(result).toContain('Inter');
    expect(result).toContain('&family=');
    expect(result).toContain('display=swap');
  });

  it('deduplicates weights for same font', () => {
    const fonts = {
      heading1: { family: 'Roboto', size: 48, weight: 700 },
      body: { family: 'Roboto', size: 16, weight: 700 }
    };
    const result = generateGoogleFontsImport(fonts);
    // Should only have one wght@700, not two
    const matches = result.match(/wght@700/g);
    expect(matches.length).toBe(1);
  });

  it('returns CSS @import statement format', () => {
    const fonts = {
      body: { family: 'Inter', size: 16, weight: 400 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toMatch(/^@import url\(.*\);$/);
  });
});
