import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
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

export function SegmentSettings() {
  const { state, dispatch } = usePageStore();
  const segment = findElement(state.page, state.selectedElementId);
  const [spacingInput, setSpacingInput] = React.useState('');
  const isEditingRef = React.useRef(false);

  React.useEffect(() => {
    if (segment && !isEditingRef.current) {
      const currentValue = segment.settings.gutter === 'auto' ? 'auto' : segment.settings.gutter?.toString() ?? '24';
      setSpacingInput(currentValue);
    }
  }, [segment?.settings.gutter]);

  if (!segment) return null;

  const handleUpdate = (key, value) => {
    const updates = {
      settings: { ...segment.settings, [key]: value }
    };
    dispatch(pageActions.updateElement(segment.id, updates));
  };

  const colors = state.page.styles.colors || {};

  return (
    <div>
      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
        <input
          type="text"
          value={segment.name || ''}
          onChange={(e) => dispatch(pageActions.updateElement(segment.id, { name: e.target.value }))}
          placeholder="Segment name…"
          style={{ width: '100%', padding: '7px 10px', backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Layout Direction</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'row', label: '→', title: 'Horizontal (left to right)' },
            { value: 'column', label: '↓', title: 'Vertical (top to bottom)' }
          ].map(({ value, label, title }) => (
            <button
              key={value}
              title={title}
              onClick={() => handleUpdate('direction', value)}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '16px',
                backgroundColor: (segment.settings.direction ?? 'row') === value ? '#3b82f6' : '#374151',
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

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Alignment</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↔</span>
            {[{ v: 'left', l: '←' }, { v: 'center', l: '—' }, { v: 'right', l: '→' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('contentAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (segment.settings.contentAlignment ?? 'left') === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↕</span>
            {[{ v: 'top', l: '↑' }, { v: 'center', l: '—' }, { v: 'bottom', l: '↓' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('verticalAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (segment.settings.verticalAlignment ?? 'top') === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Spacing</label>
        <input
          type="text"
          value={spacingInput}
          onChange={(e) => {
            const value = e.target.value;
            isEditingRef.current = true;
            setSpacingInput(value);
            
            const trimmedValue = value.trim();
            if (trimmedValue.toLowerCase() === 'auto') {
              handleUpdate('gutter', 'auto');
              isEditingRef.current = false;
            } else if (trimmedValue === '') {
              // Don't reset immediately, allow user to type
              // Only reset on blur if still empty
            } else {
              // Allow numbers with optional % or px suffix
              const numericMatch = trimmedValue.match(/^(\d+(?:\.\d+)?)\s*(px|%)?$/i);
              if (numericMatch) {
                const numValue = parseFloat(numericMatch[1]);
                if (numValue >= 0) {
                  handleUpdate('gutter', numValue);
                }
              }
              isEditingRef.current = false;
            }
          }}
          onBlur={() => {
            isEditingRef.current = false;
            // If field is empty when losing focus, reset to default
            if (spacingInput.trim() === '') {
              handleUpdate('gutter', 24);
              setSpacingInput('24');
            } else {
              // Sync with actual value when losing focus
              if (segment) {
                const currentValue = segment.settings.gutter === 'auto' ? 'auto' : segment.settings.gutter?.toString() ?? '24';
                setSpacingInput(currentValue);
              }
            }
          }}
          placeholder="24px or auto"
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
          Enter pixel value (e.g. 24), percentage (e.g. 10%), or "auto" to distribute evenly
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={segment.settings.scrollEnabled || false}
            onChange={(e) => handleUpdate('scrollEnabled', e.target.checked)}
          />
          <span>Scroll</span>
        </label>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Enable scrolling when content overflows the segment bounds
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background</label>
        <GradientPicker
          bgType={segment.settings.bgType || 'solid'}
          bgColor={segment.settings.bgColor}
          bgGradient={segment.settings.bgGradient}
          onUpdate={handleUpdate}
          colors={colors}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Padding (px)</label>
        <input
          type="number"
          value={segment.settings.padding}
          onChange={(e) => handleUpdate('padding', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Margin (px)</label>
        <input
          type="number"
          value={segment.settings.margin}
          onChange={(e) => handleUpdate('margin', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Min Height (px)</label>
        <input
          type="number"
          value={segment.settings.minHeight ?? 200}
          onChange={(e) => handleUpdate('minHeight', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Height (px)</label>
        <input
          type="number"
          value={segment.settings.maxHeight || ''}
          onChange={(e) => handleUpdate('maxHeight', e.target.value ? parseInt(e.target.value) : null)}
          placeholder="No limit"
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Image URL</label>
        <input
          type="text"
          value={segment.settings.bgImage || ''}
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
          value={segment.settings.bgVideo || ''}
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

      {segment.settings.bgVideo && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Video Fit</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { value: 'contain', label: 'Fit' },
              { value: 'cover', label: 'Fill' },
              { value: 'stretch', label: 'Stretch' }
            ].map(fit => {
              const bgVideoSize = segment.settings.bgVideoSize || 'fill';
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
            Fit: maintain aspect ratio • Fill: crop to fit • Stretch: ignore aspect ratio
          </div>
        </div>
      )}

      {segment.settings.bgImage && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Fit</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'contain', label: 'Fit' },
                { value: 'cover', label: 'Fill' },
                { value: 'custom', label: 'Size' }
              ].map(fit => {
                const bgSize = segment.settings.bgSize || 'cover';
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

          {segment.settings.bgSize && segment.settings.bgSize !== 'contain' && segment.settings.bgSize !== 'cover' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Size</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width</label>
                  <input
                    type="text"
                    placeholder="200px"
                    value={(segment.settings.bgSize || '').split(' ')[0] || ''}
                    onChange={(e) => {
                      const height = (segment.settings.bgSize || '').split(' ')[1] || '200px';
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
                    value={(segment.settings.bgSize || '').split(' ')[1] || ''}
                    onChange={(e) => {
                      const width = (segment.settings.bgSize || '').split(' ')[0] || '200px';
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
                <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↔</span>
                {[{ v: 'left', l: '←' }, { v: 'center', l: '—' }, { v: 'right', l: '→' }].map(({ v, l }) => (
                  <button key={v} onClick={() => handleUpdate('bgPositionX', v)} style={{
                    flex: 1, height: '28px', fontSize: '13px',
                    backgroundColor: (segment.settings.bgPositionX ?? 'left') === v ? '#3b82f6' : '#374151',
                    color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
                  }}>{l}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↕</span>
                {[{ v: 'top', l: '↑' }, { v: 'center', l: '—' }, { v: 'bottom', l: '↓' }].map(({ v, l }) => (
                  <button key={v} onClick={() => handleUpdate('bgPositionY', v)} style={{
                    flex: 1, height: '28px', fontSize: '13px',
                    backgroundColor: (segment.settings.bgPositionY ?? 'top') === v ? '#3b82f6' : '#374151',
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
                checked={segment.settings.bgRepeat || false}
                onChange={(e) => handleUpdate('bgRepeat', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Repeat background
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Opacity</label>
            <input
              type="text"
              value={segment.settings.bgOpacity || ''}
              onChange={(e) => handleUpdate('bgOpacity', e.target.value)}
              placeholder="100%"
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
              Enter value like: 0.5, 50%, 80%
            </div>
          </div>
        </>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Corner Radius (px)</label>
        <input
          type="number"
          value={segment.settings.borderRadius ?? 0}
          min={0}
          onChange={(e) => handleUpdate('borderRadius', parseInt(e.target.value) || 0)}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={segment.settings.borderEnabled || false}
            onChange={(e) => handleUpdate('borderEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Border
        </label>
        {segment.settings.borderEnabled && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width (px)</label>
              <input
                type="number"
                value={segment.settings.borderWidth ?? 1}
                min={1}
                onChange={(e) => handleUpdate('borderWidth', parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: '#374151',
                  color: '#f3f4f6',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Color</label>
              <input
                type="text"
                value={segment.settings.borderColor ?? '#000000'}
                onChange={(e) => handleUpdate('borderColor', e.target.value)}
                placeholder="#000000"
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
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={segment.settings.elevationEnabled || false}
            onChange={(e) => handleUpdate('elevationEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Elevation
        </label>
        {segment.settings.elevationEnabled && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af' }}>Shadow intensity</label>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{segment.settings.elevation ?? 4}</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={segment.settings.elevation ?? 4}
              onChange={(e) => handleUpdate('elevation', parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
