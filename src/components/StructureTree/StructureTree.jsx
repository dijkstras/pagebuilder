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

  const isPageSelected = !state.selectedElementId;

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

      {/* Page Root */}
      <div
        onClick={() => dispatch(pageActions.deselectElement())}
        style={{
          padding: '8px 4px',
          cursor: 'pointer',
          backgroundColor: isPageSelected ? '#3b82f6' : 'transparent',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
          marginBottom: '8px',
          fontWeight: 500,
          border: `2px solid ${isPageSelected ? '#3b82f6' : 'transparent'}`
        }}
      >
        <span style={{ fontSize: '14px' }}>📄 Page: {state.page.title}</span>
      </div>

      {/* Add buttons when page is selected */}
      {isPageSelected && (
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
          <button
            onClick={handleAddSegment}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 500,
              textAlign: 'left'
            }}
          >
            + Add Segment
          </button>
        </div>
      )}

      {/* Conditional Action Buttons */}
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

      {/* Segments */}
      <div style={{ marginTop: '8px' }}>
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
