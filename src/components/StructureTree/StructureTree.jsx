import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { TreeNode } from './TreeNode';
import { THEME } from '../../utils/constants';
import { SegmentPickerModal } from '../SegmentPickerModal/SegmentPickerModal';
import { segmentStorage } from '../../services/segmentStorage';
import { deepCloneElement } from '../../store/pageStore.jsx';
import { Type, Paintbrush, SquareMousePointer } from 'lucide-react';

const BRAND_ITEMS = [
  {
    id: 'typography',
    label: 'Typography',
    description: 'Heading & body fonts',
    icon: Type
  },
  {
    id: 'colors',
    label: 'Colors',
    description: 'Brand color palette',
    icon: Paintbrush
  },
  {
    id: 'buttons',
    label: 'Buttons',
    description: 'Primary, secondary & tertiary',
    icon: SquareMousePointer
  }
];

export function StructureTree() {
  const [activeTab, setActiveTab] = React.useState('structure');
  const [showSegmentPicker, setShowSegmentPicker] = useState(false);
  const { state, dispatch } = usePageStore();

  const handleAddSegment = () => {
    setShowSegmentPicker(true);
  };

  const handleSelectEmptySegment = () => {
    dispatch(pageActions.addSegment('New Segment'));
    setShowSegmentPicker(false);
  };

  const handleSelectSavedSegment = (savedSegment) => {
    // Clone the saved segment data to generate new IDs
    const clonedSegment = deepCloneElement(savedSegment.data);
    clonedSegment.name = savedSegment.name; // Keep the original name
    
    // Add the cloned segment to the page
    dispatch({
      type: 'ADD_SEGMENT_FROM_DATA',
      payload: clonedSegment
    });
    setShowSegmentPicker(false);
  };

  const isPageSelected = !state.selectedElementId && !state.activeBrandSection;

  const tabStyle = (tab) => ({
    flex: 1,
    padding: '8px 0',
    backgroundColor: activeTab === tab ? THEME.background : 'transparent',
    color: activeTab === tab ? '#f3f4f6' : '#9ca3af',
    border: 'none',
    borderBottom: activeTab === tab ? `2px solid ${THEME.accent}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: activeTab === tab ? 600 : 400,
    transition: 'all 0.15s'
  });

  return (
    <div style={{
      width: '300px',
      height: '100vh',
      backgroundColor: THEME.surface,
      borderRight: `1px solid ${THEME.border}`,
      display: 'flex',
      flexDirection: 'column',
      color: THEME.text
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
        <button style={tabStyle('structure')} onClick={() => setActiveTab('structure')}>
          Page Structure
        </button>
        <button style={tabStyle('branding')} onClick={() => setActiveTab('branding')}>
          Branding
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'structure' ? (
          <>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #4a5568' }}>
              <span
                onClick={() => dispatch(pageActions.deselectElement())}
                style={{
                  flex: 1, fontSize: '13px', fontWeight: 600,
                  color: isPageSelected ? '#90cdf4' : '#718096',
                  cursor: 'pointer', userSelect: 'none',
                  letterSpacing: '0.05em', textTransform: 'uppercase'
                }}
              >
                {state.page.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleAddSegment(); }}
                style={{
                  background: '#4299e1', border: 'none', color: 'white',
                  cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
                  borderRadius: '4px', width: '24px', height: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Add segment"
              >+</button>
            </div>

            <div>
              {state.page.root.map((segment, index) => (
                <TreeNode key={segment.id} element={segment} segmentIndex={index} segmentTotal={state.page.root.length} />
              ))}
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Click an item to edit your brand settings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {BRAND_ITEMS.map(item => {
                const isActive = state.activeBrandSection === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => dispatch(pageActions.selectBrandSection(item.id))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      backgroundColor: isActive ? '#1d4ed8' : THEME.background,
                      border: `1px solid ${isActive ? '#3b82f6' : THEME.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#4b5563'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = THEME.border; }}
                  >
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={24} color="#9ca3af" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#f3f4f6' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{item.description}</div>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>›</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <SegmentPickerModal
        isOpen={showSegmentPicker}
        onClose={() => setShowSegmentPicker(false)}
        onSelect={handleSelectSavedSegment}
        onEmptySelect={handleSelectEmptySegment}
      />
    </div>
  );
}
