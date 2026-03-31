import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';

export function PageSettings() {
  const { state, dispatch } = usePageStore();
  const { page } = state;

  const handleTitleChange = (e) => {
    dispatch(pageActions.updatePageSettings({ title: e.target.value }));
  };

  const handleColorChange = (colorKey, value) => {
    const newColors = { ...page.styles.colors, [colorKey]: value };
    dispatch(pageActions.updatePageStyles({ colors: newColors }));
  };

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Page Title</h3>
      <input
        type="text"
        value={page.title}
        onChange={handleTitleChange}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: '#374151',
          color: '#f3f4f6',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          marginBottom: '16px',
          boxSizing: 'border-box'
        }}
      />

      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>Colors</h3>
      {Object.entries(page.styles.colors).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>
            {key}
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={value}
              onChange={(e) => handleColorChange(key, e.target.value)}
              style={{ width: '40px', height: '40px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleColorChange(key, e.target.value)}
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
      ))}
    </div>
  );
}
