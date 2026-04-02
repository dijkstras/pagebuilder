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

export function ContainerSettings() {
  const { state, dispatch } = usePageStore();
  const container = findElement(state.page, state.selectedElementId);

  if (!container) return null;

  const handleUpdate = (key, value) => {
    const updates = {
      settings: { ...container.settings, [key]: value }
    };
    dispatch(pageActions.updateElement(container.id, updates));
  };

  const colors = state.page.styles.colors || {};

  return (
    <div>
      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
        <input
          type="text"
          value={container.name || ''}
          onChange={(e) => dispatch(pageActions.updateElement(container.id, { name: e.target.value }))}
          placeholder="Container name…"
          style={{ width: '100%', padding: '7px 10px', backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Layout Direction</label>
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
                backgroundColor: (container.settings.direction ?? 'column') === value ? '#3b82f6' : '#374151',
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
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Size</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width</label>
            <input
              type="text"
              value={container.settings.width || ''}
              onChange={(e) => handleUpdate('width', e.target.value || undefined)}
              placeholder="auto"
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
              value={container.settings.height || ''}
              onChange={(e) => handleUpdate('height', e.target.value || undefined)}
              placeholder="auto"
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
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>e.g. 200px, 50%, 100%</div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background</label>
        <GradientPicker
          bgType={container.settings.bgType || 'solid'}
          bgColor={container.settings.bgColor}
          bgGradient={container.settings.bgGradient}
          onUpdate={handleUpdate}
          colors={colors}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Image URL</label>
        <input
          type="text"
          value={container.settings.bgImage || ''}
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
          value={container.settings.bgVideo || ''}
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

      {container.settings.bgImage && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Fit</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'contain', label: 'Fit' },
                { value: 'cover', label: 'Fill' },
                { value: 'custom', label: 'Size' }
              ].map(fit => {
                const bgSize = container.settings.bgSize || 'cover';
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

          {container.settings.bgSize && container.settings.bgSize !== 'contain' && container.settings.bgSize !== 'cover' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Size</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width</label>
                  <input
                    type="text"
                    placeholder="200px"
                    value={(container.settings.bgSize || '').split(' ')[0] || ''}
                    onChange={(e) => {
                      const height = (container.settings.bgSize || '').split(' ')[1] || '200px';
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
                    value={(container.settings.bgSize || '').split(' ')[1] || ''}
                    onChange={(e) => {
                      const width = (container.settings.bgSize || '').split(' ')[0] || '200px';
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
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={container.settings.bgRepeat || false}
                onChange={(e) => handleUpdate('bgRepeat', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Repeat background
            </label>
          </div>
        </>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Padding (px)</label>
        <input
          type="number"
          value={container.settings.padding}
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
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Alignment</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↔</span>
            {[{ v: 'left', l: '←' }, { v: 'center', l: '—' }, { v: 'right', l: '→' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('contentAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (container.settings.contentAlignment ?? 'left') === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↕</span>
            {[{ v: 'top', l: '↑' }, { v: 'center', l: '—' }, { v: 'bottom', l: '↓' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('verticalAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (container.settings.verticalAlignment ?? 'top') === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Corner Radius (px)</label>
        <input
          type="number"
          value={container.settings.borderRadius ?? 0}
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
            checked={container.settings.borderEnabled || false}
            onChange={(e) => handleUpdate('borderEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Border
        </label>
        {container.settings.borderEnabled && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width (px)</label>
              <input
                type="number"
                value={container.settings.borderWidth ?? 1}
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
                value={container.settings.borderColor ?? '#000000'}
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
            checked={container.settings.elevationEnabled || false}
            onChange={(e) => handleUpdate('elevationEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Elevation
        </label>
        {container.settings.elevationEnabled && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af' }}>Shadow intensity</label>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{container.settings.elevation ?? 4}</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={container.settings.elevation ?? 4}
              onChange={(e) => handleUpdate('elevation', parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
