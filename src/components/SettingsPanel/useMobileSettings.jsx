import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';

export const MobileOverrideIcon = ({ hasOverride, onClear }) => {
  if (!hasOverride) return null;
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
      style={{ marginLeft: '6px', cursor: 'pointer', userSelect: 'none', background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '3px', verticalAlign: 'middle' }}
    >
      <span style={{ fontSize: '12px' }}>⚠️</span>
      <span style={{ fontSize: '11px', color: '#f59e0b', textDecoration: 'underline' }}>Clear override</span>
    </button>
  );
};

export const MobileOverrideWrap = ({ hasOverride, children, style }) => (
  <div style={{
    marginBottom: '12px',
    ...(hasOverride ? {
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: '6px',
      padding: '8px',
      marginLeft: '-8px',
      marginRight: '-8px',
    } : {}),
    ...style
  }}>
    {children}
  </div>
);

/**
 * Returns helpers for reading/writing settings with mobile override support.
 *
 * When in mobile mode:
 *   - getSetting(key) returns mobileOverrides[key] if set, else settings[key]
 *   - updateSetting(key, value) writes to mobileOverrides
 *   - hasOverride(key) returns true if mobileOverrides[key] is explicitly set
 *
 * When in desktop mode:
 *   - getSetting(key) returns settings[key]
 *   - updateSetting(key, value) writes to settings
 *   - hasOverride(key) always returns false
 */
export function useMobileSettings(element) {
  const { state, dispatch } = usePageStore();
  const isMobile = state.viewportMode === 'mobile';

  const settings = element?.settings ?? {};
  const mobileOverrides = settings.mobileOverrides ?? {};

  const hasOverride = (key) => {
    if (!isMobile || !(key in mobileOverrides)) return false;
    const mobileVal = JSON.stringify(mobileOverrides[key]);
    const desktopVal = JSON.stringify(settings[key]);
    return mobileVal !== desktopVal;
  };

  const getSetting = (key, defaultValue) => {
    if (isMobile && key in mobileOverrides) return mobileOverrides[key];
    const val = settings[key];
    return val !== undefined ? val : defaultValue;
  };

  const updateSetting = (key, value) => {
    if (!element) return;
    if (isMobile) {
      const next = { ...mobileOverrides, [key]: value };
      // Auto-clear if the chosen value matches desktop
      if (JSON.stringify(value) === JSON.stringify(settings[key])) {
        delete next[key];
      }
      dispatch(pageActions.updateElement(element.id, {
        settings: { ...settings, mobileOverrides: next }
      }));
    } else {
      dispatch(pageActions.updateElement(element.id, {
        settings: { ...settings, [key]: value }
      }));
    }
  };

  const mergeSettings = (partial) => {
    if (!element) return;
    if (isMobile) {
      const next = { ...mobileOverrides, ...partial };
      dispatch(pageActions.updateElement(element.id, {
        settings: { ...settings, mobileOverrides: next }
      }));
    } else {
      dispatch(pageActions.updateElement(element.id, {
        settings: { ...settings, ...partial }
      }));
    }
  };

  const clearOverride = (key) => {
    if (!element) return;
    const next = { ...mobileOverrides };
    delete next[key];
    dispatch(pageActions.updateElement(element.id, {
      settings: { ...settings, mobileOverrides: next }
    }));
  };

  return { isMobile, getSetting, updateSetting, mergeSettings, hasOverride, clearOverride, mobileOverrides };
}
