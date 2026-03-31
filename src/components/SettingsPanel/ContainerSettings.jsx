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

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Container: {container.name}</h3>

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
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Column Span (of 12)</label>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
            <button
              key={n}
              onClick={() => handleUpdate('columnSpan', n)}
              style={{
                width: '22px',
                height: '22px',
                fontSize: '11px',
                backgroundColor: (container.settings.columnSpan ?? 12) === n ? '#3b82f6' : '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '3px',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
          {Math.round((container.settings.columnSpan ?? 12) / 12 * 100)}% of row width
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Children Gap (px)</label>
        <input
          type="number"
          value={container.settings.spacing}
          onChange={(e) => handleUpdate('spacing', parseInt(e.target.value))}
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
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Color</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={container.settings.bgColor || 'transparent'}
            onChange={(e) => handleUpdate('bgColor', e.target.value)}
            style={{ width: '40px', height: '40px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={container.settings.bgColor || ''}
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
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Content Alignment</label>
        <select
          value={container.settings.contentAlignment}
          onChange={(e) => handleUpdate('contentAlignment', e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}
