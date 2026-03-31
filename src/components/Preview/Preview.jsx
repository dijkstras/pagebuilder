import React, { useMemo } from 'react';
import { usePageStore } from '../../store/pageStore.jsx';
import { generateHTML } from '../../services/pageGenerator';
import { THEME } from '../../utils/constants';

export function Preview() {
  const { state } = usePageStore();

  const htmlContent = useMemo(() => {
    return generateHTML(state.page);
  }, [state.page]);

  return (
    <div style={{
      flex: 1,
      height: '100vh',
      backgroundColor: THEME.background,
      borderRight: `1px solid ${THEME.border}`,
      overflow: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{
        fontSize: '14px',
        marginBottom: '16px',
        color: THEME.textMuted,
        fontWeight: 500
      }}>
        Live Preview
      </h2>

      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'auto'
      }}>
        <iframe
          srcDoc={htmlContent}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '4px'
          }}
          title="Page Preview"
        />
      </div>
    </div>
  );
}
