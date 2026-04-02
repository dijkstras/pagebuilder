import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPE_LABELS } from '../../utils/constants';
import { createContainer, createContentItem, CONTENT_TYPES } from '../../store/pageTypes';

const TYPE_ICONS = {
  container: '⊞',
  text: 'T',
  image: '▣',
  button: '⊡',
  card: '▦',
  video: '▷'
};

function containsElement(children, targetId) {
  if (!children) return false;
  return children.some(child =>
    child.id === targetId || containsElement(child.children, targetId)
  );
}

function AddMenu({ element, onClose }) {
  const { dispatch } = usePageStore();
  const canAddContainer = element.type === 'segment' || element.type === 'container';

  const add = (fn) => (e) => { e.stopPropagation(); fn(); onClose(); };

  const itemStyle = (last) => ({
    width: '100%', padding: '7px 12px',
    backgroundColor: 'transparent', color: '#9ca3af',
    border: 'none', cursor: 'pointer', fontSize: '12px', textAlign: 'left',
    borderBottom: last ? 'none' : '1px solid #374151'
  });

  const types = Object.values(CONTENT_TYPES);

  return (
    <div style={{
      position: 'absolute', right: 0, top: '100%', marginTop: '2px',
      backgroundColor: '#1f2937', border: '1px solid #374151',
      borderRadius: '5px', minWidth: '120px', zIndex: 1000,
      boxShadow: '0 6px 16px rgba(0,0,0,0.5)'
    }}>
      {canAddContainer && (
        <button
          onClick={add(() => dispatch(pageActions.updateElement(element.id, {
            children: [...(element.children || []), createContainer()]
          })))}
          style={itemStyle(false)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >Container</button>
      )}
      {types.map((type, idx) => (
        <button
          key={type}
          onClick={add(() => dispatch(pageActions.updateElement(element.id, {
            children: [...(element.children || []), createContentItem(type)]
          })))}
          style={{ ...itemStyle(idx === types.length - 1), textTransform: 'capitalize' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >{type}</button>
      ))}
    </div>
  );
}

export function TreeNode({ element, level = 0, segmentIndex, segmentTotal }) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { state, dispatch } = usePageStore();

  const isSelected = state.selectedElementId === element.id;
  const isSegment = element.type === 'segment';
  const isContainer = element.type === 'container';
  const hasChildren = element.children && element.children.length > 0;
  const canAdd = isSegment || isContainer;
  const showActions = isHovered || isSelected;

  // Segments auto-open when they or any descendant is selected
  const segmentOpen = isSegment
    ? (isSelected || containsElement(element.children, state.selectedElementId))
    : null;
  const effectiveIsOpen = isSegment ? segmentOpen : isOpen;

  const labelText = element.name || CONTENT_TYPE_LABELS[element.type] || 'Element';

  const handleSelect = () => dispatch(pageActions.selectElement(element.id, element.type));
  const handleDelete = (e) => { e.stopPropagation(); dispatch(pageActions.deleteElement(element.id)); };
  const handleDuplicate = (e) => { e.stopPropagation(); dispatch(pageActions.duplicateElement(element.id, element.type)); };
  const handleMoveUp = (e) => { e.stopPropagation(); dispatch(pageActions.moveSegment(element.id, 'up')); };
  const handleMoveDown = (e) => { e.stopPropagation(); dispatch(pageActions.moveSegment(element.id, 'down')); };

  const btn = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '2px 3px', lineHeight: 1, flexShrink: 0
  };

  const addBtn = canAdd && (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
        style={{ ...btn, width: '20px', height: '20px', background: '#1d4ed8', borderRadius: '3px', color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Add"
      >+</button>
      {showAddMenu && <AddMenu element={element} onClose={() => setShowAddMenu(false)} />}
    </div>
  );

  // ── SEGMENT ──────────────────────────────────────────────
  if (isSegment) {
    return (
      <div style={{
        border: `1px solid ${isSelected ? '#3b82f6' : segmentOpen ? '#1e2d40' : '#161f2e'}`,
        borderRadius: '7px',
        marginBottom: '5px',
        backgroundColor: '#0d1520',
        transition: 'border-color 0.15s'
      }}>
        <div
          onClick={handleSelect}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 10px',
            cursor: 'pointer', userSelect: 'none',
            backgroundColor: isSelected ? '#172554' : isHovered ? '#131e2e' : '#111827',
            borderRadius: hasChildren && segmentOpen ? '6px 6px 0 0' : '6px',
          }}
        >
          {/* Collapse indicator — read-only, driven by selection */}
          <span style={{ color: '#2d3f52', fontSize: '10px', width: '14px', flexShrink: 0 }}>
            {hasChildren ? (segmentOpen ? '▾' : '▸') : ''}
          </span>

          <span style={{
            flex: 1, fontSize: '13px', fontWeight: 500,
            color: isSelected ? '#bfdbfe' : segmentOpen ? '#94a3b8' : '#4b6074',
            letterSpacing: '0.01em'
          }}>
            {labelText}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', opacity: showActions ? 1 : 0, transition: 'opacity 0.1s' }}>
            {segmentTotal > 1 && (
              <>
                <button onClick={handleMoveUp} disabled={segmentIndex === 0} title="Move up"
                  style={{ ...btn, color: segmentIndex === 0 ? '#2d3d50' : '#4b6074', fontSize: '10px', cursor: segmentIndex === 0 ? 'default' : 'pointer' }}>▲</button>
                <button onClick={handleMoveDown} disabled={segmentIndex === segmentTotal - 1} title="Move down"
                  style={{ ...btn, color: segmentIndex === segmentTotal - 1 ? '#2d3d50' : '#4b6074', fontSize: '10px', cursor: segmentIndex === segmentTotal - 1 ? 'default' : 'pointer' }}>▼</button>
              </>
            )}
            <button onClick={handleDuplicate} title="Duplicate"
              style={{ ...btn, color: '#4b6074', fontSize: '13px' }}>⧉</button>
            <button onClick={handleDelete}
              style={{ ...btn, color: '#ef4444', fontSize: '10px', opacity: 0.6 }}>✕</button>
            {addBtn}
          </div>
        </div>

        {effectiveIsOpen && hasChildren && (
          <div style={{ padding: '3px 6px 5px' }}>
            {element.children.map(child => (
              <TreeNode key={child.id} element={child} level={1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── CONTAINER / CONTENT ITEM ──────────────────────────────
  const indent = (level - 1) * 12;

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      <div
        onClick={handleSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: isContainer ? '6px 8px' : '4px 8px',
          cursor: 'pointer', userSelect: 'none',
          backgroundColor: isSelected ? '#1e3a8a' : isHovered ? '#0f1a27' : 'transparent',
          borderRadius: '4px',
          borderLeft: isContainer ? `2px solid ${isSelected ? '#3b82f6' : '#1e3a5f'}` : '2px solid transparent',
          marginBottom: '1px'
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setIsOpen(!isOpen); }}
          style={{ ...btn, color: hasChildren ? '#3d5166' : 'transparent', fontSize: '9px', width: '12px', cursor: hasChildren ? 'pointer' : 'default' }}
        >
          {hasChildren ? (isOpen ? '▾' : '▸') : ''}
        </button>

        <span style={{
          fontSize: '10px', width: '14px', textAlign: 'center', flexShrink: 0,
          color: isSelected ? '#93c5fd' : isContainer ? '#334d63' : '#2a3d50',
          fontWeight: isContainer ? 600 : 400
        }}>
          {TYPE_ICONS[element.type] || '•'}
        </span>

        <span style={{
          flex: 1,
          fontSize: isContainer ? '12px' : '11px',
          color: isSelected ? '#dbeafe' : isContainer ? '#64748b' : '#475569',
          fontWeight: isContainer ? 500 : 400
        }}>
          {labelText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1px', opacity: showActions ? 1 : 0, transition: 'opacity 0.1s' }}>
          <button onClick={handleDuplicate} title="Duplicate"
            style={{ ...btn, color: '#4b6074', fontSize: '12px' }}>⧉</button>
          <button onClick={handleDelete}
            style={{ ...btn, color: '#ef4444', fontSize: '10px', opacity: 0.6 }}>✕</button>
          {canAdd && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
                style={{ ...btn, width: '18px', height: '18px', background: '#1d4ed8', borderRadius: '3px', color: 'white', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Add"
              >+</button>
              {showAddMenu && <AddMenu element={element} onClose={() => setShowAddMenu(false)} />}
            </div>
          )}
        </div>
      </div>

      {isOpen && hasChildren && (
        <div style={{ borderLeft: '1px solid #1a2d3f', marginLeft: '13px' }}>
          {element.children.map(child => (
            <TreeNode key={child.id} element={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
