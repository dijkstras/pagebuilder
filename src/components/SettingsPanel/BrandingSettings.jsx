import React, { useEffect, useState, useCallback } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { ColorPresets, ColorSlotPicker, resolveSlotColor } from './ColorPresets.jsx';
import { GradientPicker } from './GradientPicker';
import { MobileOverrideIcon, MobileOverrideWrap } from './useMobileSettings.jsx';
import { getWeightOptions, generateFontsUrl } from '../../utils/googleFonts.js';
import { colorPresetStorage } from '../../services/colorPresetStorage.js';
import { typographyPresetStorage } from '../../services/typographyPresetStorage.js';

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
  'Montserrat', 'Oswald', 'Space Grotesk', 'Caveat', 'Pacifico', 'Inconsolata',
  'Bricolage Grotesque', 'DM Sans', 'Source Sans 3'
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

const FONT_THEMES = [
  {
    id: 'clean-professional',
    name: 'Clean & Professional',
    useFor: 'SaaS, corporate',
    fonts: {
      heading1: { family: 'Montserrat', size: 48, weight: 700 },
      heading2: { family: 'Montserrat', size: 32, weight: 600 },
      body: { family: 'Inter', size: 16, weight: 400 },
      label: { family: 'Inter', size: 12, weight: 500 },
      button: { family: 'Montserrat', weight: 600 }
    }
  },
  {
    id: 'bold-persuasive',
    name: 'Bold & Persuasive',
    useFor: 'Marketing, landing pages',
    fonts: {
      heading1: { family: 'Bricolage Grotesque', size: 48, weight: 700 },
      heading2: { family: 'Bricolage Grotesque', size: 32, weight: 600 },
      body: { family: 'DM Sans', size: 16, weight: 400 },
      label: { family: 'DM Sans', size: 12, weight: 500 },
      button: { family: 'Bricolage Grotesque', weight: 600 }
    }
  },
  {
    id: 'editorial-readable',
    name: 'Editorial & Readable',
    useFor: 'Editorial, content-heavy',
    fonts: {
      heading1: { family: 'Lora', size: 48, weight: 600 },
      heading2: { family: 'Lora', size: 32, weight: 500 },
      body: { family: 'Source Sans 3', size: 16, weight: 400 },
      label: { family: 'Source Sans 3', size: 12, weight: 500 },
      button: { family: 'Source Sans 3', weight: 500 }
    }
  }
];

const TYPOGRAPHY_STYLES = [
  { key: 'heading1', label: 'Heading 1', previewText: 'The quick brown fox' },
  { key: 'heading2', label: 'Heading 2', previewText: 'The quick brown fox' },
  { key: 'body', label: 'Body', previewText: 'The quick brown fox jumps over the lazy dog.' },
  { key: 'label', label: 'Label', previewText: 'Label text' },
  { key: 'button', label: 'Button', previewText: 'Button' }
];

function TypographyPresets({ onApply, currentFonts }) {
  const [savedPresets, setSavedPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

  // Ensure currentFonts is never undefined
  const safeCurrentFonts = currentFonts ?? {
    heading1: { family: 'Inter', size: 48, weight: 700 },
    heading2: { family: 'Inter', size: 32, weight: 600 },
    body: { family: 'Inter', size: 16, weight: 400 },
    label: { family: 'Inter', size: 12, weight: 500 },
    button: { family: 'Inter', weight: 500 }
  };

  useEffect(() => {
    loadSavedPresets();
  }, []);

  const loadSavedPresets = async () => {
    try {
      const presets = await typographyPresetStorage.getAll();
      // Ensure each preset has all required font keys
      const defaultFonts = {
        heading1: { family: 'Inter', size: 48, weight: 700 },
        heading2: { family: 'Inter', size: 32, weight: 600 },
        body: { family: 'Inter', size: 16, weight: 400 },
        label: { family: 'Inter', size: 12, weight: 500 },
        button: { family: 'Inter', weight: 500 }
      };
      const safePresets = presets.map(preset => ({
        ...preset,
        fonts: { ...defaultFonts, ...(preset.fonts || {}) }
      }));
      setSavedPresets(safePresets);
    } catch (error) {
      console.error('Failed to load saved presets:', error);
    }
  };

  const handleSavePreset = async () => {
    if (!saveName.trim()) return;
    setSaveStatus('saving');
    try {
      // Ensure all required font keys are present before saving
      const defaultFonts = {
        heading1: { family: 'Inter', size: 48, weight: 700 },
        heading2: { family: 'Inter', size: 32, weight: 600 },
        body: { family: 'Inter', size: 16, weight: 400 },
        label: { family: 'Inter', size: 12, weight: 500 },
        button: { family: 'Inter', weight: 500 }
      };
      const fontsToSave = { ...defaultFonts, ...safeCurrentFonts };
      await typographyPresetStorage.save(saveName, fontsToSave);
      setSaveStatus('saved');
      setSaveName('');
      setShowSaveDialog(false);
      await loadSavedPresets();
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (error) {
      console.error('Failed to save preset:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }
  };

  const handleDeletePreset = async (id) => {
    try {
      await typographyPresetStorage.delete(id);
      await loadSavedPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={sectionHeadingStyle}>Saved Typography Presets</p>
        <button
          onClick={() => setShowSaveDialog(true)}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Save Current
        </button>
      </div>

      {showSaveDialog && (
        <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '6px', border: '1px solid #374151' }}>
          <input
            type="text"
            placeholder="Preset name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
            style={{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              fontSize: '13px',
              marginBottom: '8px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSavePreset}
              disabled={saveStatus === 'saving' || !saveName.trim()}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                backgroundColor: saveStatus === 'saved' ? '#22c55e' : saveStatus === 'error' ? '#ef4444' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: saveStatus === 'saving' || !saveName.trim() ? 'default' : 'pointer',
                fontWeight: 500
              }}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
            </button>
            <button
              onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                backgroundColor: '#374151',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {savedPresets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {savedPresets.map(preset => (
            <div
              key={preset.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            >
              <button
                onClick={() => {
                  const defaultFonts = {
                    heading1: { family: 'Inter', size: 48, weight: 700 },
                    heading2: { family: 'Inter', size: 32, weight: 600 },
                    body: { family: 'Inter', size: 16, weight: 400 },
                    label: { family: 'Inter', size: 12, weight: 500 },
                    button: { family: 'Inter', weight: 500 }
                  };
                  const mergedFonts = { ...defaultFonts, ...(preset.fonts || {}) };
                  onApply({ fonts: mergedFonts });
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6' }}>
                  {preset.name}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {preset.fonts?.heading1?.family || 'Custom'} · {preset.fonts?.body?.family || 'Custom'}
                </span>
              </button>
              <button
                onClick={() => handleDeletePreset(preset.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: '#374151',
                  color: '#ef4444',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
          No saved typography presets yet
        </div>
      )}
    </div>
  );
}

function TypographySettings() {
  const { state, dispatch } = usePageStore();
  const pageStyles = state.page?.styles ?? {};
  const { fonts } = pageStyles ?? {
    heading1: { family: 'Inter', size: 48, weight: 700 },
    heading2: { family: 'Inter', size: 32, weight: 600 },
    body: { family: 'Inter', size: 16, weight: 400 },
    label: { family: 'Inter', size: 12, weight: 500 },
    button: { family: 'Inter', weight: 500 }
  };
  const { isMobile, getStyle, setOverride, clearOverride, hasOverride } = useBrandingMobileOverride('fonts');

  // Get available weights for a font family
  const getWeightOptionsForFont = useCallback((fontFamily) => {
    if (!fontFamily) return [];
    return getWeightOptions(fontFamily);
  }, []);

  // Detect active theme based on current font configuration
  const detectActiveTheme = () => {
    if (!fonts) return null;
    const matchesTheme = (themeFonts) => {
      if (!themeFonts) return false;
      return Object.entries(themeFonts).every(([key, themeFont]) => {
        const current = fonts[key];
        return current?.family === themeFont.family && current?.weight === themeFont.weight;
      });
    };
    const theme = FONT_THEMES.find(t => matchesTheme(t.fonts));
    return theme?.id || null;
  };

  const activeThemeId = detectActiveTheme();

  const applyTheme = (theme) => {
    if (isMobile) {
      // Clear all font overrides when applying a theme on mobile
      dispatch(pageActions.updatePageMobileOverrides({ fonts: {} }));
    }
    // Merge with default fonts to ensure all keys are present
    const defaultFonts = {
      heading1: { family: 'Inter', size: 48, weight: 700 },
      heading2: { family: 'Inter', size: 32, weight: 600 },
      body: { family: 'Inter', size: 16, weight: 400 },
      label: { family: 'Inter', size: 12, weight: 500 },
      button: { family: 'Inter', weight: 500 }
    };
    const mergedFonts = { ...defaultFonts, ...theme.fonts };
    dispatch(pageActions.updatePageStyles({ fonts: mergedFonts }));
  };

  // Dynamically load Google Fonts into the app's <head> so the preview renders correctly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fonts) return;
      const fontMap = {};
      // Include fonts from themes for preview
      [...Object.values(fonts), ...FONT_THEMES.flatMap(t => Object.values(t.fonts))].forEach(font => {
        if (!font?.family) return;
        if (!fontMap[font.family]) fontMap[font.family] = new Set();
        if (font.weight) fontMap[font.family].add(font.weight);
      });

      // Convert Sets to arrays for the URL generator
      const fontMapWithWeights = {};
      Object.entries(fontMap).forEach(([family, weights]) => {
        fontMapWithWeights[family] = Array.from(weights);
      });

      // Remove previously injected font links
      document.querySelectorAll('link[data-gfont]').forEach(el => el.remove());

      // Inject fonts with specific weights using the new URL generator
      if (Object.keys(fontMapWithWeights).length > 0) {
        const url = generateFontsUrl(fontMapWithWeights);
        const link = document.createElement('link');
        link.setAttribute('data-gfont', 'dynamic');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [fonts]);

  const handleFontChange = (role, key, value) => {
    if (isMobile) {
      const current = getStyle(role, fonts[role]) ?? fonts[role];
      const updated = { ...current, [key]: value };
      // If changing font family, ensure weight is valid for the new font
      if (key === 'family') {
        const availableWeights = getWeightOptionsForFont(value);
        if (availableWeights.length > 0 && !availableWeights.find(w => w.value === updated.weight)) {
          updated.weight = availableWeights[0].value;
        }
      }
      setOverride(role, updated);
    } else {
      const newFonts = { ...fonts, [role]: { ...fonts[role], [key]: value } };
      // If changing font family, ensure weight is valid for the new font
      if (key === 'family') {
        const availableWeights = getWeightOptionsForFont(value);
        if (availableWeights.length > 0 && !availableWeights.find(w => w.value === newFonts[role].weight)) {
          newFonts[role].weight = availableWeights[0].value;
        }
      }
      dispatch(pageActions.updatePageStyles({ fonts: newFonts }));
    }
  };

  if (!fonts) return null;

  return (
    <div>
      <TypographyPresets onApply={applyTheme} currentFonts={fonts} />
      <Divider />
      {/* Font Theme Selector */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ ...sectionHeadingStyle, marginBottom: '12px' }}>Font Theme</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FONT_THEMES.map(theme => {
            const isActive = activeThemeId === theme.id;
            const previewFont = theme.fonts.heading1.family;
            return (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px 16px',
                  backgroundColor: isActive ? '#1e3a5f' : '#1f2937',
                  border: `2px solid ${isActive ? '#3b82f6' : '#374151'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%'
                }}
              >
                <span style={{
                  fontFamily: previewFont,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: isActive ? '#93c5fd' : '#f3f4f6',
                  marginBottom: '4px'
                }}>
                  {theme.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: isActive ? '#6b9fd4' : '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Use for: {theme.useFor}
                </span>
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#3b82f6'
                  }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Divider />
      {TYPOGRAPHY_STYLES.map((style, index) => {
        const effectiveFont = getStyle(style.key, fonts?.[style.key]) ?? fonts?.[style.key];
        const overridden = hasOverride(style.key, fonts?.[style.key]);
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
                    {getWeightOptionsForFont(effectiveFont.family).map(w => (
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
  neutral: 'Neutral',
  card: 'Card'
};

const COLOR_GROUPS = {
  brand: {
    label: 'Brand Colors',
    keys: ['primary', 'secondary']
  },
  ui: {
    label: 'UI Colors',
    keys: ['text', 'background', 'accent', 'neutral', 'card']
  }
};

const COLOR_THEME_PRESETS = [
  {
    id: 'simple', name: 'Simple',
    dark:  { primary: '#F5F5F5', secondary: '#AAAAAA', accent: '#666666', text: '#F5F5F5', background: '#111111', neutral: '#1C1C1C', card: '#1C1C1C' },
    light: { primary: '#111111', secondary: '#555555', accent: '#888888', text: '#111111', background: '#F2F2F2', neutral: '#F5F5F5', card: '#FFFFFF' },
  },
  {
    id: 'corporate', name: 'Corporate',
    dark:  { primary: '#3B82F6', secondary: '#60A5FA', accent: '#F59E0B', text: '#E8EFF8', background: '#0D1B2E', neutral: '#162845', card: '#1A3050' },
    light: { primary: '#1D4ED8', secondary: '#3B82F6', accent: '#F59E0B', text: '#0D1B2E', background: '#EEF4FB', neutral: '#DDEAF8', card: '#FFFFFF' },
  },
  {
    id: 'vibrant', name: 'Vibrant',
    dark:  { primary: '#FF2D78', secondary: '#FF80AB', accent: '#00D4FF', text: '#F8F8F8', background: '#0D0D0D', neutral: '#1A1A1A', card: '#1A1A1A' },
    light: { primary: '#FF2D78', secondary: '#FF80AB', accent: '#00AACC', text: '#1A001A', background: '#FFFFFF', neutral: '#FFF0F5', card: '#FFFFFF' },
  },
];

function ColorThemePresets({ onApply, currentColors }) {
  const [mode, setMode] = useState('light');
  const [savedPresets, setSavedPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    loadSavedPresets();
  }, []);

  const loadSavedPresets = async () => {
    try {
      const presets = await colorPresetStorage.getAll();
      setSavedPresets(presets);
    } catch (error) {
      console.error('Failed to load saved presets:', error);
    }
  };

  const handleSavePreset = async () => {
    if (!saveName.trim()) return;
    setSaveStatus('saving');
    try {
      await colorPresetStorage.save(saveName, currentColors);
      setSaveStatus('saved');
      setSaveName('');
      setShowSaveDialog(false);
      await loadSavedPresets();
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (error) {
      console.error('Failed to save preset:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }
  };

  const handleDeletePreset = async (id) => {
    try {
      await colorPresetStorage.delete(id);
      await loadSavedPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={sectionHeadingStyle}>Theme Presets</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Save Current
          </button>
          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #4b5563' }}>
            {['light', 'dark'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: mode === m ? 600 : 400,
                  backgroundColor: mode === m ? '#3b82f6' : '#374151',
                  color: mode === m ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '6px', border: '1px solid #374151' }}>
          <input
            type="text"
            placeholder="Preset name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
            style={{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              fontSize: '13px',
              marginBottom: '8px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSavePreset}
              disabled={saveStatus === 'saving' || !saveName.trim()}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                backgroundColor: saveStatus === 'saved' ? '#22c55e' : saveStatus === 'error' ? '#ef4444' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: saveStatus === 'saving' || !saveName.trim() ? 'default' : 'pointer',
                fontWeight: 500
              }}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
            </button>
            <button
              onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                backgroundColor: '#374151',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        {COLOR_THEME_PRESETS.map(theme => {
          const palette = theme[mode];
          return (
            <button
              key={theme.id}
              onClick={() => onApply(palette)}
              title={`Apply ${theme.name} (${mode})`}
              style={{
                flex: 1,
                padding: '8px 6px',
                backgroundColor: palette.background,
                border: '1px solid #4b5563',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', gap: '3px' }}>
                {['primary', 'secondary', 'accent', 'neutral', 'card'].map(k => (
                  <div key={k} style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    backgroundColor: palette[k],
                    border: '1px solid rgba(128,128,128,0.3)'
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 500, color: palette.text }}>
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>

      {savedPresets.length > 0 && (
        <>
          <p style={{ ...sectionHeadingStyle, marginTop: '16px' }}>Saved Presets</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedPresets.map(preset => (
              <div
                key={preset.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: preset.colors.background,
                  border: '1px solid #4b5563',
                  borderRadius: '8px'
                }}
              >
                <button
                  onClick={() => onApply(preset.colors)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {['primary', 'secondary', 'accent', 'neutral', 'card'].map(k => (
                      <div key={k} style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        backgroundColor: preset.colors[k],
                        border: '1px solid rgba(128,128,128,0.3)'
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: preset.colors.text }}>
                    {preset.name}
                  </span>
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#374151',
                    color: '#ef4444',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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

  const handleApplyPreset = (palette) => {
    dispatch(pageActions.updatePageStyles({ colors: { ...palette } }));
  };

  return (
    <div>
      <ColorThemePresets onApply={handleApplyPreset} currentColors={colors} />
      <Divider />
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

function ButtonEditor({ style: btnStyle, onChange, onMerge, colors = {} }) {
  const { state } = usePageStore();
  const buttonFont = state.page.styles.fonts?.button;
  
  const shapeValue = SHAPE_PRESETS.find(s => s.value === btnStyle.radius)?.value ?? 'custom';
  const isCustomRadius = !SHAPE_PRESETS.some(s => s.value === btnStyle.radius);

  const resolvedBgColor = resolveSlotColor(btnStyle.bgColorSlot, colors, btnStyle.bgColor);
  const resolvedTextColor = resolveSlotColor(btnStyle.textColorSlot, colors, btnStyle.textColor);

  const previewBg = btnStyle.bgType === 'gradient' && btnStyle.bgGradient
    ? `linear-gradient(${btnStyle.bgGradient.angle ?? 90}deg, ${btnStyle.bgGradient.color1}, ${btnStyle.bgGradient.color2})`
    : resolvedBgColor;

  const hoverBg = btnStyle.bgType === 'gradient' && btnStyle.bgGradient
    ? `linear-gradient(${btnStyle.bgGradient.angle ?? 90}deg, ${darkenHex(btnStyle.bgGradient.color1)}, ${darkenHex(btnStyle.bgGradient.color2)})`
    : darkenHex(resolvedBgColor || '#3b82f6');

  const sharedPreviewStyle = {
    display: 'inline-block',
    padding: `${btnStyle.padding}px 20px`,
    color: resolvedTextColor,
    borderRadius: `${btnStyle.radius}px`,
    fontSize: `${btnStyle.fontSize ?? 14}px`,
    fontFamily: buttonFont?.family || 'Inter',
    fontWeight: buttonFont?.weight || 500,
    border: btnStyle.bgType !== 'gradient' && resolvedBgColor === 'transparent' ? `1.5px solid ${resolvedTextColor}` : 'none',
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

      {/* Background (gradient picker or slot picker) */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Background</label>
        {btnStyle.bgType === 'gradient' ? (
          <GradientPicker
            bgType={btnStyle.bgType || 'solid'}
            bgColor={btnStyle.bgColor}
            bgGradient={btnStyle.bgGradient}
            onUpdate={onChange}
            colors={colors}
          />
        ) : (
          <>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {['solid', 'gradient'].map(mode => (
                <button
                  key={mode}
                  onClick={() => onChange('bgType', mode)}
                  style={{
                    flex: 1, padding: '5px', fontSize: '12px',
                    backgroundColor: (btnStyle.bgType || 'solid') === mode ? '#3b82f6' : '#374151',
                    color: (btnStyle.bgType || 'solid') === mode ? '#fff' : '#9ca3af',
                    border: `1px solid ${(btnStyle.bgType || 'solid') === mode ? '#3b82f6' : '#4b5563'}`,
                    borderRadius: '4px', cursor: 'pointer', fontWeight: (btnStyle.bgType || 'solid') === mode ? '600' : '400',
                    textTransform: 'capitalize'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
            <ColorSlotPicker
              slot={btnStyle.bgColorSlot ?? null}
              customColor={btnStyle.bgColor}
              colors={colors}
              onSlotChange={(slot, color) => onMerge({ bgColorSlot: slot, bgColor: color })}
              onCustomColorChange={(color) => onChange('bgColor', color)}
            />
          </>
        )}
      </div>

      {/* Text color */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Text color</label>
        <ColorSlotPicker
          slot={btnStyle.textColorSlot ?? null}
          customColor={btnStyle.textColor}
          colors={colors}
          onSlotChange={(slot, color) => onMerge({ textColorSlot: slot, textColor: color })}
          onCustomColorChange={(color) => onChange('textColor', color)}
        />
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

  const handleButtonMerge = (id, partial) => {
    if (isMobile) {
      const desktopBtn = buttonStyles.find(b => b.id === id) ?? {};
      const currentOverride = (pmo.buttonStyles ?? {})[id] ?? { ...desktopBtn };
      const next = { ...currentOverride, ...partial };
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
      const updated = buttonStyles.map(b => b.id === id ? { ...b, ...partial } : b);
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
                onMerge={(partial) => handleButtonMerge(btn.id, partial)}
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
