import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { CONTENT_TYPES } from '../../store/pageTypes';
import { ColorPresets, ColorSlotPicker, resolveSlotColor } from './ColorPresets.jsx';
import { BUTTON_ICONS } from '../../utils/buttonIcons';
import { GradientPicker } from './GradientPicker.jsx';
import { useMobileSettings, MobileOverrideIcon, MobileOverrideWrap } from './useMobileSettings.jsx';

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

const MobileOverrideDot = MobileOverrideIcon;

export function ContentSettings() {
  const { state, dispatch } = usePageStore();
  const content = findElement(state.page, state.selectedElementId);

  if (!content) return null;

  const { isMobile, getSetting, updateSetting, mergeSettings, hasOverride, clearOverride } = useMobileSettings(content);

  const handleSettingUpdate = (key, value) => {
    if (isMobile) {
      updateSetting(key, value);
    } else {
      dispatch(pageActions.updateElement(content.id, {
        settings: { ...content.settings, [key]: value }
      }));
    }
  };

  const handleMergeSetting = (partial) => mergeSettings(partial);

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
          <MobileOverrideWrap hasOverride={hasOverride('textRole')} style={{ marginBottom: '16px' }}>
            <label style={{ ...labelStyle, display: 'inline-block' }}>Text style<MobileOverrideDot hasOverride={hasOverride('textRole')} onClear={() => clearOverride('textRole')} /></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'heading1', label: 'Heading 1' },
                { id: 'heading2', label: 'Heading 2' },
                { id: 'body', label: 'Body' },
                { id: 'label', label: 'Label' }
              ].map(role => {
                const preview = state.page.styles.fonts[role.id];
                const isActive = getSetting('textRole', 'body') === role.id;
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
          </MobileOverrideWrap>

          <MobileOverrideWrap hasOverride={hasOverride('textAlign')} style={{ marginBottom: '16px' }}>
            <label style={{ ...labelStyle, display: 'inline-block' }}>Alignment<MobileOverrideDot hasOverride={hasOverride('textAlign')} onClear={() => clearOverride('textAlign')} /></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'left', label: 'Left', icon: '◄' },
                { id: 'center', label: 'Center', icon: '═' },
                { id: 'right', label: 'Right', icon: '►' }
              ].map(alignment => {
                const isActive = getSetting('textAlign', 'left') === alignment.id;
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
          </MobileOverrideWrap>

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
            <ColorSlotPicker
              slot={content.settings.customOverrides.colorSlot ?? null}
              customColor={content.settings.customOverrides.color}
              colors={state.page.styles.colors || {}}
              onSlotChange={(slot, color) => {
                dispatch(pageActions.updateElement(content.id, {
                  settings: {
                    ...content.settings,
                    customOverrides: { ...content.settings.customOverrides, colorSlot: slot, color }
                  }
                }));
              }}
              onCustomColorChange={(color) => handleCustomUpdate('color', color)}
            />
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

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Corner Radius</label>
            <input
              type="text"
              value={content.settings.customOverrides.borderRadius || ''}
              onChange={(e) => handleCustomUpdate('borderRadius', e.target.value)}
              placeholder="0px"
              style={inputStyle}
            />
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Enter value like: 8px, 12px, 50%
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Opacity</label>
            <input
              type="text"
              value={content.settings.customOverrides.opacity || ''}
              onChange={(e) => handleCustomUpdate('opacity', e.target.value)}
              placeholder="100%"
              style={inputStyle}
            />
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Enter value like: 0.5, 50%, 80%
            </div>
          </div>
        </>
      )}

      {/* ── Video ── */}
      {content.type === CONTENT_TYPES.VIDEO && (
        <>
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

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Video Fit</label>
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

      {/* ── Button ── */}
      {content.type === CONTENT_TYPES.BUTTON && (() => {
        const customOverrides = content.settings.customOverrides;
        const icon = customOverrides.icon ?? { key: null, position: 'none' };
        const sizeOverride = customOverrides.sizeOverride ?? { enabled: false, width: 'auto', height: 'auto' };
        const colors = state.page.styles.colors;
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Button style</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {state.page.styles.buttonStyles.map(btnStyle => {
                  const isActive = content.settings.assignedStyleId === btnStyle.id;
                  // Resolve actual colors from slots
                  const bgColor = resolveSlotColor(btnStyle.bgColorSlot, colors, btnStyle.bgColor);
                  const textColor = resolveSlotColor(btnStyle.textColorSlot, colors, btnStyle.textColor);
                  const isOutline = bgColor === 'transparent';
                  // Handle gradient backgrounds
                  const background = btnStyle.bgType === 'gradient' && btnStyle.bgGradient
                    ? `linear-gradient(${btnStyle.bgGradient.angle ?? 90}deg, ${btnStyle.bgGradient.color1}, ${btnStyle.bgGradient.color2})`
                    : bgColor;
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
                        background: background,
                        color: textColor,
                        borderRadius: `${btnStyle.radius}px`,
                        fontSize: `${btnStyle.fontSize ?? 14}px`,
                        fontWeight: 500,
                        border: isOutline ? `1.5px solid ${textColor}` : 'none',
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
                    onClick={() => handleCustomUpdate('icon', { ...icon, position: pos, key: pos === 'none' ? null : icon.key })}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      border: '1px solid',
                      borderColor: icon.position === pos ? '#3b82f6' : '#4b5563',
                      borderRadius: 4,
                      background: icon.position === pos ? '#1d4ed8' : '#374151',
                      color: icon.position === pos ? '#93c5fd' : '#9ca3af',
                      fontSize: 12,
                      cursor: 'pointer'
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
                        borderColor: icon.key === iconKey ? '#3b82f6' : '#4b5563',
                        borderRadius: 4,
                        background: icon.key === iconKey ? '#1d4ed8' : '#374151',
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
                <label style={{ ...labelStyle, marginBottom: 0 }}>Size Override</label>
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
      {/* ── Card ── */}
      {content.type === CONTENT_TYPES.CARD && (() => {
        const settings = content.settings || {};
        const colors = state.page.styles.colors || {};
        
        return (
          <>
            {/* Card Settings */}
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Settings</label>
              
              {/* Layout Direction */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Layout Direction</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { value: 'column', label: '↓', title: 'Vertical (top to bottom)' },
                    { value: 'row', label: '→', title: 'Horizontal (left to right)' }
                  ].map(({ value, label, title }) => (
                    <button
                      key={value}
                      title={title}
                      onClick={() => handleSettingUpdate('direction', value)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '16px',
                        backgroundColor: (settings.direction ?? 'column') === value ? '#3b82f6' : '#374151',
                        color: '#f3f4f6',
                        border: '1px solid #4b5563',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {label} {value === 'row' ? 'Horizontal' : 'Vertical'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Alignment */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Content Alignment</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↔</span>
                    {[{ v: 'left', l: '←' }, { v: 'center', l: '—' }, { v: 'right', l: '→' }].map(({ v, l }) => (
                      <button key={v} onClick={() => handleSettingUpdate('contentAlignment', v)} style={{
                        flex: 1, height: '28px', fontSize: '13px',
                        backgroundColor: (settings.contentAlignment ?? 'left') === v ? '#3b82f6' : '#374151',
                        color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
                      }}>{l}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↕</span>
                    {[{ v: 'top', l: '↑' }, { v: 'center', l: '—' }, { v: 'bottom', l: '↓' }].map(({ v, l }) => (
                      <button key={v} onClick={() => handleSettingUpdate('verticalAlignment', v)} style={{
                        flex: 1, height: '28px', fontSize: '13px',
                        backgroundColor: (settings.verticalAlignment ?? 'top') === v ? '#3b82f6' : '#374151',
                        color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Spacing</label>
                <input
                  type="text"
                  value={typeof settings.spacing === 'string' ? settings.spacing : settings.spacing?.toString() || '12'}
                  onChange={(e) => {
                    const value = e.target.value;
                    const trimmedValue = value.trim();
                    if (trimmedValue.toLowerCase() === 'auto') {
                      handleSettingUpdate('spacing', 'auto');
                    } else if (trimmedValue === '') {
                      // Don't reset immediately, allow user to type
                    } else {
                      const numericMatch = trimmedValue.match(/^(\d+(?:\.\d+)?)$/);
                      if (numericMatch) {
                        const numValue = parseFloat(numericMatch[1]);
                        if (numValue >= 0) {
                          handleSettingUpdate('spacing', numValue);
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // If field is empty when losing focus, reset to default
                    if (e.target.value.trim() === '') {
                      handleSettingUpdate('spacing', 12);
                    }
                  }}
                  placeholder="12"
                  style={inputStyle}
                />
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Space between card elements. e.g. 12, 24, auto
                </div>
              </div>

              {/* Padding */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Padding (px)</label>
                <input
                  type="number"
                  value={settings.padding || 20}
                  onChange={(e) => handleSettingUpdate('padding', parseInt(e.target.value) || 20)}
                  style={inputStyle}
                />
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Space inside card edges
                </div>
              </div>

              {/* Size */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Size</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Width</label>
                    <input
                      type="text"
                      value={settings.width || ''}
                      onChange={(e) => handleSettingUpdate('width', e.target.value || undefined)}
                      placeholder="300px"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Height</label>
                    <input
                      type="text"
                      value={settings.height || ''}
                      onChange={(e) => handleSettingUpdate('height', e.target.value || undefined)}
                      placeholder="auto"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Background */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Background</label>
                <GradientPicker
                  bgType={settings.bgType || 'solid'}
                  bgColor={settings.bgColor}
                  bgColorSlot={settings.bgColorSlot ?? null}
                  bgGradient={settings.bgGradient}
                  onUpdate={handleSettingUpdate}
                  onMergeUpdate={handleMergeSetting}
                  colors={colors}
                />
              </div>

              {/* Border */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.borderEnabled || false}
                    onChange={(e) => handleSettingUpdate('borderEnabled', e.target.checked)}
                  />
                  Border
                </label>
                {settings.borderEnabled && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width (px)</label>
                      <input
                        type="number"
                        value={settings.borderWidth ?? 1}
                        min={1}
                        onChange={(e) => handleSettingUpdate('borderWidth', parseInt(e.target.value) || 1)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Color</label>
                      <input
                        type="text"
                        value={settings.borderColor ?? '#e5e7eb'}
                        onChange={(e) => handleSettingUpdate('borderColor', e.target.value)}
                        placeholder="#e5e7eb"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Border Radius */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Border Radius (px)</label>
                <input
                  type="number"
                  value={settings.borderRadius ?? 8}
                  min={0}
                  onChange={(e) => handleSettingUpdate('borderRadius', parseInt(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>

              {/* Elevation */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.elevationEnabled || false}
                    onChange={(e) => handleSettingUpdate('elevationEnabled', e.target.checked)}
                  />
                  Elevation
                </label>
                {settings.elevationEnabled && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af' }}>Shadow intensity</label>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{settings.elevation ?? 4}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={settings.elevation ?? 4}
                      onChange={(e) => handleSettingUpdate('elevation', parseInt(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Image Settings */}
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showImage !== false}
                    onChange={(e) => handleSettingUpdate('showImage', e.target.checked)}
                  />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Show</span>
                </label>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Image URL</label>
                <input
                  type="text"
                  value={settings.image?.src || ''}
                  onChange={(e) => handleSettingUpdate('image', { ...settings.image, src: e.target.value })}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Image Fit</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'contain', label: 'Fit' },
                    { id: 'cover', label: 'Fill' },
                    { id: 'fill', label: 'Stretch' }
                  ].map(fit => {
                    const isActive = (settings.image?.objectFit || 'cover') === fit.id;
                    return (
                      <button
                        key={fit.id}
                        onClick={() => handleSettingUpdate('image', { ...settings.image, objectFit: fit.id })}
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
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Image Border Radius</label>
                <input
                  type="text"
                  value={settings.image?.borderRadius || ''}
                  onChange={(e) => handleSettingUpdate('image', { ...settings.image, borderRadius: e.target.value })}
                  placeholder="4px"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Image Size</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Width</label>
                    <input
                      type="text"
                      value={settings.image?.width || ''}
                      onChange={(e) => handleSettingUpdate('image', { ...settings.image, width: e.target.value || undefined })}
                      placeholder="100%"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Height</label>
                    <input
                      type="text"
                      value={settings.image?.height || ''}
                      onChange={(e) => handleSettingUpdate('image', { ...settings.image, height: e.target.value || undefined })}
                      placeholder="200px"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  e.g. 100%, 300px, auto
                </div>
              </div>
            </div>

            {/* Text Settings */}
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Text</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showText !== false}
                    onChange={(e) => handleSettingUpdate('showText', e.target.checked)}
                  />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Show</span>
                </label>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Content</label>
                <textarea
                  value={settings.text?.content || ''}
                  onChange={(e) => handleSettingUpdate('text', { ...settings.text, content: e.target.value })}
                  style={{
                    ...inputStyle,
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Text style</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { id: 'heading1', label: 'Heading 1' },
                    { id: 'heading2', label: 'Heading 2' },
                    { id: 'body', label: 'Body' },
                    { id: 'label', label: 'Label' }
                  ].map(role => {
                    const preview = state.page.styles.fonts[role.id];
                    const isActive = settings.text?.textRole === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleSettingUpdate('text', { ...settings.text, textRole: role.id })}
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

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Alignment</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'left', label: 'Left', icon: '◄' },
                    { id: 'center', label: 'Center', icon: '═' },
                    { id: 'right', label: 'Right', icon: '►' }
                  ].map(alignment => {
                    const isActive = (settings.text?.textAlign || 'left') === alignment.id;
                    return (
                      <button
                        key={alignment.id}
                        onClick={() => handleSettingUpdate('text', { ...settings.text, textAlign: alignment.id })}
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

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Text color</label>
                <ColorSlotPicker
                  slot={settings.text?.colorSlot ?? null}
                  customColor={settings.text?.color}
                  colors={state.page.styles.colors || {}}
                  onSlotChange={(slot, color) => {
                    handleSettingUpdate('text', { ...settings.text, colorSlot: slot, color });
                  }}
                  onCustomColorChange={(color) => handleSettingUpdate('text', { ...settings.text, color })}
                />
              </div>
            </div>

            {/* Button Settings */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Button</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showButton !== false}
                    onChange={(e) => handleSettingUpdate('showButton', e.target.checked)}
                  />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Show</span>
                </label>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Label</label>
                <input
                  type="text"
                  value={settings.button?.label || ''}
                  onChange={(e) => handleSettingUpdate('button', { ...settings.button, label: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Button style</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.page.styles.buttonStyles.map(btnStyle => {
                    const isActive = settings.button?.assignedStyleId === btnStyle.id;
                    const isOutline = btnStyle.bgColor === 'transparent';
                    return (
                      <button
                        key={btnStyle.id}
                        onClick={() => handleSettingUpdate('button', { ...settings.button, assignedStyleId: btnStyle.id })}
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

              {/* Icon section */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Icon</label>
                {/* Position toggle */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {['none', 'before', 'after'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => handleSettingUpdate('button', { 
                        ...settings.button, 
                        icon: { ...settings.button.icon, position: pos, key: pos === 'none' ? null : settings.button.icon?.key }
                      })}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        border: '1px solid',
                        borderColor: settings.button.icon?.position === pos ? '#3b82f6' : '#4b5563',
                        borderRadius: 4,
                        background: settings.button.icon?.position === pos ? '#1d4ed8' : '#374151',
                        color: settings.button.icon?.position === pos ? '#93c5fd' : '#9ca3af',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      {pos === 'none' ? 'None' : pos === 'before' ? 'Before' : 'After'}
                    </button>
                  ))}
                </div>
                {/* Icon grid — only when position is not 'none' */}
                {settings.button.icon?.position !== 'none' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                    {BUTTON_ICONS.map(({ key: iconKey, label, svg }) => (
                      <button
                        key={iconKey}
                        title={label}
                        onClick={() => handleSettingUpdate('button', { 
                          ...settings.button, 
                          icon: { ...settings.button.icon, key: iconKey }
                        })}
                        style={{
                          padding: 6,
                          border: '1px solid',
                          borderColor: settings.button.icon?.key === iconKey ? '#3b82f6' : '#4b5563',
                          borderRadius: 4,
                          background: settings.button.icon?.key === iconKey ? '#1d4ed8' : '#374151',
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
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Size Override</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.button.sizeOverride?.enabled || false}
                      onChange={e => handleSettingUpdate('button', { 
                        ...settings.button, 
                        sizeOverride: { ...settings.button.sizeOverride, enabled: e.target.checked }
                      })}
                    />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Enable</span>
                  </label>
                </div>
                {settings.button.sizeOverride?.enabled && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...labelStyle, fontSize: 11 }}>Width</label>
                      <input
                        type="text"
                        value={settings.button.sizeOverride.width}
                        onChange={e => handleSettingUpdate('button', { 
                          ...settings.button, 
                          sizeOverride: { ...settings.button.sizeOverride, width: e.target.value }
                        })}
                        placeholder="auto"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...labelStyle, fontSize: 11 }}>Height</label>
                      <input
                        type="text"
                        value={settings.button.sizeOverride.height}
                        onChange={e => handleSettingUpdate('button', { 
                          ...settings.button, 
                          sizeOverride: { ...settings.button.sizeOverride, height: e.target.value }
                        })}
                        placeholder="auto"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Size ── */}
      {content.type !== CONTENT_TYPES.CARD && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
          <label style={{ ...labelStyle, marginBottom: '8px' }}>Size</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Width</label>
              <input
                type="text"
                value={content.settings.customOverrides?.width || ''}
                onChange={(e) => handleCustomUpdate('width', e.target.value || undefined)}
                placeholder="auto"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Height</label>
              <input
                type="text"
                value={content.settings.customOverrides?.height || ''}
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
      )}

      {/* ── Visibility ── */}
      <MobileOverrideWrap hasOverride={hasOverride('hidden')} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151', marginBottom: 0 }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibility</label>
        {(() => {
          const responsive = content.settings.responsive || {};
          const handleResponsiveUpdate = (key, value) => {
            dispatch(pageActions.updateElement(content.id, {
              settings: { ...content.settings, responsive: { ...responsive, [key]: value } }
            }));
          };
          const bothHidden = responsive.hideOnMobile && responsive.hideOnDesktop;
          return (
            <>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '6px' }}>
                <input
                  type="checkbox"
                  checked={isMobile ? !(getSetting('hidden', false)) : !(content.settings.hidden || false)}
                  onChange={(e) => handleSettingUpdate('hidden', !e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Visible{isMobile ? ' on mobile' : ''}
                <MobileOverrideDot hasOverride={hasOverride('hidden')} onClear={() => clearOverride('hidden')} />
              </label>
              {isMobile && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', marginLeft: '24px' }}>
                  Overrides desktop visibility on mobile
                </div>
              )}
              {!isMobile && (
                <>
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={responsive.hideOnMobile || false}
                        onChange={(e) => handleResponsiveUpdate('hideOnMobile', e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      Hide on mobile
                    </label>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={responsive.hideOnDesktop || false}
                        onChange={(e) => handleResponsiveUpdate('hideOnDesktop', e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      Hide on desktop
                    </label>
                  </div>
                  {bothHidden && (
                    <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                      Warning: hidden on both mobile and desktop.
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}
      </MobileOverrideWrap>
    </div>
  );
}
