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

  it('should render slots within Tailwind grid', () => {
    const page = createEmptyPage();
    const segment = createSegment('Test', '50-50');
    page.root.push(segment);
    const html = generateHTML(page);
    expect(html).toContain('grid grid-cols-12');
    expect(html).toContain('col-span-12');
    expect(html).toContain('md:col-span-6');
  });

  it('should include Tailwind CDN for responsive layout', () => {
    const page = createEmptyPage();
    const html = generateHTML(page);
    expect(html).toContain('cdn.tailwindcss.com');
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

  it('generates import for single font family', () => {
    const fonts = {
      heading1: { family: 'Inter', size: 48, weight: 700 },
      heading2: { family: 'Inter', size: 32, weight: 600 },
      body: { family: 'Inter', size: 16, weight: 400 },
      label: { family: 'Inter', size: 12, weight: 500 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toContain('fonts.googleapis.com/css2');
    expect(result).toContain('Inter');
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

  it('deduplicates same font family', () => {
    const fonts = {
      heading1: { family: 'Roboto', size: 48, weight: 700 },
      body: { family: 'Roboto', size: 16, weight: 700 }
    };
    const result = generateGoogleFontsImport(fonts);
    // Should only have one Roboto family entry, not two
    const matches = result.match(/family=Roboto/g);
    expect(matches.length).toBe(1);
  });

  it('returns CSS @import statement format', () => {
    const fonts = {
      body: { family: 'Inter', size: 16, weight: 400 }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toMatch(/^@import url\(.*\);$/);
  });

  it('includes fonts regardless of weight specification', () => {
    const fonts = {
      heading1: { family: 'Roboto' }, // no weight
      body: { family: 'Inter', weight: 400 }
    };
    const result = generateGoogleFontsImport(fonts);
    // Both fonts should be included (no weight specs in URL)
    expect(result).toContain('Inter');
    expect(result).toContain('Roboto');
  });

  it('handles special characters in font names', () => {
    const fonts = {
      heading1: { family: 'Font & Co.', weight: 700 }
    };
    const result = generateGoogleFontsImport(fonts);
    // Should properly encode the ampersand in the font name
    expect(result).toContain('%26'); // & encoded as %26
    expect(result).toContain('Font+%26+Co.'); // Full font name properly encoded
  });

  it('handles font names with multiple spaces', () => {
    const fonts = {
      heading1: { family: 'Playfair   Display', weight: 700 } // multiple spaces
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toContain('Playfair'); // Should contain the font name
    expect(result).toContain('Display');
  });

  it('includes fonts even when no weights specified', () => {
    const fonts = {
      heading1: { family: 'Roboto' },
      body: { family: 'Inter' }
    };
    const result = generateGoogleFontsImport(fonts);
    expect(result).toContain('Roboto');
    expect(result).toContain('Inter');
  });
});
