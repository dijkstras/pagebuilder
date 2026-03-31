import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { TreeNode } from './TreeNode';
import { createSegment, createContainer, createContentItem, CONTENT_TYPES } from '../../store/pageTypes';
import { THEME } from '../../utils/constants';

export function StructureTree() {
  const { state, dispatch } = usePageStore();

  const handleAddSegment = () => {
    dispatch(pageActions.addSegment('New Segment'));
  };

  const selectedElement = findElement(state.page, state.selectedElementId);

  const canAddContainer = selectedElement && (selectedElement.type === 'segment' || selectedElement.type === 'container');
  const canAddContent = selectedElement && (selectedElement.type === 'segment' || selectedElement.type === 'container');

  const handleAddContainer = () => {
    if (canAddContainer) {
      dispatch(pageActions.updateElement(selectedElement.id, {
        children: [...(selectedElement.children || []), createContainer()]
      }));
    }
  };

  const handleAddContent = (type) => {
    if (canAddContent) {
      const newContent = createContentItem(type);
      dispatch(pageActions.updateElement(selectedElement.id, {
        children: [...(selectedElement.children || []), newContent]
      }));
    }
  };

  return (
    <div style={{
      width: '300px',
      height: '100vh',
      backgroundColor: THEME.surface,
      borderRight: `1px solid ${THEME.border}`,
      overflow: 'auto',
      padding: '16px',
      color: THEME.text
    }}>
      <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Page Structure</h2>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleAddSegment}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: THEME.accent,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          + Add Segment
        </button>
      </div>

      {selectedElement && (
        <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: `1px solid ${THEME.border}` }}>
          {canAddContainer && (
            <button
              onClick={handleAddContainer}
              style={{
                width: '100%',
                padding: '6px',
                marginBottom: '6px',
                backgroundColor: THEME.background,
                color: THEME.accent,
                border: `1px solid ${THEME.accent}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              + Add Container
            </button>
          )}

          {canAddContent && (
            <div>
              {Object.values(CONTENT_TYPES).map(type => (
                <button
                  key={type}
                  onClick={() => handleAddContent(type)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    marginBottom: '4px',
                    backgroundColor: THEME.background,
                    color: THEME.textMuted,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textTransform: 'capitalize'
                  }}
                >
                  + {type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        {state.page.root.map(segment => (
          <TreeNode key={segment.id} element={segment} />
        ))}
      </div>
    </div>
  );
}

function findElement(page, elementId) {
  const search = (element) => {
    if (element.id === elementId) return element;
    if (element.children) {
      for (const child of element.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };

  for (const segment of page.root) {
    const found = search(segment);
    if (found) return found;
  }
  return null;
}
