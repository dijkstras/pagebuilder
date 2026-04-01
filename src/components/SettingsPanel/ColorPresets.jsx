import React from 'react';

const PRESET_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  text: 'Text',
  background: 'Background',
  neutral: 'Neutral'
};

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
