import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { TreeNode } from './TreeNode';
import { createSegment, createContainer, createContentItem, CONTENT_TYPES } from '../../store/pageTypes';
import { THEME } from '../../utils/constants';

export function StructureTree() {
  const [showPageAddMenu, setShowPageAddMenu] = React.useState(false);
  const { state, dispatch } = usePageStore();

  const handleAddSegment = () => {
    dispatch(pageActions.addSegment('New Segment'));
    setShowPageAddMenu(false);
  };

  const handleAddContentToPage = (type) => {
    const newContent = createContentItem(type);
    dispatch(pageActions.updateElement(state.page.id, {
      root: [...state.page.root, newContent]
    }));
    setShowPageAddMenu(false);
  };

  const selectedElement = findElement(state.page, state.selectedElementId);

  const canAddContainer = selectedElement && (selectedElement.type === 'segment' || selectedElement.type === 'container');
  const canAddContent = selectedElement && (selectedElement.type === 'segment' || selectedElement.type === 'container');

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
          marginBottom: '16px',
          fontWeight: 500,
          border: `2px solid ${isPageSelected ? '#3b82f6' : 'transparent'}`
        }}
      >
        <span style={{ fontSize: '14px' }}>📄 Page: {state.page.title}</span>

        {/* Page add dropdown */}
        {isPageSelected && (
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPageAddMenu(!showPageAddMenu);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 4px',
                fontWeight: 'bold'
              }}
            >
              +
            </button>

            {/* Dropdown menu */}
            {showPageAddMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  minWidth: '140px',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSegment();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    color: '#9ca3af',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #374151',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📦 Segment
                </button>
                {Object.values(CONTENT_TYPES).map((type, idx) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddContentToPage(type);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      color: '#9ca3af',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'left',
                      borderBottom: idx === Object.values(CONTENT_TYPES).length - 1 ? 'none' : '1px solid #374151',
                      transition: 'background-color 0.2s',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


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
