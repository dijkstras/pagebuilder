import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { useMobileSettings, MobileOverrideIcon, MobileOverrideWrap } from './useMobileSettings.jsx';
import { GradientPicker } from './GradientPicker.jsx';

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

const MobileOverrideDot = MobileOverrideIcon;

export function SlotSettings() {
  const { state, dispatch } = usePageStore();
  const slot = findElement(state.page, state.selectedElementId);
  const [spacingInput, setSpacingInput] = React.useState('');
  const isEditingRef = React.useRef(false);

  const effectiveSpacing = slot ? (slot.settings.mobileOverrides?.spacing ?? slot.settings.spacing) : slot?.settings.spacing;

  React.useEffect(() => {
    if (slot && !isEditingRef.current) {
      const currentValue = effectiveSpacing === 'auto' ? 'auto' : effectiveSpacing?.toString() ?? '16';
      setSpacingInput(currentValue);
    }
  }, [effectiveSpacing]);

  if (!slot) return null;

  const { isMobile, getSetting, updateSetting, hasOverride, clearOverride } = useMobileSettings(slot);

  const handleUpdate = (key, value) => {
    if (isMobile) {
      updateSetting(key, value);
    } else {
      dispatch(pageActions.updateElement(slot.id, {
        settings: { ...slot.settings, [key]: value }
      }));
    }
  };

  const handleResponsiveUpdate = (key, value) => {
    dispatch(pageActions.updateElement(slot.id, {
      settings: { ...slot.settings, responsive: { ...(slot.settings.responsive || {}), [key]: value } }
    }));
  };

  const colors = state.page.styles.colors || {};
  const responsive = slot.settings.responsive || {};

  return (
    <div>

      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
        <input
          type="text"
          value={slot.name || ''}
          onChange={(e) => dispatch(pageActions.updateElement(slot.id, { name: e.target.value }))}
          placeholder="Slot name…"
          style={{ width: '100%', padding: '7px 10px', backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      <MobileOverrideWrap hasOverride={hasOverride('direction')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '6px' }}>Content Direction<MobileOverrideDot hasOverride={hasOverride('direction')} onClear={() => clearOverride('direction')} /></label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'column', label: '↓', title: 'Vertical (top to bottom)' },
            { value: 'row', label: '→', title: 'Horizontal (left to right)' }
          ].map(({ value, label, title }) => (
            <button
              key={value}
              title={title}
              onClick={() => handleUpdate('direction', value)}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '16px',
                backgroundColor: (getSetting('direction', 'column')) === value ? '#3b82f6' : '#374151',
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
      </MobileOverrideWrap>

      {getSetting('direction', 'column') === 'row' && (
        <MobileOverrideWrap hasOverride={hasOverride('overflow')}>
          <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '6px' }}>Overflow<MobileOverrideDot hasOverride={hasOverride('overflow')} onClear={() => clearOverride('overflow')} /></label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { value: 'wrap', label: 'Wrap' },
              { value: 'scroll', label: 'Scroll' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleUpdate('overflow', value)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '12px',
                  backgroundColor: (getSetting('overflow', 'wrap')) === value ? '#3b82f6' : '#374151',
                  color: '#f3f4f6',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Wrap: items wrap to next line. Scroll: horizontal scrollbar appears.
          </div>
        </MobileOverrideWrap>
      )}

      <MobileOverrideWrap hasOverride={hasOverride('contentAlignment') || hasOverride('verticalAlignment')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '6px' }}>Alignment<MobileOverrideDot hasOverride={hasOverride('contentAlignment') || hasOverride('verticalAlignment')} onClear={() => { clearOverride('contentAlignment'); clearOverride('verticalAlignment'); }} /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↔</span>
            {[{ v: 'left', l: '←' }, { v: 'center', l: '—' }, { v: 'right', l: '→' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('contentAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (getSetting('contentAlignment', 'left')) === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↕</span>
            {[{ v: 'top', l: '↑' }, { v: 'center', l: '—' }, { v: 'bottom', l: '↓' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('verticalAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (getSetting('verticalAlignment', 'top')) === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
        </div>
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('spacing')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '6px' }}>Content Spacing<MobileOverrideDot hasOverride={hasOverride('spacing')} onClear={() => clearOverride('spacing')} /></label>
        <input
          type="text"
          value={spacingInput}
          onChange={(e) => {
            const value = e.target.value;
            isEditingRef.current = true;
            setSpacingInput(value);
            const trimmedValue = value.trim();
            if (trimmedValue.toLowerCase() === 'auto') {
              handleUpdate('spacing', 'auto');
              isEditingRef.current = false;
            } else if (trimmedValue !== '') {
              const numericMatch = trimmedValue.match(/^(\d+(?:\.\d+)?)\s*(px|%)?$/i);
              if (numericMatch) {
                const numValue = parseFloat(numericMatch[1]);
                if (numValue >= 0) handleUpdate('spacing', numValue);
              }
              isEditingRef.current = false;
            }
          }}
          onBlur={() => {
            isEditingRef.current = false;
            if (spacingInput.trim() === '') {
              handleUpdate('spacing', 16);
              setSpacingInput('16');
            } else if (slot) {
              const currentValue = effectiveSpacing === 'auto' ? 'auto' : effectiveSpacing?.toString() ?? '16';
              setSpacingInput(currentValue);
            }
          }}
          placeholder="16px or auto"
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Gap between items inside this slot
        </div>
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('height')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>Min Height<MobileOverrideDot hasOverride={hasOverride('height')} onClear={() => clearOverride('height')} /></label>
        <input
          type="text"
          value={(() => { const h = getSetting('height', 'auto'); return (h && h !== 'auto') ? h : ''; })()}
          onChange={(e) => handleUpdate('height', e.target.value || 'auto')}
          placeholder="auto"
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>e.g. 200px, 50%, auto</div>
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('bgColor') || hasOverride('bgType') || hasOverride('bgGradient')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '6px' }}>Background<MobileOverrideDot hasOverride={hasOverride('bgColor') || hasOverride('bgType') || hasOverride('bgGradient')} onClear={() => { clearOverride('bgColor'); clearOverride('bgType'); clearOverride('bgGradient'); }} /></label>
        <GradientPicker
          bgType={getSetting('bgType', 'solid')}
          bgColor={getSetting('bgColor', slot.settings.bgColor)}
          bgGradient={getSetting('bgGradient', slot.settings.bgGradient)}
          onUpdate={handleUpdate}
          colors={colors}
        />
      </MobileOverrideWrap>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Image URL</label>
        <input
          type="text"
          value={slot.settings.bgImage || ''}
          onChange={(e) => handleUpdate('bgImage', e.target.value || null)}
          placeholder="https://..."
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            fontSize: '12px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Video URL</label>
        <input
          type="text"
          value={slot.settings.bgVideo || ''}
          onChange={(e) => handleUpdate('bgVideo', e.target.value || null)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            fontSize: '12px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Plays muted in background. Paste a YouTube URL.
        </div>
      </div>

      {slot.settings.bgVideo && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Video Fit</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { value: 'contain', label: 'Fit' },
              { value: 'cover', label: 'Fill' },
              { value: 'stretch', label: 'Stretch' }
            ].map(fit => {
              const bgVideoSize = slot.settings.bgVideoSize || 'fill';
              const isActive = (fit.value === 'stretch' ? '100% 100%' : (fit.value === 'cover' ? 'fill' : fit.value)) === bgVideoSize;
              return (
                <button
                  key={fit.value}
                  onClick={() => {
                    handleUpdate('bgVideoSize', fit.value === 'stretch' ? '100% 100%' : (fit.value === 'cover' ? 'fill' : fit.value));
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '12px',
                    backgroundColor: isActive ? '#3b82f6' : '#374151',
                    color: isActive ? '#93c5fd' : '#9ca3af',
                    border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: isActive ? '600' : '400'
                  }}
                >
                  {fit.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Fit: maintain aspect ratio, Fill: crop to fit, Stretch: ignore aspect ratio
          </div>
        </div>
      )}

      {slot.settings.bgImage && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Fit</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'contain', label: 'Fit' },
                { value: 'cover', label: 'Fill' },
                { value: 'custom', label: 'Size' }
              ].map(fit => {
                const bgSize = slot.settings.bgSize || 'cover';
                const isActive = fit.value === 'custom' ? bgSize !== 'contain' && bgSize !== 'cover' : bgSize === fit.value;
                return (
                  <button
                    key={fit.value}
                    onClick={() => {
                      if (fit.value === 'custom') {
                        handleUpdate('bgSize', '200px 200px');
                      } else {
                        handleUpdate('bgSize', fit.value);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '12px',
                      backgroundColor: isActive ? '#3b82f6' : '#374151',
                      color: isActive ? '#93c5fd' : '#9ca3af',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: isActive ? '600' : '400'
                    }}
                  >
                    {fit.label}
                  </button>
                );
              })}
            </div>
          </div>

          {slot.settings.bgSize && slot.settings.bgSize !== 'contain' && slot.settings.bgSize !== 'cover' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Size</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width</label>
                  <input
                    type="text"
                    placeholder="200px"
                    value={(slot.settings.bgSize || '').split(' ')[0] || ''}
                    onChange={(e) => {
                      const height = (slot.settings.bgSize || '').split(' ')[1] || '200px';
                      handleUpdate('bgSize', `${e.target.value || '200px'} ${height}`);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#374151',
                      color: '#f3f4f6',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Height</label>
                  <input
                    type="text"
                    placeholder="200px"
                    value={(slot.settings.bgSize || '').split(' ')[1] || ''}
                    onChange={(e) => {
                      const width = (slot.settings.bgSize || '').split(' ')[0] || '200px';
                      handleUpdate('bgSize', `${width} ${e.target.value || '200px'}`);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#374151',
                      color: '#f3f4f6',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                e.g. 200px, 50%, auto
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Alignment</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>leftrightarrow;</span>
                {[{ v: 'left', l: 'leftarrow;' }, { v: 'center', l: 'mdash;' }, { v: 'right', l: 'rightarrow;' }].map(({ v, l }) => (
                  <button key={v} onClick={() => handleUpdate('bgPositionX', v)} style={{
                    flex: 1, height: '28px', fontSize: '13px',
                    backgroundColor: (slot.settings.bgPositionX ?? 'left') === v ? '#3b82f6' : '#374151',
                    color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
                  }}>{l}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>updownarrow;</span>
                {[{ v: 'top', l: 'uparrow;' }, { v: 'center', l: 'mdash;' }, { v: 'bottom', l: 'downarrow;' }].map(({ v, l }) => (
                  <button key={v} onClick={() => handleUpdate('bgPositionY', v)} style={{
                    flex: 1, height: '28px', fontSize: '13px',
                    backgroundColor: (slot.settings.bgPositionY ?? 'top') === v ? '#3b82f6' : '#374151',
                    color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={slot.settings.bgRepeat || false}
                onChange={(e) => handleUpdate('bgRepeat', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Repeat background
            </label>
          </div>
        </>
      )}

      <MobileOverrideWrap hasOverride={hasOverride('padding')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>Padding (px)<MobileOverrideDot hasOverride={hasOverride('padding')} onClear={() => clearOverride('padding')} /></label>
        <input
          type="number"
          value={getSetting('padding', 0)}
          onChange={(e) => handleUpdate('padding', parseInt(e.target.value))}
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', boxSizing: 'border-box'
          }}
        />
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('borderRadius')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>Corner Radius (px)<MobileOverrideDot hasOverride={hasOverride('borderRadius')} onClear={() => clearOverride('borderRadius')} /></label>
        <input
          type="number"
          value={getSetting('borderRadius', 0)}
          min={0}
          onChange={(e) => handleUpdate('borderRadius', parseInt(e.target.value) || 0)}
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', boxSizing: 'border-box'
          }}
        />
      </MobileOverrideWrap>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={slot.settings.borderEnabled || false}
            onChange={(e) => handleUpdate('borderEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Border
        </label>
        {slot.settings.borderEnabled && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width (px)</label>
              <input
                type="number"
                value={slot.settings.borderWidth ?? 1}
                min={1}
                onChange={(e) => handleUpdate('borderWidth', parseInt(e.target.value) || 1)}
                style={{
                  width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
                  border: '1px solid #4b5563', borderRadius: '4px', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Color</label>
              <input
                type="text"
                value={slot.settings.borderColor ?? '#000000'}
                onChange={(e) => handleUpdate('borderColor', e.target.value)}
                placeholder="#000000"
                style={{
                  width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
                  border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={slot.settings.elevationEnabled || false}
            onChange={(e) => handleUpdate('elevationEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Elevation
        </label>
        {slot.settings.elevationEnabled && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af' }}>Shadow intensity</label>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{slot.settings.elevation ?? 4}</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={slot.settings.elevation ?? 4}
              onChange={(e) => handleUpdate('elevation', parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* Visibility */}
      <MobileOverrideWrap hasOverride={hasOverride('hidden')} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151', marginBottom: 0 }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibility</label>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isMobile ? !(getSetting('hidden', false)) : !(slot.settings.hidden || false)}
            onChange={(e) => handleUpdate('hidden', !e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Visible{isMobile ? ' on mobile' : ''}
          <MobileOverrideDot hasOverride={hasOverride('hidden')} onClear={() => clearOverride('hidden')} />
        </label>
        {isMobile && (
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', marginLeft: '24px' }}>
            Overrides desktop visibility on mobile
          </div>
        )}
      </MobileOverrideWrap>

      {/* Responsive Section */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsive</label>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={responsive.hideOnMobile || false}
              onChange={(e) => handleResponsiveUpdate('hideOnMobile', e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Hide on mobile
          </label>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', marginLeft: '24px' }}>
            Hidden below 768px
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Mobile order</label>
          <input
            type="number"
            value={responsive.mobileOrder ?? ''}
            onChange={(e) => handleResponsiveUpdate('mobileOrder', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="auto"
            min={1}
            style={{
              width: '80px', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
              border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
            }}
          />
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            Override stacking order on mobile
          </div>
        </div>
      </div>
    </div>
  );
}
