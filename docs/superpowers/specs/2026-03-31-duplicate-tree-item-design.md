# Duplicate Item in Page Structure

**Date:** 2026-03-31
**Scope:** Segments, Containers, Content items (not the page root)

## Summary

Add a "Duplicate" button to every non-page node in the Structure Tree. Clicking it deep-clones the element (including all descendants) with fresh IDs and inserts the clone immediately after the original.

## Architecture

### Deep Clone Helper

A recursive `deepCloneElement(element)` function lives in `pageStore.jsx` (co-located with the other tree-mutation helpers like `deleteElement`).

It creates a new ID for every node in the subtree using `${element.type}-${Date.now()}-${Math.random().toString(36).slice(2,7)}` to avoid collisions when duplicating multiple items rapidly.

```js
function deepCloneElement(element) {
  const newId = `${element.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    ...element,
    id: newId,
    children: element.children?.map(deepCloneElement)
  }
}
```

### Reducer Action

Add `DUPLICATE_ELEMENT` case to the reducer in `pageStore.jsx`.

Logic:
- Find the element by ID in the tree (segments live directly in `page.root`; containers and content items live in `element.children` at various depths).
- Deep-clone it with `deepCloneElement`.
- Insert the clone immediately after the original in the same parent array.
- Select the newly created clone.

```js
case 'DUPLICATE_ELEMENT': {
  const clone = // found via recursive search
  // insert after original in parent array
  // select clone
}
```

### pageActions

Add `duplicateElement(id)` to the `pageActions` object:
```js
duplicateElement: (id) => ({ type: 'DUPLICATE_ELEMENT', payload: { id } })
```

### UI — TreeNode.jsx

Add a duplicate button to the inline action bar, between the `+` and `✕` buttons. Use `⧉` as the icon (Unicode "squared overlapping windows"), styled consistently with existing buttons (same size, neutral color, hover highlight). The button is hidden until the row is hovered, matching the existing pattern for `+` and `✕`.

No confirmation dialog — duplication is non-destructive and reversible by deleting the clone.

## Files Changed

| File | Change |
|------|--------|
| `src/store/pageStore.jsx` | Add `deepCloneElement` helper, `DUPLICATE_ELEMENT` case, `duplicateElement` action |
| `src/components/StructureTree/TreeNode.jsx` | Add duplicate button and `handleDuplicate` handler |

## Out of Scope

- Duplicating the page itself
- Undo/redo support (not present in the app today)
- Keyboard shortcut for duplicate
