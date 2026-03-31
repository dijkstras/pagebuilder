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

              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPageAddMenu(!showPageAddMenu);
                  }}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px 8px',
                    fontWeight: 'bold',
                    lineHeight: '1',
                    borderRadius: '4px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title="Add segment"
                >
                  +
                </button>

                {showPageAddMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    minWidth: '140px',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                  }}>
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
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      📦 Segment
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              {state.page.root.map(segment => (
                <TreeNode key={segment.id} element={segment} />
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
