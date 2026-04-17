import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPE_LABELS } from '../../utils/constants';
import { createContentItem, createContainer, CONTENT_TYPES, LAYOUT_PRESETS } from '../../store/pageTypes';
import { Layout, Type, Image, MousePointerClick, CreditCard, Video, ChevronRight, ChevronDown, Copy, Trash, CirclePlus, ArrowUp, ArrowDown, Rows3, Columns3, Tag, Play, Group } from 'lucide-react';

const TYPE_ICONS = {
  segment: Rows3,
  slot: Columns3,
  container: Group,
  text: Type,
  image: Image,
  button: MousePointerClick,
  video: Play,
  card: CreditCard,
  label: Tag
};

function containsElement(children, targetId) {
  if (!children) return false;
  return children.some(child =>
    child.id === targetId || containsElement(child.children, targetId)
  );
}

function AddMenu({ element, onClose, position, onMouseEnter, onMouseLeave }) {
  const { dispatch } = usePageStore();

  const add = (fn) => (e) => { e.stopPropagation(); fn(); onClose(); };

  const itemStyle = (last) => ({
    width: '100%', padding: '7px 12px',
    backgroundColor: 'transparent', color: '#ffffff',
    border: 'none', cursor: 'pointer', fontSize: '12px', textAlign: 'left',
    borderBottom: last ? 'none' : '1px solid #374151'
  });

  const isSlot = element.type === 'slot';
  const types = Object.values(CONTENT_TYPES);
  const allItems = isSlot
    ? [{ key: 'container', label: 'Container', create: () => createContainer() }, ...types.map(t => ({ key: t, label: t, create: () => createContentItem(t) }))]
    : types.map(t => ({ key: t, label: t, create: () => createContentItem(t) }));

  return (
    <div
      style={{
        position: 'fixed', left: position?.x || 0, top: position?.y || 0,
        backgroundColor: '#1f2937', border: '1px solid #374151',
        borderRadius: '5px', width: '140px', zIndex: 9999,
        boxShadow: '0 6px 16px rgba(0,0,0,0.5)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
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

function segmentHasContent(segment) {
  if (!segment.children) return false;
  const checkChildren = (children) => {
    for (const child of children) {
      if (child.type === 'slot' || child.type === 'container') {
        if (child.children && child.children.length > 0) return true;
      }
      if (child.children && checkChildren(child.children)) return true;
    }
    return false;
  };
  return checkChildren(segment.children);
}


export function TreeNode({ element, level = 0, segmentIndex, segmentTotal, parentChildren }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldStayOpen, setShouldStayOpen] = useState(false);
  const [isAddIconHovered, setIsAddIconHovered] = useState(false);
  const [isMoveUpHovered, setIsMoveUpHovered] = useState(false);
  const [isMoveDownHovered, setIsMoveDownHovered] = useState(false);
  const [isDuplicateHovered, setIsDuplicateHovered] = useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [menuTimeout, setMenuTimeout] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { state, dispatch } = usePageStore();

  const isSelected = state.selectedElementId === element.id;
  const isSegment = element.type === 'segment';
  const isSlot = element.type === 'slot';
  const isContainer = element.type === 'container';
  const hasChildren = element.children && element.children.length > 0;
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

  // ── SEGMENT ──────────────────────────────────────────────
  if (isSegment) {
    const IconComponent = TYPE_ICONS.segment;
    const segmentOpen = effectiveIsOpen || shouldStayOpen;

    const handleDelete = () => {
      dispatch(pageActions.deleteSegment(element.id));
    };

    const handleMoveUp = () => {
      if (segmentIndex > 0) {
        dispatch(pageActions.moveSegment(element.id, segmentIndex - 1));
      }
    };

    const handleMoveDown = () => {
      if (segmentIndex < segmentTotal - 1) {
        dispatch(pageActions.moveSegment(element.id, segmentIndex + 1));
      }
    };

    return (
      <>
        <div style={{
          border: `2px solid ${segmentOpen ? '#2d3748' : '#4a5568'}`,
          borderRadius: '7px',
          marginBottom: '6px',
          backgroundColor: segmentOpen ? '#2A303E' : '#1a202c',
          transition: 'all 0.2s'
        }}>
          <div
            onClick={handleSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 12px',
              cursor: 'pointer', userSelect: 'none',
              backgroundColor: isSelected ? '#4B5B84' : isHovered ? '#374151' : 'transparent',
              borderRadius: hasChildren && segmentOpen ? '5px 5px 0 0' : '5px',
            }}
          >
            {/* Collapse indicator — read-only, driven by selection */}
            <div style={{ width: '16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {hasChildren ? (
                segmentOpen ? (
                  <ChevronDown size={14} color={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} />
                ) : (
                  <ChevronRight size={14} color={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} />
                )
              ) : null}
            </div>

            <IconComponent size={16} color={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} />

            <span style={{
              flex: 1, fontSize: '14px', fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {labelText}
              {layoutLabel && (
                <span style={{
                  fontSize: '10px', fontWeight: 400,
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '1px 5px', borderRadius: '3px'
                }}>
                  {layoutLabel}
                </span>
              )}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: showActions ? 1 : 0, transition: 'opacity 0.1s' }}>
              {segmentTotal > 1 && (
                <>
                  <button onClick={handleMoveUp} disabled={segmentIndex === 0} title="Move up"
                    style={{ ...btn, color: segmentIndex === 0 ? 'rgba(255, 255, 255, 0.3)' : isMoveUpHovered ? '#60a5fa' : '#ffffff', cursor: segmentIndex === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={() => setIsMoveUpHovered(true)}
                    onMouseLeave={() => setIsMoveUpHovered(false)}
                  >
                    <ArrowUp size={12} color={segmentIndex === 0 ? 'rgba(255, 255, 255, 0.3)' : isMoveUpHovered ? '#60a5fa' : '#ffffff'} />
                  </button>
                  <button onClick={handleMoveDown} disabled={segmentIndex === segmentTotal - 1} title="Move down"
                    style={{ ...btn, color: segmentIndex === segmentTotal - 1 ? 'rgba(255, 255, 255, 0.3)' : isMoveDownHovered ? '#60a5fa' : '#ffffff', cursor: segmentIndex === segmentTotal - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={() => setIsMoveDownHovered(true)}
                    onMouseLeave={() => setIsMoveDownHovered(false)}
                  >
                    <ArrowDown size={12} color={segmentIndex === segmentTotal - 1 ? 'rgba(255, 255, 255, 0.3)' : isMoveDownHovered ? '#60a5fa' : '#ffffff'} />
                  </button>
                </>
              )}
              <button onClick={(e) => { e.stopPropagation(); if (segmentHasContent(element)) { setShowDeleteConfirm(true); } else { handleDelete(); } }} title="Delete segment"
                style={{ ...btn, color: isDeleteHovered ? '#f87171' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={() => setIsDeleteHovered(true)}
                onMouseLeave={() => setIsDeleteHovered(false)}
              >
                <Trash size={12} color={isDeleteHovered ? '#f87171' : '#ffffff'} />
              </button>
              <div style={{ position: 'relative' }}
                onMouseEnter={(e) => {
                  if (menuTimeout) clearTimeout(menuTimeout);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
                  setShowAddMenu(true);
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => setShowAddMenu(false), 300);
                  setMenuTimeout(timeout);
                }}
              >
                <CirclePlus
                  size={14}
                  color={isAddIconHovered ? '#10b981' : '#ffffff'}
                  style={{ cursor: 'pointer' }}
                  title="Add content"
                  onMouseEnter={() => setIsAddIconHovered(true)}
                  onMouseLeave={() => setIsAddIconHovered(false)}
                />
                {showAddMenu && (
                  <AddMenu
                    element={element}
                    onClose={() => setShowAddMenu(false)}
                    position={menuPosition}
                    onMouseEnter={() => { if (menuTimeout) clearTimeout(menuTimeout); }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => setShowAddMenu(false), 100);
                      setMenuTimeout(timeout);
                    }}
                  />
                )}
              </div>
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
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: '#1f2937', border: '1px solid #374151',
              borderRadius: '8px', padding: '20px', minWidth: '300px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              <h3 style={{ color: '#ffffff', margin: '0 0 12px 0', fontSize: '16px' }}>
                Delete Segment?
              </h3>
              <p style={{ color: '#9ca3af', margin: '0 0 20px 0', fontSize: '14px' }}>
                This segment contains content elements. Are you sure you want to delete it?
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '8px 16px', backgroundColor: '#374151', color: '#ffffff',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                  style={{
                    padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── SLOT / CONTAINER / CONTENT ITEM ──────────────────────────────
  const indent = (level - 1) * 12;
  const isSlotOrContainer = isSlot || isContainer;
  const IconComponent = TYPE_ICONS[element.type] || Layout;
  const isContentElement = !isSlot && !isContainer && !isSegment;

  const elementRow = (
    <div
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: isSlotOrContainer ? '7px 9px' : '5px 9px',
        cursor: 'pointer', userSelect: 'none',
        backgroundColor: isSelected ? '#4B5B84' : isHovered ? '#374151' : 'transparent',
        borderRadius: '4px',
        borderLeft: '3px solid transparent',
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
        style={{ ...btn, color: hasChildren ? 'rgba(255, 255, 255, 0.7)' : 'transparent', width: '16px', cursor: hasChildren ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown size={12} color={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} />
          ) : (
            <ChevronRight size={12} color={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} />
          )
        ) : null}
      </button>

      <div style={{ width: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconComponent size={isSlotOrContainer ? 14 : 12} color={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} />
      </div>

      <span style={{
        flex: 1,
        fontSize: isSlotOrContainer ? '12px' : '11px',
        color: '#ffffff',
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
                  color: canMoveElement(element, 'up', parentChildren) ? (isMoveUpHovered ? '#60a5fa' : '#ffffff') : 'rgba(255, 255, 255, 0.3)',
                  cursor: canMoveElement(element, 'up', parentChildren) ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseEnter={() => setIsMoveUpHovered(true)}
                onMouseLeave={() => setIsMoveUpHovered(false)}
              >
                <ArrowUp size={10} color={canMoveElement(element, 'up', parentChildren) ? (isMoveUpHovered ? '#60a5fa' : '#ffffff') : 'rgba(255, 255, 255, 0.3)'} />
              </button>
              <button
                onClick={handleMoveDown}
                disabled={!canMoveElement(element, 'down', parentChildren)}
                title="Move down"
                style={{
                  ...btn,
                  color: canMoveElement(element, 'down', parentChildren) ? (isMoveDownHovered ? '#60a5fa' : '#ffffff') : 'rgba(255, 255, 255, 0.3)',
                  cursor: canMoveElement(element, 'down', parentChildren) ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseEnter={() => setIsMoveDownHovered(true)}
                onMouseLeave={() => setIsMoveDownHovered(false)}
              >
                <ArrowDown size={10} color={canMoveElement(element, 'down', parentChildren) ? (isMoveDownHovered ? '#60a5fa' : '#ffffff') : 'rgba(255, 255, 255, 0.3)'} />
              </button>
            </>
          )}
          {isSlotOrContainer && (
            <div style={{ position: 'relative', marginRight: '4px' }}
              onMouseEnter={(e) => {
                if (menuTimeout) clearTimeout(menuTimeout);
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
                setShowAddMenu(true);
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => setShowAddMenu(false), 300);
                setMenuTimeout(timeout);
              }}
            >
              <CirclePlus
                size={12}
                color={isAddIconHovered ? '#10b981' : '#ffffff'}
                style={{ cursor: 'pointer' }}
                title="Add content"
                onMouseEnter={() => setIsAddIconHovered(true)}
                onMouseLeave={() => setIsAddIconHovered(false)}
              />
              {showAddMenu && (
                <AddMenu 
                  element={element} 
                  onClose={() => setShowAddMenu(false)} 
                  position={menuPosition}
                  onMouseEnter={() => { if (menuTimeout) clearTimeout(menuTimeout); }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => setShowAddMenu(false), 100);
                    setMenuTimeout(timeout);
                  }}
                />
              )}
            </div>
          )}
          {isContentElement && (
            <>
              <button onClick={handleDuplicate} title="Duplicate"
                style={{ ...btn, color: isDuplicateHovered ? '#60a5fa' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={() => setIsDuplicateHovered(true)}
                onMouseLeave={() => setIsDuplicateHovered(false)}
              >
                <Copy size={12} color={isDuplicateHovered ? '#60a5fa' : '#ffffff'} />
              </button>
              <button onClick={handleDelete}
                style={{ ...btn, color: isDeleteHovered ? '#f87171' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={() => setIsDeleteHovered(true)}
                onMouseLeave={() => setIsDeleteHovered(false)}
              >
                <Trash size={12} color={isDeleteHovered ? '#f87171' : '#ffffff'} />
              </button>
            </>
          )}
        </div>
    </div>
  );

  const childrenContainer = isOpen && hasChildren && (
    <div style={{
      marginTop: '4px'
    }}>
      {element.children.map(child => (
        <TreeNode key={child.id} element={child} level={level + 1} parentChildren={element.children} />
      ))}
    </div>
  );

  if (isSlotOrContainer && isOpen && hasChildren) {
    return (
      <div style={{ marginLeft: `${indent}px` }}>
        <div style={{
          backgroundColor: isSlot ? '#3C4355' : isContainer ? '#434C64' : 'transparent',
          borderRadius: '4px',
          padding: '8px 6px'
        }}>
          {elementRow}
          {childrenContainer}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      {elementRow}
      {childrenContainer}
    </div>
  );
}
