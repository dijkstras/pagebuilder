import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPE_LABELS } from '../../utils/constants';
import { createContainer, createContentItem, CONTENT_TYPES } from '../../store/pageTypes';

export function TreeNode({ element, level = 0 }) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
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

  const handleDuplicate = (e) => {
    e.stopPropagation();
    dispatch(pageActions.duplicateElement(element.id, element.type));
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
      card: '🃏',
      video: '▶️'
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

        {/* Add dropdown button - always visible if can add */}
        {(canAddContainer || canAddContent) && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(!showAddMenu);
              }}
              style={{
                background: '#3b82f6',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 6px',
                fontWeight: 'bold',
                lineHeight: '1',
                borderRadius: '3px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Add child element"
            >
              +
            </button>

            {/* Dropdown menu */}
            {showAddMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  minWidth: '120px',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                {canAddContainer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddContainer(e);
                      setShowAddMenu(false);
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
                    📋 Container
                  </button>
                )}
                {canAddContent && (
                  <>
                    {Object.values(CONTENT_TYPES).map((type, idx) => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddContent(type)(e);
                          setShowAddMenu(false);
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
                  </>
                )}
              </div>
            )}
          </div>
        )}

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
