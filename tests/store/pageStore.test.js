import { describe, it, expect } from 'vitest';
import { createSegment, createContainer, createContentItem } from '../../src/store/pageTypes';
import { createEmptyPage } from '../../src/store/pageTypes';

// We import the helpers under test once they are exported (Task 2 makes them exported).
// For now write the tests so they fail with "not a function".
import { deepCloneElement, duplicateElementInPage } from '../../src/store/pageStore.jsx';

describe('deepCloneElement', () => {
  it('gives the clone a different id than the original', () => {
    const segment = createSegment('Hero');
    const clone = deepCloneElement(segment);
    expect(clone.id).not.toBe(segment.id);
  });

  it('preserves all non-id fields', () => {
    const segment = createSegment('Hero');
    const clone = deepCloneElement(segment);
    expect(clone.name).toBe('Hero');
    expect(clone.type).toBe('segment');
  });

  it('recursively re-ids children', () => {
    const container = createContainer();
    const content = createContentItem('text');
    container.children = [content];
    const clone = deepCloneElement(container);
    expect(clone.children[0].id).not.toBe(content.id);
  });

  it('handles leaf nodes (no children property)', () => {
    const content = createContentItem('text');
    const clone = deepCloneElement(content);
    expect(clone.id).not.toBe(content.id);
    expect(clone.children).toBeUndefined();
  });
});

describe('duplicateElementInPage', () => {
  it('inserts a clone of a segment immediately after the original', () => {
    const page = createEmptyPage();
    const seg = createSegment('First');
    page.root.push(seg);
    const { page: newPage, cloneId } = duplicateElementInPage(page, seg.id);
    expect(newPage.root.length).toBe(2);
    expect(newPage.root[0].id).toBe(seg.id);
    expect(newPage.root[1].id).toBe(cloneId);
    expect(newPage.root[1].name).toBe('First');
  });

  it('inserts a clone of a container after the original within its segment', () => {
    const page = createEmptyPage();
    const seg = createSegment('S');
    const cont = createContainer();
    seg.children = [cont];
    page.root.push(seg);
    const { page: newPage, cloneId } = duplicateElementInPage(page, cont.id);
    expect(newPage.root[0].children.length).toBe(2);
    expect(newPage.root[0].children[0].id).toBe(cont.id);
    expect(newPage.root[0].children[1].id).toBe(cloneId);
  });

  it('inserts a clone of a content item after the original', () => {
    const page = createEmptyPage();
    const seg = createSegment('S');
    const item = createContentItem('text');
    seg.children = [item];
    page.root.push(seg);
    const { page: newPage, cloneId } = duplicateElementInPage(page, item.id);
    expect(newPage.root[0].children.length).toBe(2);
    expect(newPage.root[0].children[1].id).toBe(cloneId);
  });

  it('does not mutate the original page object', () => {
    const page = createEmptyPage();
    const seg = createSegment('S');
    page.root.push(seg);
    const originalRoot = page.root;
    duplicateElementInPage(page, seg.id);
    expect(page.root).toBe(originalRoot); // same reference = not mutated
  });
});
