import React from 'react';
import { usePageStore } from '../../store/pageStore.jsx';
import { PageSettings } from './PageSettings';
import { SegmentSettings } from './SegmentSettings';
import { ContainerSettings } from './ContainerSettings';
import { SlotSettings } from './SlotSettings';
import { ContentSettings } from './ContentSettings';
import { BrandingSettings } from './BrandingSettings';
import { THEME } from '../../utils/constants';

const SECTION_ICONS = {
  typography: '🔤',
  colors: '🎨',
  buttons: '🔘'
};

export function SettingsPanel() {
  const { state } = usePageStore();

  // Brand section takes priority over element settings
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
    settings = <PageSettings />;
    label = '📄 Page';
  } else if (state.selectedElementType === 'segment') {
    settings = <SegmentSettings />;
    label = '📦 Segment';
  } else if (state.selectedElementType === 'slot') {
    settings = <SlotSettings />;
    label = '⊞ Slot';
  } else if (state.selectedElementType === 'container') {
    settings = <ContainerSettings />;
    label = '📋 Container';
  } else {
    settings = <ContentSettings />;
    const typeEmojis = { text: '📝 Text', image: '🖼️ Image', button: '🔘 Button', card: '🎴 Card' };
    label = typeEmojis[state.selectedElementType] || '🎴 Card Settings';
  }

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
      <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>
        {label}
      </h2>
      {settings}
    </div>
  );
}
