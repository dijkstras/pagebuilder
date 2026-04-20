import React from 'react';
import { usePageStore } from '../../store/pageStore.jsx';
import { PageSettings } from './PageSettings';
import { SegmentSettings } from './SegmentSettings';
import { ContainerSettings } from './ContainerSettings';
import { SlotSettings } from './SlotSettings';
import { ContentSettings } from './ContentSettings';
import { BrandingSettings } from './BrandingSettings';
import { THEME } from '../../utils/constants';

export function SettingsPanel() {
  const { state } = usePageStore();
  const [settingsMode, setSettingsMode] = React.useState('simple');

  React.useEffect(() => {
    setSettingsMode('simple');
  }, [state.selectedElementId, state.selectedElementType]);

  if (state.activeBrandSection) {
    return (
      <div style={{
        width: '350px',
        height: '100vh',
        backgroundColor: THEME.surface,
        borderLeft: `1px solid ${THEME.border}`,
        overflow: 'auto',
        padding: '20px 16px',
        color: THEME.text
      }}>
        <BrandingSettings />
      </div>
    );
  }

  let settings = null;
  let label = '📄 Page';

  if (!state.selectedElementId) {
    settings = <PageSettings mode={settingsMode} />;
    label = '📄 Page';
  } else if (state.selectedElementType === 'segment') {
    settings = <SegmentSettings mode={settingsMode} />;
    label = '📦 Segment';
  } else if (state.selectedElementType === 'slot') {
    settings = <SlotSettings mode={settingsMode} />;
    label = '⊞ Slot';
  } else if (state.selectedElementType === 'container') {
    settings = <SlotSettings mode={settingsMode} />;
    label = '📋 Container';
  } else {
    settings = <ContentSettings mode={settingsMode} />;
    const typeEmojis = { text: '📝 Text', image: '🖼️ Image', button: '🔘 Button', card: '🎴 Card' };
    label = typeEmojis[state.selectedElementType] || '🎴 Card Settings';
  }

  const tabStyle = (tab) => ({
    flex: 1,
    padding: '8px 0',
    backgroundColor: settingsMode === tab ? THEME.background : 'transparent',
    color: settingsMode === tab ? '#f3f4f6' : '#9ca3af',
    border: 'none',
    borderBottom: settingsMode === tab ? `2px solid ${THEME.accent}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: settingsMode === tab ? 600 : 400,
    transition: 'all 0.15s'
  });

  return (
    <div style={{
      width: '350px',
      height: '100vh',
      backgroundColor: THEME.surface,
      borderLeft: `1px solid ${THEME.border}`,
      display: 'flex',
      flexDirection: 'column',
      color: THEME.text
    }}>
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <h2 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>
          {label}
        </h2>
        <div style={{ display: 'flex', borderBottom: `1px solid ${THEME.border}` }}>
          <button style={tabStyle('simple')} onClick={() => setSettingsMode('simple')}>Simple</button>
          <button style={tabStyle('advanced')} onClick={() => setSettingsMode('advanced')}>Advanced</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 20px' }}>
        {settings}
      </div>
    </div>
  );
}
