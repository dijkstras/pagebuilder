import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPE_LABELS } from '../../utils/constants';

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

  const labelText = element.name || CONTENT_TYPE_LABELS[element.type] || 'Element';

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
          userSelect: 'none'
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
              padding: '0 4px'
            }}
          >
            {isOpen ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span style={{ width: '16px' }} />}

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
