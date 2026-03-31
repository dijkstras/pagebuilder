import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPE_LABELS } from '../../utils/constants';
import { createContainer, createContentItem, CONTENT_TYPES } from '../../store/pageTypes';

export function TreeNode({ element, level = 0 }) {
  const [isOpen, setIsOpen] = useState(true);
  const { state, dispatch } = usePageStore();

  const isSelected = state.selectedElementId === element.id;
  const hasChildren = element.children && element.children.length > 0;

  const handleSelect = () => {
    dispatch(pageActions.selectElement(element.id, element.type));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch(pageActions.deleteElement(element.id));
  };

  const handleAddContainer = (e) => {
    e.stopPropagation();
    const newContainer = createContainer();
    dispatch(pageActions.updateElement(element.id, {
      children: [...(element.children || []), newContainer]
    }));
  };

  const handleAddContent = (type) => (e) => {
    e.stopPropagation();
    const newContent = createContentItem(type);
    dispatch(pageActions.updateElement(element.id, {
      children: [...(element.children || []), newContent]
    }));
  };

  // Determine what can be added to this element
  const canAddContainer = element.type === 'segment' || element.type === 'container';
  const canAddContent = element.type === 'segment' || element.type === 'container';

  const labelText = element.name || CONTENT_TYPE_LABELS[element.type] || 'Element';

  // Get icon based on element type
  const getIcon = (type) => {
    const icons = {
      segment: '📦',
      container: '📋',
      text: '📝',
      image: '🖼️',
      button: '🔘',
      card: '🃏'
    };
    return icons[type] || '•';
  };

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div
        onClick={handleSelect}
        style={{
          padding: '8px 4px',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#3b82f6' : 'transparent',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
          border: isSelected ? `2px solid #3b82f6` : '2px solid transparent'
        }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '12px'
            }}
          >
            {isOpen ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span style={{ width: '16px' }} />}

        <span style={{ fontSize: '14px' }}>{getIcon(element.type)}</span>
        <span style={{ flex: 1, fontSize: '14px' }}>{labelText}</span>

        <button
          onClick={handleDelete}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            opacity: 0.6,
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Add buttons when selected */}
      {isSelected && (canAddContainer || canAddContent) && (
        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '20px' }}>
          {canAddContainer && (
            <button
              onClick={handleAddContainer}
              style={{
                width: '100%',
                padding: '4px 6px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                textAlign: 'left'
              }}
            >
              + Container
            </button>
          )}
          {canAddContent && (
            <>
              {Object.values(CONTENT_TYPES).map(type => (
                <button
                  key={type}
                  onClick={handleAddContent(type)}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    color: '#9ca3af',
                    border: '1px solid #4b5563',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'left',
                    textTransform: 'capitalize'
                  }}
                >
                  + {type}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {isOpen && hasChildren && (
        <div>
          {element.children.map(child => (
            <TreeNode key={child.id} element={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
