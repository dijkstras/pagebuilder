# Duplicate Tree Item Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Duplicate button to every non-page node in the Structure Tree that deep-clones the element (and all descendants) with fresh IDs and inserts the clone immediately after the original.

**Architecture:** Add a `deepCloneElement` helper and `duplicateElement` pure function to `pageStore.jsx` alongside the existing `deleteElement` helper, wire it up via a new `DUPLICATE_ELEMENT` reducer case and `pageActions.duplicateElement` action creator, then add a `handleDuplicate` handler and `⧉` button to `TreeNode.jsx` between the existing `+` and `✕` buttons.

**Tech Stack:** React 18, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/store/pageStore.jsx` | Add `deepCloneElement` helper (lines 138+), `duplicateElement` helper, `DUPLICATE_ELEMENT` reducer case (after `DELETE_ELEMENT`), `duplicateElement` action creator |
| `src/components/StructureTree/TreeNode.jsx` | Add `handleDuplicate` handler, `⧉` duplicate button between `+` and `✕` |
| `tests/store/pageStore.test.js` | New file: unit tests for `deepCloneElement` and `duplicateElement` |

---

### Task 1: Test the store helpers

**Files:**
- Create: `tests/store/pageStore.test.js`

- [ ] **Step 1: Create the test file**

```js
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
```

- [ ] **Step 2: Run tests to confirm they all fail as expected**

```bash
cd /Users/sjoerddijkstra/conductor/workspaces/Pagebuilder/milan && npx vitest run tests/store/pageStore.test.js 2>&1 | head -40
```

Expected: failures along the lines of `deepCloneElement is not a function` / import errors.

---

### Task 2: Add helpers and reducer case to pageStore.jsx

**Files:**
- Modify: `src/store/pageStore.jsx`

- [ ] **Step 1: Add `deepCloneElement` and `duplicateElementInPage` helpers after line 137 (after `deleteElement`)**

Insert this block between the closing `}` of `deleteElement` (line 137) and the `export function PageProvider` (line 139):

```js
export function deepCloneElement(element) {
  const newId = `${element.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    ...element,
    id: newId,
    children: element.children?.map(deepCloneElement)
  };
}

export function duplicateElementInPage(page, elementId) {
  let cloneId = null;

  const insertAfterInArray = (arr) => {
    const idx = arr.findIndex(item => item.id === elementId);
    if (idx !== -1) {
      const clone = deepCloneElement(arr[idx]);
      cloneId = clone.id;
      const newArr = [...arr];
      newArr.splice(idx + 1, 0, clone);
      return newArr;
    }
    return arr.map(item => ({
      ...item,
      children: item.children ? insertAfterInArray(item.children) : item.children
    }));
  };

  return {
    page: { ...page, root: insertAfterInArray(page.root) },
    cloneId
  };
}
```

- [ ] **Step 2: Add `DUPLICATE_ELEMENT` case to the reducer**

In `pageReducer`, after the `DELETE_ELEMENT` case (lines 53-59), add:

```js
    case 'DUPLICATE_ELEMENT': {
      const { page: newPage, cloneId } = duplicateElementInPage(state.page, action.payload.id);
      return {
        ...state,
        page: newPage,
        selectedElementId: cloneId,
        selectedElementType: action.payload.elementType
      };
    }
```

- [ ] **Step 3: Add `duplicateElement` action creator to `pageActions`**

In the `pageActions` export object (around line 163, after `deleteElement`), add:

```js
  duplicateElement: (id, elementType) => ({ type: 'DUPLICATE_ELEMENT', payload: { id, elementType } }),
```

- [ ] **Step 4: Run the tests**

```bash
cd /Users/sjoerddijkstra/conductor/workspaces/Pagebuilder/milan && npx vitest run tests/store/pageStore.test.js 2>&1
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/sjoerddijkstra/conductor/workspaces/Pagebuilder/milan && git add src/store/pageStore.jsx tests/store/pageStore.test.js && git commit -m "feat: add deepCloneElement and duplicateElement to page store"
```

---

### Task 3: Add Duplicate button to TreeNode

**Files:**
- Modify: `src/components/StructureTree/TreeNode.jsx`

- [ ] **Step 1: Import `duplicateElement` action and add `handleDuplicate` handler**

In `TreeNode.jsx`, the import at line 2 already has `pageActions`. Add `handleDuplicate` after `handleDelete` (after line 21):

```js
  const handleDuplicate = (e) => {
    e.stopPropagation();
    dispatch(pageActions.duplicateElement(element.id, element.type));
  };
```

- [ ] **Step 2: Add the duplicate button between `+` and `✕`**

In the JSX, between the closing `</div>` of the add-menu block (line 201) and the delete `<button>` (line 203), insert:

```jsx
        <button
          onClick={handleDuplicate}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            opacity: 0.7,
            fontSize: '14px',
            padding: '0 2px',
            lineHeight: '1'
          }}
          title="Duplicate"
        >
          ⧉
        </button>
```

- [ ] **Step 3: Run the full test suite to confirm nothing is broken**

```bash
cd /Users/sjoerddijkstra/conductor/workspaces/Pagebuilder/milan && npx vitest run 2>&1
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/sjoerddijkstra/conductor/workspaces/Pagebuilder/milan && git add src/components/StructureTree/TreeNode.jsx && git commit -m "feat: add duplicate button to structure tree nodes"
```
