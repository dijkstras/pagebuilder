import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';

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

  if (!segment) return null;

  const handleUpdate = (key, value) => {
    const updates = {
      settings: { ...segment.settings, [key]: value }
    };
    dispatch(pageActions.updateElement(segment.id, updates));
  };

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Segment: {segment.name}</h3>

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
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Color</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={segment.settings.bgColor}
            onChange={(e) => handleUpdate('bgColor', e.target.value)}
            style={{ width: '40px', height: '40px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={segment.settings.bgColor}
            onChange={(e) => handleUpdate('bgColor', e.target.value)}
            style={{
              flex: 1,
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
    </div>
  );
}
