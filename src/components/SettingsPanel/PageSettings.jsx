import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { ColorSlotPicker, resolveSlotColor } from './ColorPresets.jsx';
import { SEGMENT_SPACING_PRESETS } from '../../store/pageTypes';
import { MobileOverrideIcon, MobileOverrideWrap } from './useMobileSettings.jsx';

const MobileOverrideDot = MobileOverrideIcon;

export function PageSettings({ mode = 'advanced' }) {
  const { state, dispatch } = usePageStore();
  const { page } = state;
  const isMobile = state.viewportMode === 'mobile';
  const mo = page.mobileOverrides ?? {};
  const isSimple = mode === 'simple';

  const setOverride = (key, value) => {
    dispatch(pageActions.updatePageMobileOverrides({ [key]: value }));
  };

  const clearOverride = (key) => {
    const next = { ...mo };
    delete next[key];
    dispatch(pageActions.updatePageMobileOverrides(next));
  };

  const hasOverride = (key) => isMobile && key in mo;

  const handleTitleChange = (e) => {
    dispatch(pageActions.updatePageSettings({ title: e.target.value }));
  };

  const handleBgColorChange = (value) => {
    if (isMobile) {
      setOverride('bgColor', value);
    } else {
      dispatch(pageActions.updatePageStyles({ bgColor: value }));
    }
  };

  const handleBgSlotChange = (slot, color) => {
    if (isMobile) {
      dispatch(pageActions.updatePageMobileOverrides({ ...mo, bgColorSlot: slot, bgColor: color }));
    } else {
      dispatch(pageActions.updatePageStyles({ bgColorSlot: slot, bgColor: color }));
    }
  };

  const handleSegmentSpacingChange = (value) => {
    if (isMobile) {
      setOverride('segmentSpacing', value);
    } else {
      dispatch(pageActions.updatePageStyles({ segmentSpacing: value }));
    }
  };

  const effectiveBgColor = isMobile && 'bgColor' in mo ? mo.bgColor : (page.styles.bgColor ?? '#f9fafb');
  const effectiveBgColorSlot = isMobile && 'bgColorSlot' in mo ? mo.bgColorSlot : (page.styles.bgColorSlot ?? null);
  const effectiveSpacing = isMobile && 'segmentSpacing' in mo ? mo.segmentSpacing : (page.styles.segmentSpacing || 'md');

  return (
    <div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
          Page title
        </label>
        <input
          type="text"
          value={page.title}
          onChange={handleTitleChange}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            fontSize: '13px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <MobileOverrideWrap hasOverride={hasOverride('bgColor')} style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: '#9ca3af', display: 'inline-block', marginBottom: '6px' }}>
          Background color
          <MobileOverrideDot hasOverride={hasOverride('bgColor')} onClear={() => clearOverride('bgColor')} />
        </label>
        <ColorSlotPicker
          slot={effectiveBgColorSlot}
          customColor={effectiveBgColor}
          colors={page.styles.colors || {}}
          onSlotChange={(slot, color) => handleBgSlotChange(slot, color)}
          onCustomColorChange={handleBgColorChange}
        />
      </MobileOverrideWrap>

      {!isSimple && (
        <MobileOverrideWrap hasOverride={hasOverride('segmentSpacing')} style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#9ca3af', display: 'inline-block', marginBottom: '6px' }}>
            Segment spacing
            <MobileOverrideDot hasOverride={hasOverride('segmentSpacing')} onClear={() => clearOverride('segmentSpacing')} />
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Object.entries(SEGMENT_SPACING_PRESETS).map(([key, preset]) => {
              const isActive = effectiveSpacing === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSegmentSpacingChange(key)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    backgroundColor: isActive ? '#3b82f6' : '#374151',
                    color: isActive ? '#ffffff' : '#9ca3af',
                    border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  {preset.label} ({preset.px}px)
                </button>
              );
            })}
          </div>
        </MobileOverrideWrap>
      )}

      <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
        To edit fonts, colors, and button styles, open the{' '}
        <strong style={{ color: '#9ca3af' }}>Branding</strong> tab in the left panel.
      </p>
    </div>
  );
}
