import React from 'react';
import { usePageStore } from '../../store/pageStore.jsx';
import { PageSettings } from './PageSettings';
import { SegmentSettings } from './SegmentSettings';
import { ContainerSettings } from './ContainerSettings';
import { ContentSettings } from './ContentSettings';
import { THEME } from '../../utils/constants';

export function SettingsPanel() {
  const { state } = usePageStore();

  let settings = null;

  if (!state.selectedElementId) {
    settings = <PageSettings />;
  } else if (state.selectedElementType === 'segment') {
    settings = <SegmentSettings />;
  } else if (state.selectedElementType === 'container') {
    settings = <ContainerSettings />;
  } else {
    settings = <ContentSettings />;
  }

  const getSelectedLabel = () => {
    if (!state.selectedElementId) {
      return '📄 Page Settings';
    }
    const typeEmojis = {
      segment: '📦 Segment',
      container: '📋 Container',
      text: '📝 Text',
      image: '🖼️ Image',
      button: '🔘 Button',
      card: '🃏 Card'
    };
    return typeEmojis[state.selectedElementType] || 'Settings';
  };

  return (
    <div style={{
      width: '350px',
      height: '100vh',
      backgroundColor: THEME.surface,
      borderLeft: `1px solid ${THEME.border}`,
      overflow: 'auto',
      padding: '16px',
      color: THEME.text
    }}>
      <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>
        {getSelectedLabel()}
      </h2>
      {settings}
    </div>
  );
}
