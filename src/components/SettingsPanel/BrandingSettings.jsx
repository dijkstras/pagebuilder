import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Playfair Display', 'Merriweather', 'Georgia', 'Times New Roman',
  'Source Sans Pro', 'Nunito', 'Raleway'
];

const FONT_WEIGHTS = [
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semi-bold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Extra bold', value: 800 }
];

const SHAPE_PRESETS = [
  { label: 'Sharp', value: 0 },
  { label: 'Rounded', value: 6 },
  { label: 'Pill', value: 999 }
];

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

const sectionHeadingStyle = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6b7280',
  marginBottom: '12px',
  marginTop: '4px'
};

function Divider() {
  return <div style={{ borderTop: '1px solid #1f2937', margin: '20px 0' }} />;
}

// ─── Typography ────────────────────────────────────────────────────────────────

const TYPOGRAPHY_STYLES = [
  { key: 'heading1', label: 'Heading 1', previewText: 'The quick brown fox' },
  { key: 'heading2', label: 'Heading 2', previewText: 'The quick brown fox' },
  { key: 'body', label: 'Body', previewText: 'The quick brown fox jumps over the lazy dog.' },
  { key: 'label', label: 'Label', previewText: 'Label text' }
];

function TypographySettings() {
  const { state, dispatch } = usePageStore();
  const { fonts } = state.page.styles;

  const handleFontChange = (role, key, value) => {
    const newFonts = { ...fonts, [role]: { ...fonts[role], [key]: value } };
    dispatch(pageActions.updatePageStyles({ fonts: newFonts }));
  };

  return (
    <div>
      {TYPOGRAPHY_STYLES.map((style, index) => (
        <div key={style.key}>
          <p style={sectionHeadingStyle}>{style.label}</p>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Font family</label>
            <select
              value={FONT_FAMILIES.includes(fonts[style.key].family) ? fonts[style.key].family : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') handleFontChange(style.key, 'family', e.target.value);
              }}
              style={inputStyle}
            >
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              {!FONT_FAMILIES.includes(fonts[style.key].family) && (
                <option value="custom">{fonts[style.key].family} (custom)</option>
              )}
            </select>
          </div>

          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Size (px)</label>
              <input
                type="number"
                value={fonts[style.key].size}
                onChange={(e) => handleFontChange(style.key, 'size', parseInt(e.target.value) || 0)}
                min="8"
                max="96"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Weight</label>
              <select
                value={fonts[style.key].weight}
                onChange={(e) => handleFontChange(style.key, 'weight', parseInt(e.target.value))}
                style={inputStyle}
              >
                {FONT_WEIGHTS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live preview */}
          <div style={{
            marginTop: '10px',
            padding: '10px 12px',
            backgroundColor: '#1f2937',
            borderRadius: '6px',
            fontFamily: fonts[style.key].family,
            fontWeight: fonts[style.key].weight,
            fontSize: `${fonts[style.key].size}px`,
            color: '#f3f4f6'
          }}>
            {style.previewText}
          </div>

          {index < TYPOGRAPHY_STYLES.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  );
}

// ─── Colors ────────────────────────────────────────────────────────────────────

const COLOR_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  neutral: 'Neutral'
};

function ColorsSettings() {
  const { state, dispatch } = usePageStore();
  const { colors } = state.page.styles;

  const handleColorChange = (key, value) => {
    dispatch(pageActions.updatePageStyles({ colors: { ...colors, [key]: value } }));
  };

  return (
    <div>
      {Object.entries(colors).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>{COLOR_LABELS[key] || key}</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="color"
              value={value}
              onChange={(e) => handleColorChange(key, e.target.value)}
              style={{ width: '44px', height: '44px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #4b5563', padding: '2px', backgroundColor: '#374151' }}
            />
            <input
              type="text"
              value={value.toUpperCase()}
              onChange={(e) => handleColorChange(key, e.target.value)}
              style={{ flex: 1, ...inputStyle }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Buttons ───────────────────────────────────────────────────────────────────

function ButtonEditor({ style: btnStyle, onChange }) {
  const shapeValue = SHAPE_PRESETS.find(s => s.value === btnStyle.radius)?.value ?? 'custom';
  const isCustomRadius = !SHAPE_PRESETS.some(s => s.value === btnStyle.radius);

  const previewStyle = {
    display: 'inline-block',
    padding: `${btnStyle.padding}px 20px`,
    backgroundColor: btnStyle.bgColor,
    color: btnStyle.textColor,
    borderRadius: `${btnStyle.radius}px`,
    fontSize: '13px',
    fontWeight: 500,
    border: btnStyle.bgColor === 'transparent' ? `1.5px solid ${btnStyle.textColor}` : 'none',
    cursor: 'default'
  };

  return (
    <div>
      {/* Preview */}
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={previewStyle}>{btnStyle.label}</span>
      </div>

      {/* Label */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Label</label>
        <input
          type="text"
          value={btnStyle.label}
          onChange={(e) => onChange('label', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Colors row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Background</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="color"
              value={btnStyle.bgColor === 'transparent' ? '#ffffff' : btnStyle.bgColor}
              onChange={(e) => onChange('bgColor', e.target.value)}
              style={{ width: '36px', height: '36px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #4b5563', padding: '2px', backgroundColor: '#374151', flexShrink: 0 }}
            />
            <input
              type="text"
              value={btnStyle.bgColor}
              onChange={(e) => onChange('bgColor', e.target.value)}
              style={{ flex: 1, ...inputStyle }}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Text color</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="color"
              value={btnStyle.textColor}
              onChange={(e) => onChange('textColor', e.target.value)}
              style={{ width: '36px', height: '36px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #4b5563', padding: '2px', backgroundColor: '#374151', flexShrink: 0 }}
            />
            <input
              type="text"
              value={btnStyle.textColor}
              onChange={(e) => onChange('textColor', e.target.value)}
              style={{ flex: 1, ...inputStyle }}
            />
          </div>
        </div>
      </div>

      {/* Shape */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Shape</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SHAPE_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => onChange('radius', preset.value)}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: '12px',
                backgroundColor: btnStyle.radius === preset.value ? '#3b82f6' : '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {isCustomRadius && (
          <div style={{ marginTop: '6px' }}>
            <label style={labelStyle}>Custom radius (px)</label>
            <input
              type="number"
              value={btnStyle.radius}
              min="0"
              onChange={(e) => onChange('radius', parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* Padding */}
      <div>
        <label style={labelStyle}>Padding (px)</label>
        <input
          type="number"
          value={btnStyle.padding}
          min="0"
          onChange={(e) => onChange('padding', parseInt(e.target.value) || 0)}
          style={inputStyle}
        />
      </div>
    </div>
  );
}

function ButtonsSettings() {
  const { state, dispatch } = usePageStore();
  const { buttonStyles } = state.page.styles;

  const handleButtonChange = (id, key, value) => {
    const updated = buttonStyles.map(b => b.id === id ? { ...b, [key]: value } : b);
    dispatch(pageActions.updatePageStyles({ buttonStyles: updated }));
  };

  const orderedButtons = ['primary', 'secondary', 'tertiary']
    .map(id => buttonStyles.find(b => b.id === id))
    .filter(Boolean);

  return (
    <div>
      {orderedButtons.map((btn, i) => (
        <div key={btn.id}>
          <p style={sectionHeadingStyle}>{btn.label}</p>
          <ButtonEditor
            style={btn}
            onChange={(key, value) => handleButtonChange(btn.id, key, value)}
          />
          {i < orderedButtons.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  );
}

// ─── Root export ───────────────────────────────────────────────────────────────

const SECTION_TITLES = {
  typography: 'Typography',
  colors: 'Colors',
  buttons: 'Buttons'
};

export function BrandingSettings() {
  const { state } = usePageStore();
  const section = state.activeBrandSection;

  if (!section) return null;

  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#f3f4f6' }}>
        {SECTION_TITLES[section]}
      </h2>
      {section === 'typography' && <TypographySettings />}
      {section === 'colors' && <ColorsSettings />}
      {section === 'buttons' && <ButtonsSettings />}
    </div>
  );
}
