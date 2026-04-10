import React, { useEffect } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { ColorPresets } from './ColorPresets.jsx';
import { GradientPicker } from './GradientPicker';
import { MobileOverrideIcon, MobileOverrideWrap } from './useMobileSettings.jsx';

// Hook for page-level mobile overrides (branding lives in page.styles / page.mobileOverrides)
function useBrandingMobileOverride(section) {
  const { state, dispatch } = usePageStore();
  const isMobile = state.viewportMode === 'mobile';
  const pmo = state.page.mobileOverrides ?? {};
  const sectionOverrides = pmo[section] ?? {};

  const getStyle = (key, desktopValue) => {
    if (isMobile && key in sectionOverrides) return sectionOverrides[key];
    return desktopValue;
  };

  const setOverride = (key, value) => {
    const desktopValue = section === 'fonts'
      ? state.page.styles.fonts?.[key]
      : section === 'colors'
        ? state.page.styles.colors?.[key]
        : undefined;
    const next = { ...sectionOverrides };
    if (JSON.stringify(value) === JSON.stringify(desktopValue)) {
      delete next[key];
    } else {
      next[key] = value;
    }
    dispatch(pageActions.updatePageMobileOverrides({ [section]: next }));
  };

  const clearOverride = (key) => {
    const next = { ...sectionOverrides };
    delete next[key];
    dispatch(pageActions.updatePageMobileOverrides({ [section]: next }));
  };

  const hasOverride = (key, desktopValue) => {
    if (!isMobile || !(key in sectionOverrides)) return false;
    return JSON.stringify(sectionOverrides[key]) !== JSON.stringify(desktopValue);
  };

  return { isMobile, getStyle, setOverride, clearOverride, hasOverride, sectionOverrides };
}

function darkenHex(hex, amount = 0.15) {
  if (!hex || typeof hex !== 'string') return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const PRESET_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Poppins', 'Raleway', 'Work Sans', 'Nunito',
  'Merriweather', 'Playfair Display', 'Lora', 'Crimson Text',
  'Montserrat', 'Oswald', 'Space Grotesk', 'Caveat', 'Pacifico', 'Inconsolata'
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
  { key: 'label', label: 'Label', previewText: 'Label text' },
  { key: 'button', label: 'Button', previewText: 'Button' }
];

function TypographySettings() {
  const { state, dispatch } = usePageStore();
  const { fonts } = state.page.styles;
  const { isMobile, getStyle, setOverride, clearOverride, hasOverride } = useBrandingMobileOverride('fonts');

  // Dynamically load Google Fonts into the app's <head> so the preview renders correctly
  useEffect(() => {
    const timer = setTimeout(() => {
      const fontMap = {};
      Object.values(fonts).forEach(font => {
        if (!font?.family) return;
        if (!fontMap[font.family]) fontMap[font.family] = new Set();
        if (font.weight) fontMap[font.family].add(font.weight);
      });

      // Remove previously injected font links
      document.querySelectorAll('link[data-gfont]').forEach(el => el.remove());

      // Inject a <link> for each font family without specifying weights.
      // Weight params break static (non-variable) fonts — the browser will use
      // the closest available weight via CSS font matching.
      Object.entries(fontMap).forEach(([family]) => {
        const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
        const url = `https://fonts.googleapis.com/css2?family=${encodedFamily}&display=swap`;
        const link = document.createElement('link');
        link.setAttribute('data-gfont', family);
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [fonts]);

  const handleFontChange = (role, key, value) => {
    if (isMobile) {
      const current = getStyle(role, fonts[role]) ?? fonts[role];
      setOverride(role, { ...current, [key]: value });
    } else {
      const newFonts = { ...fonts, [role]: { ...fonts[role], [key]: value } };
      dispatch(pageActions.updatePageStyles({ fonts: newFonts }));
    }
  };

  return (
    <div>
      {TYPOGRAPHY_STYLES.map((style, index) => {
        const effectiveFont = getStyle(style.key, fonts[style.key]) ?? fonts[style.key];
        const overridden = hasOverride(style.key, fonts[style.key]);
        return (
          <div key={style.key}>
            <MobileOverrideWrap hasOverride={overridden} style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ ...sectionHeadingStyle, marginBottom: 0, flex: 1 }}>{style.label}</p>
                <MobileOverrideIcon hasOverride={overridden} onClear={() => clearOverride(style.key)} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Font family</label>
                <select
                  value={PRESET_FONTS.includes(effectiveFont.family) ? effectiveFont.family : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') handleFontChange(style.key, 'family', e.target.value);
                  }}
                  style={inputStyle}
                >
                  {PRESET_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  {!PRESET_FONTS.includes(effectiveFont.family) && (
                    <option value="custom">{effectiveFont.family} (custom)</option>
                  )}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor={`font-search-${style.key}`} style={labelStyle}>Search fonts</label>
                <input
                  id={`font-search-${style.key}`}
                  type="text"
                  placeholder="Type any Google Font name..."
                  value={effectiveFont.family}
                  onChange={(e) => handleFontChange(style.key, 'family', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                {style.key !== 'button' && (
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Size (px)</label>
                    <input
                      type="number"
                      value={effectiveFont.size}
                      onChange={(e) => handleFontChange(style.key, 'size', parseInt(e.target.value) || 0)}
                      min="8"
                      max="96"
                      style={inputStyle}
                    />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Weight</label>
                  <select
                    value={effectiveFont.weight}
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
                fontFamily: effectiveFont.family,
                fontWeight: effectiveFont.weight,
                ...(effectiveFont.size !== undefined && { fontSize: `${effectiveFont.size}px` }),
                color: '#f3f4f6'
              }}>
                {style.previewText}
              </div>
            </MobileOverrideWrap>

            {index < TYPOGRAPHY_STYLES.length - 1 && <Divider />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Colors ────────────────────────────────────────────────────────────────────

const COLOR_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  text: 'Text',
  background: 'Background',
  neutral: 'Neutral'
};

const COLOR_GROUPS = {
  brand: {
    label: 'Brand Colors',
    keys: ['primary', 'secondary']
  },
  ui: {
    label: 'UI Colors',
    keys: ['text', 'background', 'accent', 'neutral']
  }
};

function ColorsSettings() {
  const { state, dispatch } = usePageStore();
  const { colors } = state.page.styles;
  const { isMobile, getStyle, setOverride, clearOverride, hasOverride } = useBrandingMobileOverride('colors');

  const handleColorChange = (key, value) => {
    if (isMobile) {
      setOverride(key, value);
    } else {
      dispatch(pageActions.updatePageStyles({ colors: { ...colors, [key]: value } }));
    }
  };

  return (
    <div>
      {Object.entries(COLOR_GROUPS).map((groupEntry, groupIndex) => {
        const [groupKey, group] = groupEntry;
        return (
          <div key={groupKey}>
            <p style={sectionHeadingStyle}>{group.label}</p>
            <div style={{ marginBottom: '16px' }}>
              {group.keys.map(colorKey => {
                const effectiveColor = getStyle(colorKey, colors[colorKey]) ?? colors[colorKey];
                const overridden = hasOverride(colorKey, colors[colorKey]);
                return (
                  <MobileOverrideWrap key={colorKey} hasOverride={overridden} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ ...labelStyle, marginBottom: 0, flex: 1 }}>{COLOR_LABELS[colorKey]}</label>
                      <MobileOverrideIcon hasOverride={overridden} onClear={() => clearOverride(colorKey)} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={effectiveColor}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        style={{
                          width: '44px',
                          height: '44px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          border: '1px solid #4b5563',
                          padding: '2px',
                          backgroundColor: '#374151',
                          flexShrink: 0
                        }}
                      />
                      <input
                        type="text"
                        value={(effectiveColor || '#000000').toUpperCase()}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        style={{ flex: 1, ...inputStyle }}
                      />
                    </div>
                  </MobileOverrideWrap>
                );
              })}
            </div>
            {groupIndex < Object.keys(COLOR_GROUPS).length - 1 && <Divider />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Buttons ───────────────────────────────────────────────────────────────────

function ButtonEditor({ style: btnStyle, onChange, colors = {} }) {
  const shapeValue = SHAPE_PRESETS.find(s => s.value === btnStyle.radius)?.value ?? 'custom';
  const isCustomRadius = !SHAPE_PRESETS.some(s => s.value === btnStyle.radius);

  const previewBg = btnStyle.bgType === 'gradient' && btnStyle.bgGradient
    ? `linear-gradient(${btnStyle.bgGradient.angle ?? 90}deg, ${btnStyle.bgGradient.color1}, ${btnStyle.bgGradient.color2})`
    : btnStyle.bgColor;

  const hoverBg = btnStyle.bgType === 'gradient' && btnStyle.bgGradient
    ? `linear-gradient(${btnStyle.bgGradient.angle ?? 90}deg, ${darkenHex(btnStyle.bgGradient.color1)}, ${darkenHex(btnStyle.bgGradient.color2)})`
    : darkenHex(btnStyle.bgColor || '#3b82f6');

  const sharedPreviewStyle = {
    display: 'inline-block',
    padding: `${btnStyle.padding}px 20px`,
    color: btnStyle.textColor,
    borderRadius: `${btnStyle.radius}px`,
    fontSize: `${btnStyle.fontSize ?? 14}px`,
    fontWeight: 500,
    border: btnStyle.bgType !== 'gradient' && btnStyle.bgColor === 'transparent' ? `1.5px solid ${btnStyle.textColor}` : 'none',
    cursor: 'default'
  };

  return (
    <div>
      {/* Preview */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Normal</div>
          <div style={{ ...sharedPreviewStyle, background: previewBg }}>
            {btnStyle.label || 'Button'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Hover</div>
          <div style={{ ...sharedPreviewStyle, background: hoverBg }}>
            {btnStyle.label || 'Button'}
          </div>
        </div>
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

      {/* Background (gradient picker) */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Background</label>
        <GradientPicker
          bgType={btnStyle.bgType || 'solid'}
          bgColor={btnStyle.bgColor}
          bgGradient={btnStyle.bgGradient}
          onUpdate={onChange}
          colors={colors}
        />
      </div>

      {/* Text color */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Text color</label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
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
        {Object.keys(colors).length > 0 && (
          <ColorPresets colors={colors} onSelectColor={(color) => onChange('textColor', color)} />
        )}
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Font Size (px)</label>
        <input
          type="number"
          value={btnStyle.fontSize ?? 14}
          onChange={e => onChange('fontSize', parseInt(e.target.value) || 14)}
          min={8}
          max={72}
          style={{ ...inputStyle, width: 80 }}
        />
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
  const { buttonStyles, colors } = state.page.styles;
  const { isMobile, sectionOverrides, clearOverride: clearBtnOverride } = useBrandingMobileOverride('buttonStyles');
  const pmo = state.page.mobileOverrides ?? {};

  const hasButtonOverride = (btnId, desktopBtn) => {
    if (!isMobile) return false;
    const o = (pmo.buttonStyles ?? {})[btnId];
    if (!o) return false;
    return JSON.stringify(o) !== JSON.stringify(desktopBtn);
  };

  const handleButtonChange = (id, key, value) => {
    if (isMobile) {
      const desktopBtn = buttonStyles.find(b => b.id === id) ?? {};
      const currentOverride = (pmo.buttonStyles ?? {})[id] ?? { ...desktopBtn };
      const next = { ...currentOverride, [key]: value };
      // Auto-clear entire button override if it fully matches desktop
      const merged = { ...desktopBtn, ...next };
      const isIdentical = JSON.stringify(merged) === JSON.stringify(desktopBtn);
      const nextBtnStyles = { ...(pmo.buttonStyles ?? {}) };
      if (isIdentical) {
        delete nextBtnStyles[id];
      } else {
        nextBtnStyles[id] = next;
      }
      dispatch(pageActions.updatePageMobileOverrides({ buttonStyles: nextBtnStyles }));
    } else {
      const updated = buttonStyles.map(b => b.id === id ? { ...b, [key]: value } : b);
      dispatch(pageActions.updatePageStyles({ buttonStyles: updated }));
    }
  };

  const clearButtonOverride = (btnId) => {
    const next = { ...(pmo.buttonStyles ?? {}) };
    delete next[btnId];
    dispatch(pageActions.updatePageMobileOverrides({ buttonStyles: next }));
  };

  const orderedButtons = ['primary', 'secondary', 'tertiary']
    .map(id => buttonStyles.find(b => b.id === id))
    .filter(Boolean);

  return (
    <div>
      {orderedButtons.map((btn, i) => {
        const overrideData = (pmo.buttonStyles ?? {})[btn.id];
        const effectiveBtn = isMobile && overrideData ? { ...btn, ...overrideData } : btn;
        const overridden = hasButtonOverride(btn.id, btn);
        return (
          <div key={btn.id}>
            <MobileOverrideWrap hasOverride={overridden} style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ ...sectionHeadingStyle, marginBottom: 0, flex: 1 }}>{btn.label}</p>
                <MobileOverrideIcon hasOverride={overridden} onClear={() => clearButtonOverride(btn.id)} />
              </div>
              <ButtonEditor
                style={effectiveBtn}
                onChange={(key, value) => handleButtonChange(btn.id, key, value)}
                colors={colors || {}}
              />
            </MobileOverrideWrap>
            {i < orderedButtons.length - 1 && <Divider />}
          </div>
        );
      })}
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
