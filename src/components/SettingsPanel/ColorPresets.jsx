import React from 'react';

const PRESET_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  text: 'Text',
  background: 'Background',
  neutral: 'Neutral',
  card: 'Card'
};

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

export function resolveSlotColor(slot, colors, fallback) {
  if (!slot || slot === 'custom') return fallback;
  if (slot === 'transparent') return 'transparent';
  return colors[slot] || fallback;
}

const SLOT_ORDER = ['primary', 'secondary', 'text', 'background', 'accent', 'neutral', 'card'];

export function ColorSlotPicker({ slot, customColor, colors, onSlotChange, onCustomColorChange }) {
  const paletteKeys = SLOT_ORDER.filter(k => k in colors);
  const emit = (key) => onSlotChange(key, resolveSlotColor(key, colors, customColor));
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', padding: '4px' }}>
        {paletteKeys.map(key => {
          const isActive = slot === key;
          return (
            <button
              key={key}
              onClick={() => emit(key)}
              title={PRESET_LABELS[key] || key}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                backgroundColor: colors[key],
                border: isActive ? '2px solid #ffffff' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0
              }}
            />
          );
        })}
        <button
          onClick={() => emit('transparent')}
          title="Transparent"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            background: 'repeating-conic-gradient(#9ca3af 0% 25%, #374151 0% 50%) 0 0 / 8px 8px',
            border: slot === 'transparent' ? '2px solid #ffffff' : '2px solid transparent',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', fontSize: '14px', fontWeight: 700, lineHeight: 1
          }}>×</span>
        </button>
        <button
          onClick={() => emit('custom')}
          title="Custom color"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
            border: slot === 'custom' ? '2px solid #ffffff' : '2px solid transparent',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0
          }}
        />
      </div>
      {slot === 'custom' && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
          <input
            type="color"
            value={customColor || '#000000'}
            onChange={(e) => onCustomColorChange(e.target.value)}
            style={{ width: '36px', height: '36px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #4b5563', padding: '2px', backgroundColor: '#374151', flexShrink: 0 }}
          />
          <input
            type="text"
            value={customColor || ''}
            onChange={(e) => onCustomColorChange(e.target.value)}
            style={{ flex: 1, ...inputStyle }}
          />
        </div>
      )}
    </div>
  );
}

export function ColorPresets({ colors, onSelectColor }) {
  return (
    <div style={{
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px solid #4b5563',
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    }}>
      {Object.entries(colors).map(([key, value]) => (
        <button
          key={key}
          onClick={() => onSelectColor(value)}
          title={PRESET_LABELS[key] || key}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            backgroundColor: value,
            border: '1.5px solid #4b5563',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            transition: 'transform 0.1s',
            opacity: 0.9
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.opacity = '1';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.opacity = '0.9';
          }}
        />
      ))}
    </div>
  );
}
