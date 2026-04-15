import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPE_LABELS } from '../../utils/constants';
import { createContentItem, createContainer, CONTENT_TYPES, LAYOUT_PRESETS } from '../../store/pageTypes';

const TYPE_ICONS = {
  segment: '▦',
  slot: '⊞',
  container: '⬡',
  text: 'T',
  image: '▣',
  button: '⊡',
  video: '▷',
  card: '🎴',
  label: '⬛'
};

function containsElement(children, targetId) {
  if (!children) return false;
  return children.some(child =>
    child.id === targetId || containsElement(child.children, targetId)
  );
}

function getElementPositionInChildren(children, targetId) {
  if (!children) return -1;
  return children.findIndex(child => child.id === targetId);
}

function canMoveElement(element, direction, parentChildren) {
  if (!parentChildren) return false;
  const position = getElementPositionInChildren(parentChildren, element.id);
  if (position === -1) return false;
  
  if (direction === 'up') return position > 0;
  if (direction === 'down') return position < parentChildren.length - 1;
  return false;
}

function AddMenu({ element, onClose }) {
  const { dispatch } = usePageStore();

  const add = (fn) => (e) => { e.stopPropagation(); fn(); onClose(); };

  const itemStyle = (last) => ({
    width: '100%', padding: '7px 12px',
    backgroundColor: 'transparent', color: '#9ca3af',
    border: 'none', cursor: 'pointer', fontSize: '12px', textAlign: 'left',
    borderBottom: last ? 'none' : '1px solid #374151'
  });

  const isSlot = element.type === 'slot';
  const types = Object.values(CONTENT_TYPES);
  const allItems = isSlot
    ? [{ key: 'container', label: 'Container', create: () => createContainer() }, ...types.map(t => ({ key: t, label: t, create: () => createContentItem(t) }))]
    : types.map(t => ({ key: t, label: t, create: () => createContentItem(t) }));

  return (
    <div style={{
      position: 'absolute', right: 0, top: '100%', marginTop: '2px',
      backgroundColor: '#1f2937', border: '1px solid #374151',
      borderRadius: '5px', minWidth: '120px', zIndex: 1000,
      boxShadow: '0 6px 16px rgba(0,0,0,0.5)'
    }}>
      {allItems.map((item, idx) => (
        <button
          key={item.key}
          onClick={add(() => dispatch(pageActions.updateElement(element.id, {
            children: [...(element.children || []), item.create()]
          })))}
          style={{ ...itemStyle(idx === allItems.length - 1), textTransform: 'capitalize' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >{item.label}</button>
      ))}
    </div>
  );
}

export function TreeNode({ element, level = 0, segmentIndex, segmentTotal, parentChildren }) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldStayOpen, setShouldStayOpen] = useState(false);
  const { state, dispatch } = usePageStore();

  const isSelected = state.selectedElementId === element.id;
  const isSegment = element.type === 'segment';
  const isSlot = element.type === 'slot';
  const isContainer = element.type === 'container';
  const hasChildren = element.children && element.children.length > 0;
  const canAdd = isSlot || isContainer;  // Slots get "+" for content, segments don't (they auto-manage slots)
  const showActions = isHovered || isSelected;
  const isHiddenOnMobile = element.settings?.mobileHidden;

  // Update shouldStayOpen when selection changes
  React.useEffect(() => {
    const hasSelectedDescendant = containsElement(element.children, state.selectedElementId);
    const shouldBeOpen = isSelected || hasSelectedDescendant;
    
    if (shouldBeOpen) {
      setShouldStayOpen(true);
    } else if (isSegment && !isSelected && state.selectedElementId) {
      // For segments, if another segment is selected (not null), collapse this one
      // Check if the selected element is in a different segment
      const selectedElementIsInDifferentSegment = state.selectedElementId && !hasSelectedDescendant && !isSelected;
      if (selectedElementIsInDifferentSegment) {
        setShouldStayOpen(false);
      }
    }
    // Don't set shouldStayOpen to false immediately for containers - keep it true for a better UX
  }, [isSelected, state.selectedElementId, element.children, isSegment]);

  // Segments auto-open when they or any descendant is selected
  // Containers also stay open if they or any descendant is selected
  // Keep segments/containers open if they were previously opened (shouldStayOpen)
  const hasSelectedDescendant = containsElement(element.children, state.selectedElementId);
  const shouldBeOpenNow = isSelected || hasSelectedDescendant;
  const segmentOpen = isSegment ? (shouldBeOpenNow || shouldStayOpen) : null;
  const effectiveIsOpen = isSegment ? segmentOpen : ((shouldBeOpenNow || shouldStayOpen) ? true : isOpen);

  const baseName = element.name || CONTENT_TYPE_LABELS[element.type] || 'Element';
  const layoutLabel = isSegment && element.settings?.layout
    ? LAYOUT_PRESETS[element.settings.layout]?.label
    : null;
  const labelText = layoutLabel ? `${baseName}` : baseName;

  const handleSelect = () => dispatch(pageActions.selectElement(element.id, element.type));
  const handleDelete = (e) => { e.stopPropagation(); dispatch(pageActions.deleteElement(element.id)); };
  const handleDuplicate = (e) => { e.stopPropagation(); dispatch(pageActions.duplicateElement(element.id, element.type)); };
  const handleMoveUp = (e) => { 
    e.stopPropagation(); 
    if (isSegment) {
      dispatch(pageActions.moveSegment(element.id, 'up'));
    } else {
      dispatch(pageActions.moveElement(element.id, 'up'));
    }
  };
  const handleMoveDown = (e) => { 
    e.stopPropagation(); 
    if (isSegment) {
      dispatch(pageActions.moveSegment(element.id, 'down'));
    } else {
      dispatch(pageActions.moveElement(element.id, 'down'));
    }
  };

  const btn = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '2px 3px', lineHeight: 1, flexShrink: 0
  };

  // Segments don't get a "+" button (slots are managed by layout picker)
  // Slots get a "+" button to add content
  const addBtn = canAdd && !isSegment && (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
        style={{ ...btn, width: '20px', height: '20px', background: '#4299e1', borderRadius: '3px', color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Add content"
      >+</button>
      {showAddMenu && <AddMenu element={element} onClose={() => setShowAddMenu(false)} />}
    </div>
  );

  // ── SEGMENT ──────────────────────────────────────────────
  if (isSegment) {
    return (
      <div style={{
        border: `2px solid ${isSelected ? '#4299e1' : segmentOpen ? '#2d3748' : '#4a5568'}`,
        borderRadius: '7px',
        marginBottom: '6px',
        backgroundColor: isSelected ? '#2b6cb0' : segmentOpen ? '#2d3748' : '#1a202c',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 2px 8px rgba(66, 153, 225, 0.3)' : 'none'
      }}>
        <div
          onClick={handleSelect}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 12px',
            cursor: 'pointer', userSelect: 'none',
            backgroundColor: isSelected ? '#2b6cb0' : isHovered ? '#374151' : 'transparent',
            borderRadius: hasChildren && segmentOpen ? '5px 5px 0 0' : '5px',
          }}
        >
          {/* Collapse indicator — read-only, driven by selection */}
          <span style={{ color: isSelected ? '#90cdf4' : '#718096', fontSize: '10px', width: '14px', flexShrink: 0 }}>
            {hasChildren ? (segmentOpen ? '▾' : '▸') : ''}
          </span>

          <span style={{
            flex: 1, fontSize: '14px', fontWeight: 600,
            color: isSelected ? '#f7fafc' : segmentOpen ? '#e2e8f0' : '#a0aec0',
            letterSpacing: '0.01em',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            {labelText}
            {layoutLabel && (
              <span style={{
                fontSize: '10px', fontWeight: 400,
                color: isSelected ? '#93c5fd' : '#718096',
                backgroundColor: isSelected ? 'rgba(147,197,253,0.15)' : 'rgba(113,128,150,0.15)',
                padding: '1px 5px', borderRadius: '3px'
              }}>
                {layoutLabel}
              </span>
            )}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', opacity: showActions ? 1 : 0, transition: 'opacity 0.1s' }}>
            {segmentTotal > 1 && (
              <>
                <button onClick={handleMoveUp} disabled={segmentIndex === 0} title="Move up"
                  style={{ ...btn, color: segmentIndex === 0 ? '#4a5568' : '#718096', fontSize: '10px', cursor: segmentIndex === 0 ? 'default' : 'pointer' }}>▲</button>
                <button onClick={handleMoveDown} disabled={segmentIndex === segmentTotal - 1} title="Move down"
                  style={{ ...btn, color: segmentIndex === segmentTotal - 1 ? '#4a5568' : '#718096', fontSize: '10px', cursor: segmentIndex === segmentTotal - 1 ? 'default' : 'pointer' }}>▼</button>
              </>
            )}
            <button onClick={handleDuplicate} title="Duplicate"
              style={{ ...btn, color: '#718096', fontSize: '13px' }}>⧉</button>
            <button onClick={handleDelete}
              style={{ ...btn, color: '#fc8181', fontSize: '10px', opacity: 0.8 }}>✕</button>
            {addBtn}
          </div>
        </div>

        {effectiveIsOpen && hasChildren && (
          <div style={{ padding: '3px 6px 5px' }}>
            {element.children.map(child => (
              <TreeNode key={child.id} element={child} level={1} parentChildren={element.children} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── SLOT / CONTAINER / CONTENT ITEM ──────────────────────────────
  const indent = (level - 1) * 12;
  const isSlotOrContainer = isSlot || isContainer;

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      <div
        onClick={handleSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: isSlotOrContainer ? '7px 9px' : '5px 9px',
          cursor: 'pointer', userSelect: 'none',
          backgroundColor: isSelected ? '#2b6cb0' : isHovered ? '#374151' : 'transparent',
          borderRadius: '4px',
          borderLeft: isSlotOrContainer ? `3px solid ${isSelected ? '#4299e1' : '#718096'}` : '3px solid transparent',
          marginBottom: '2px',
          transition: 'all 0.15s'
        }}
      >
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            if (hasChildren) {
              setIsOpen(!isOpen);
              if (isOpen) {
                setShouldStayOpen(false);
              }
            }
          }}
          style={{ ...btn, color: hasChildren ? '#718096' : 'transparent', fontSize: '9px', width: '12px', cursor: hasChildren ? 'pointer' : 'default' }}
        >
          {hasChildren ? (isOpen ? '▾' : '▸') : ''}
        </button>

        <span style={{
          fontSize: '10px', width: '14px', textAlign: 'center', flexShrink: 0,
          color: isSelected ? '#90cdf4' : isSlotOrContainer ? '#718096' : '#4a5568',
          fontWeight: isSlotOrContainer ? 600 : 400
        }}>
          {TYPE_ICONS[element.type] || '•'}
        </span>

        <span style={{
          flex: 1,
          fontSize: isSlotOrContainer ? '12px' : '11px',
          color: isSelected ? '#f7fafc' : isSlotOrContainer ? '#e2e8f0' : '#a0aec0',
          fontWeight: isSlotOrContainer ? 500 : 400,
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          {labelText}
          {isHiddenOnMobile && (
            <span title="Hidden on mobile" style={{ fontSize: '9px', color: '#f59e0b', opacity: 0.8 }}>📱✕</span>
          )}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1px', opacity: showActions ? 1 : 0, transition: 'opacity 0.1s' }}>
          {!isSegment && parentChildren && parentChildren.length > 1 && (
            <>
              <button 
                onClick={handleMoveUp} 
                disabled={!canMoveElement(element, 'up', parentChildren)} 
                title="Move up"
                style={{ 
                  ...btn, 
                  color: canMoveElement(element, 'up', parentChildren) ? '#718096' : '#4a5568', 
                  fontSize: '10px', 
                  cursor: canMoveElement(element, 'up', parentChildren) ? 'pointer' : 'default' 
                }}
              >▲</button>
              <button 
                onClick={handleMoveDown} 
                disabled={!canMoveElement(element, 'down', parentChildren)} 
                title="Move down"
                style={{ 
                  ...btn, 
                  color: canMoveElement(element, 'down', parentChildren) ? '#718096' : '#4a5568', 
                  fontSize: '10px', 
                  cursor: canMoveElement(element, 'down', parentChildren) ? 'pointer' : 'default' 
                }}
              >▼</button>
            </>
          )}
          {!isSlot && (
            <button onClick={handleDuplicate} title="Duplicate"
              style={{ ...btn, color: '#718096', fontSize: '12px' }}>⧉</button>
          )}
          {!isSlot ? (
            <button onClick={handleDelete}
              style={{ ...btn, color: '#fc8181', fontSize: '10px', opacity: 0.8 }}>✕</button>
          ) : (
            <button disabled title="Change the segment layout to adjust slots"
              style={{ ...btn, color: '#4a5568', fontSize: '10px', opacity: 0.4, cursor: 'not-allowed' }}>✕</button>
          )}
          {canAdd && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
                style={{ ...btn, width: '18px', height: '18px', background: '#4299e1', borderRadius: '3px', color: 'white', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Add"
              >+</button>
              {showAddMenu && <AddMenu element={element} onClose={() => setShowAddMenu(false)} />}
            </div>
          )}
        </div>
      </div>

      {isOpen && hasChildren && (
        <div style={{ borderLeft: '1px solid #4a5568', marginLeft: '13px' }}>
          {element.children.map(child => (
            <TreeNode key={child.id} element={child} level={level + 1} parentChildren={element.children} />
          ))}
        </div>
      )}
    </div>
  );
}
