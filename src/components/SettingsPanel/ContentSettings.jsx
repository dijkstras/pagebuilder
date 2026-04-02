import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPES } from '../../store/pageTypes';
import { ColorPresets } from './ColorPresets.jsx';
import { BUTTON_ICONS } from '../../utils/buttonIcons';

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
      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
        <input
          type="text"
          value={content.name || ''}
          onChange={(e) => dispatch(pageActions.updateElement(content.id, { name: e.target.value }))}
          placeholder="Element name…"
          style={{ width: '100%', padding: '7px 10px', backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* ── Text ── */}
      {content.type === CONTENT_TYPES.TEXT && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Text style</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'heading1', label: 'Heading 1' },
                { id: 'heading2', label: 'Heading 2' },
                { id: 'body', label: 'Body' },
                { id: 'label', label: 'Label' }
              ].map(role => {
                const preview = state.page.styles.fonts[role.id];
                const isActive = content.settings.textRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSettingUpdate('textRole', role.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: isActive ? '#1d4ed8' : '#374151',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: preview.family,
                        fontWeight: preview.weight,
                        fontSize: `${preview.size}px`,
                        color: '#f3f4f6',
                        lineHeight: '1.2'
                      }}>
                        Aa
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <div style={{ fontSize: '11px', color: isActive ? '#93c5fd' : '#9ca3af' }}>
                        {role.label}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>
                        {preview.size}px • {preview.family}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Alignment</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'left', label: 'Left', icon: '◄' },
                { id: 'center', label: 'Center', icon: '═' },
                { id: 'right', label: 'Right', icon: '►' }
              ].map(alignment => {
                const isActive = (content.settings.textAlign || 'left') === alignment.id;
                return (
                  <button
                    key={alignment.id}
                    onClick={() => handleSettingUpdate('textAlign', alignment.id)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      backgroundColor: isActive ? '#1d4ed8' : '#374151',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? '#93c5fd' : '#9ca3af'
                    }}
                    title={alignment.label}
                  >
                    {alignment.icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
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

          <div>
            <label style={labelStyle}>Text color</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="color"
                value={content.settings.customOverrides.color || state.page.styles.colors?.text || '#1f2937'}
                onChange={(e) => handleCustomUpdate('color', e.target.value)}
                style={{ width: '40px', height: '40px', cursor: 'pointer', flexShrink: 0, borderRadius: '4px', border: '1px solid #4b5563' }}
              />
              <input
                type="text"
                value={content.settings.customOverrides.color || ''}
                onChange={(e) => handleCustomUpdate('color', e.target.value || undefined)}
                placeholder="Default"
                style={inputStyle}
              />
            </div>
            {Object.keys(state.page.styles.colors || {}).length > 0 && (
              <ColorPresets colors={state.page.styles.colors} onSelectColor={(color) => handleCustomUpdate('color', color)} />
            )}
          </div>
        </>
      )}

      {/* ── Image ── */}
      {content.type === CONTENT_TYPES.IMAGE && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Image URL</label>
            <input
              type="text"
              value={content.settings.customOverrides.src || ''}
              onChange={(e) => handleCustomUpdate('src', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Image Fit</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'contain', label: 'Fit' },
                { id: 'cover', label: 'Fill' },
                { id: 'stretch', label: 'Stretch' }
              ].map(fit => {
                const isActive = (content.settings.customOverrides.objectFit || 'cover') === (fit.id === 'stretch' ? '100% 100%' : fit.id);
                return (
                  <button
                    key={fit.id}
                    onClick={() => handleCustomUpdate('objectFit', fit.id === 'stretch' ? '100% 100%' : fit.id)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      backgroundColor: isActive ? '#1d4ed8' : '#374151',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? '#93c5fd' : '#9ca3af'
                    }}
                  >
                    {fit.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Fit: maintain aspect ratio • Fill: crop to fit • Stretch: ignore aspect ratio
            </div>
          </div>
        </>
      )}

      {/* ── Video ── */}
      {content.type === CONTENT_TYPES.VIDEO && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>YouTube URL</label>
          <input
            type="text"
            value={content.settings.customOverrides.src || ''}
            onChange={(e) => handleCustomUpdate('src', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            style={inputStyle}
          />
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Paste a YouTube video URL
          </div>
        </div>
      )}

      {/* ── Button ── */}
      {content.type === CONTENT_TYPES.BUTTON && (() => {
        const customOverrides = content.settings.customOverrides;
        const icon = customOverrides.icon ?? { key: null, position: 'none' };
        const sizeOverride = customOverrides.sizeOverride ?? { enabled: false, width: 'auto', height: 'auto' };
        return (
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

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Label</label>
              <input
                type="text"
                value={content.settings.customOverrides.label || ''}
                onChange={(e) => handleCustomUpdate('label', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Icon section */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Icon</label>
              {/* Position toggle */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {['none', 'before', 'after'].map(pos => (
                  <button
                    key={pos}
                    onClick={() => handleCustomUpdate('icon', { ...icon, position: pos })}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      border: '1px solid',
                      borderColor: icon.position === pos ? '#3b82f6' : '#d1d5db',
                      borderRadius: 4,
                      background: icon.position === pos ? '#eff6ff' : '#fff',
                      color: icon.position === pos ? '#3b82f6' : '#374151',
                      fontSize: 12,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {pos === 'none' ? 'None' : pos === 'before' ? 'Before' : 'After'}
                  </button>
                ))}
              </div>
              {/* Icon grid — only when position is not 'none' */}
              {icon.position !== 'none' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                  {BUTTON_ICONS.map(({ key: iconKey, label, svg }) => (
                    <button
                      key={iconKey}
                      title={label}
                      onClick={() => handleCustomUpdate('icon', { ...icon, key: iconKey })}
                      style={{
                        padding: 6,
                        border: '1px solid',
                        borderColor: icon.key === iconKey ? '#3b82f6' : '#e5e7eb',
                        borderRadius: 4,
                        background: icon.key === iconKey ? '#eff6ff' : '#fafafa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Size override section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={labelStyle}>Size Override</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sizeOverride.enabled}
                    onChange={e => handleCustomUpdate('sizeOverride', { ...sizeOverride, enabled: e.target.checked })}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Enable</span>
                </label>
              </div>
              {sizeOverride.enabled && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Width</label>
                    <input
                      type="text"
                      value={sizeOverride.width}
                      onChange={e => handleCustomUpdate('sizeOverride', { ...sizeOverride, width: e.target.value })}
                      placeholder="auto"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Height</label>
                    <input
                      type="text"
                      value={sizeOverride.height}
                      onChange={e => handleCustomUpdate('sizeOverride', { ...sizeOverride, height: e.target.value })}
                      placeholder="auto"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}
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
