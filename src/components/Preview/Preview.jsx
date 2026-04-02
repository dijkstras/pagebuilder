import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { usePageStore } from '../../store/pageStore.jsx';
import { generateHTML } from '../../services/pageGenerator';
import { THEME } from '../../utils/constants';

export function Preview() {
  const { state } = usePageStore();
  const [viewportMode, setViewportMode] = useState('desktop');
  const iframeRef = useRef(null);
  const savedScrollRef = useRef(0);
  const pendingScrollToIdRef = useRef(null);

  const htmlContent = useMemo(() => {
    return generateHTML(state.page, state.selectedElementId);
  }, [state.page, state.selectedElementId]);

  // When selection changes, mark the element to scroll to on next iframe load
  useEffect(() => {
    if (state.selectedElementId) {
      pendingScrollToIdRef.current = state.selectedElementId;
    }
  }, [state.selectedElementId]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.addEventListener('scroll', () => {
      savedScrollRef.current = iframe.contentWindow.scrollY;
    });

    const targetId = pendingScrollToIdRef.current;
    if (targetId) {
      pendingScrollToIdRef.current = null;
      const el = iframe.contentDocument?.querySelector(`[data-element-id="${targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }

    iframe.contentWindow.scrollTo(0, savedScrollRef.current);
  }, []);

  const isMobileMode = viewportMode === 'mobile';
  const previewWidth = isMobileMode ? '375px' : '100%';

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '14px',
          color: THEME.textMuted,
          fontWeight: 500,
          margin: 0
        }}>
          Live Preview
        </h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setViewportMode('desktop')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: viewportMode === 'desktop' ? 600 : 400,
              backgroundColor: viewportMode === 'desktop' ? THEME.accent : THEME.background,
              color: viewportMode === 'desktop' ? 'white' : THEME.text,
              border: `1px solid ${viewportMode === 'desktop' ? THEME.accent : THEME.border}`,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: viewportMode === 'mobile' ? 600 : 400,
              backgroundColor: viewportMode === 'mobile' ? THEME.accent : THEME.background,
              color: viewportMode === 'mobile' ? 'white' : THEME.text,
              border: `1px solid ${viewportMode === 'mobile' ? THEME.accent : THEME.border}`,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mobile
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'auto',
        padding: isMobileMode ? '20px' : '0'
      }}>
        <div style={{
          width: previewWidth,
          height: '100%',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'auto'
        }}>
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            onLoad={handleIframeLoad}
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
    </div>
  );
}
