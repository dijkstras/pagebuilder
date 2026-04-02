import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { TreeNode } from './TreeNode';
import { THEME } from '../../utils/constants';

const BRAND_ITEMS = [
  {
    id: 'typography',
    label: 'Typography',
    description: 'Heading & body fonts',
    preview: (page) => (
      <span style={{ fontWeight: 700, fontSize: '15px', color: '#f3f4f6', letterSpacing: '-0.3px' }}>
        Aa
      </span>
    )
  },
  {
    id: 'colors',
    label: 'Colors',
    description: 'Brand color palette',
    preview: (page) => (
      <div style={{ display: 'flex', gap: '4px' }}>
        {Object.values(page.styles.colors).map((color, i) => (
          <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        ))}
      </div>
    )
  },
  {
    id: 'buttons',
    label: 'Buttons',
    description: 'Primary, secondary & tertiary',
    preview: (page) => {
      const primary = page.styles.buttonStyles.find(b => b.id === 'primary');
      return (
        <div style={{
          fontSize: '10px',
          backgroundColor: primary?.bgColor || '#3b82f6',
          color: primary?.textColor || '#fff',
          padding: '2px 8px',
          borderRadius: `${primary?.radius ?? 6}px`,
          whiteSpace: 'nowrap'
        }}>
          Button
        </div>
      );
    }
  }
];

export function StructureTree() {
  const [activeTab, setActiveTab] = React.useState('structure');
  const [showPageAddMenu, setShowPageAddMenu] = React.useState(false);
  const { state, dispatch } = usePageStore();

  const handleAddSegment = () => {
    dispatch(pageActions.addSegment('New Segment'));
    setShowPageAddMenu(false);
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
                      {item.preview(state.page)}
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
    </div>
  );
}
