import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { generateHTML } from '../../services/pageGenerator';
import { THEME } from '../../utils/constants';

export function Preview() {
  const { state, dispatch } = usePageStore();
  const [viewportMode, setViewportMode] = useState('desktop');
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const iframeRef = useRef(null);
  const savedScrollRef = useRef(0);
  const pendingScrollToIdRef = useRef(null);

  const handleMessage = useCallback((event) => {
    // Only handle messages from our iframe
    if (event.data && event.data.type === 'SELECT_ELEMENT') {
      const elementId = event.data.elementId;
      if (elementId) {
        // Find the element in the page to get its type
        const findElement = (elements) => {
          for (const element of elements) {
            if (element.id === elementId) return element;
            if (element.children) {
              const found = findElement(element.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        const element = findElement(state.page.root);
        if (element) {
          dispatch(pageActions.selectElement(elementId, element.type));
        }
      }
    }
  }, [state.page.root, dispatch]);

  const htmlContent = useMemo(() => {
    try {
      return generateHTML(state.page, state.selectedElementId, { showGridOverlay });
    } catch (error) {
      console.error('Error generating HTML:', error);
      return `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="padding: 20px; font-family: sans-serif;">
  <h1 style="color: red;">Error Rendering Page</h1>
  <p>${error.message}</p>
  <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
</body>
</html>`;
    }
  }, [state.page, state.selectedElementId, showGridOverlay]);

  // Set up message listener for iframe communication
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

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

    // Scroll to the selected element
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
  const previewWidth = isMobileMode ? '480px' : '100%';

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
          <label style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', color: THEME.textMuted, cursor: 'pointer', userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={showGridOverlay}
              onChange={(e) => setShowGridOverlay(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Grid
          </label>
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
