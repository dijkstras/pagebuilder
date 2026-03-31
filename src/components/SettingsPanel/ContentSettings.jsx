import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPES } from '../../store/pageTypes';

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

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  backgroundColor: '#374151',
  color: '#f3f4f6',
  border: '1px solid #4b5563',
  borderRadius: '6px',
  fontSize: '13px',
  boxSizing: 'border-box'
};

const labelStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  display: 'block',
  marginBottom: '5px'
};

export function ContentSettings() {
  const { state, dispatch } = usePageStore();
  const content = findElement(state.page, state.selectedElementId);

  if (!content) return null;

  const handleSettingUpdate = (key, value) => {
    dispatch(pageActions.updateElement(content.id, {
      settings: { ...content.settings, [key]: value }
    }));
  };

  const handleCustomUpdate = (key, value) => {
    dispatch(pageActions.updateElement(content.id, {
      settings: {
        ...content.settings,
        customOverrides: { ...content.settings.customOverrides, [key]: value }
      }
    }));
  };

  return (
    <div>
      {/* ── Text ── */}
      {content.type === CONTENT_TYPES.TEXT && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Text role</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'heading', label: 'Heading', preview: state.page.styles.fonts.heading },
                { id: 'body', label: 'Body text', preview: state.page.styles.fonts.body }
              ].map(role => {
                const isActive = content.settings.textRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSettingUpdate('textRole', role.id)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      backgroundColor: isActive ? '#1d4ed8' : '#374151',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      fontFamily: role.preview.family,
                      fontWeight: role.preview.weight,
                      fontSize: role.id === 'heading' ? '18px' : '13px',
                      color: '#f3f4f6',
                      lineHeight: '1.2',
                      marginBottom: '3px'
                    }}>
                      Aa
                    </div>
                    <div style={{ fontSize: '11px', color: isActive ? '#93c5fd' : '#9ca3af' }}>
                      {role.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>
                      {role.preview.family}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Content</label>
            <textarea
              value={content.settings.customOverrides.content || ''}
              onChange={(e) => handleCustomUpdate('content', e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '80px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </>
      )}

      {/* ── Image ── */}
      {content.type === CONTENT_TYPES.IMAGE && (
        <div>
          <label style={labelStyle}>Image URL</label>
          <input
            type="text"
            value={content.settings.customOverrides.src || ''}
            onChange={(e) => handleCustomUpdate('src', e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>
      )}

      {/* ── Button ── */}
      {content.type === CONTENT_TYPES.BUTTON && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Button style</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.page.styles.buttonStyles.map(btnStyle => {
                const isActive = content.settings.assignedStyleId === btnStyle.id;
                const isOutline = btnStyle.bgColor === 'transparent';
                return (
                  <button
                    key={btnStyle.id}
                    onClick={() => handleSettingUpdate('assignedStyleId', btnStyle.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      backgroundColor: isActive ? '#1d4ed8' : '#374151',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {/* Mini button preview */}
                    <span style={{
                      display: 'inline-block',
                      padding: '5px 14px',
                      backgroundColor: btnStyle.bgColor,
                      color: btnStyle.textColor,
                      borderRadius: `${btnStyle.radius}px`,
                      fontSize: '12px',
                      fontWeight: 500,
                      border: isOutline ? `1.5px solid ${btnStyle.textColor}` : 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {btnStyle.label}
                    </span>
                    <span style={{ fontSize: '12px', color: isActive ? '#f3f4f6' : '#9ca3af' }}>
                      {btnStyle.label}
                    </span>
                    {isActive && (
                      <span style={{ marginLeft: 'auto', color: '#93c5fd', fontSize: '14px' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Label</label>
            <input
              type="text"
              value={content.settings.customOverrides.label || ''}
              onChange={(e) => handleCustomUpdate('label', e.target.value)}
              style={inputStyle}
            />
          </div>
        </>
      )}
      {/* ── Size ── */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>Size</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, fontSize: '11px' }}>Width</label>
            <input
              type="text"
              value={content.settings.customOverrides.width || ''}
              onChange={(e) => handleCustomUpdate('width', e.target.value || undefined)}
              placeholder="auto"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, fontSize: '11px' }}>Height</label>
            <input
              type="text"
              value={content.settings.customOverrides.height || ''}
              onChange={(e) => handleCustomUpdate('height', e.target.value || undefined)}
              placeholder="auto"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Leave blank for default. e.g. 200px, 50%, 100%
        </div>
      </div>
    </div>
  );
}
