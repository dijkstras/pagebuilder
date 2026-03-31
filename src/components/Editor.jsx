import React, { useState, useEffect } from 'react';
import { StructureTree } from './StructureTree/StructureTree';
import { Preview } from './Preview/Preview';
import { SettingsPanel } from './SettingsPanel/SettingsPanel';
import { usePageStore, pageActions } from '../store/pageStore.jsx';
import { savePage, loadPage, listPages } from '../services/googleDrive';
import { generateHTML } from '../services/pageGenerator';
import { storage } from '../services/fileStorage';
import { THEME, EDITOR_LAYOUT } from '../utils/constants';

export function Editor() {
  const { state, dispatch } = usePageStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [pages, setPages] = useState([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);

  // Auto-save when page changes
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    // Only auto-save if page has a name (not untitled)
    if (!state.page.title || state.page.title === 'Untitled Page') {
      return;
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      dispatch(pageActions.setSaveStatus('saving'));
      try {
        const result = await storage.savePage(state.page.title, state.page);
        dispatch(pageActions.setSaveStatus('saved'));
        // Clear saved status after 2 seconds
        setTimeout(() => {
          dispatch(pageActions.setSaveStatus('idle'));
        }, 2000);
      } catch (error) {
        dispatch(pageActions.setSaveStatus('error', error.message));
      }
    }, 3000); // 3 second debounce

    setAutoSaveTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [state.page, dispatch]); // Re-run when page changes

  const handleSave = async () => {
    if (saveFileName.trim()) {
      await savePage(state.page, saveFileName);
      setShowSaveDialog(false);
      setSaveFileName('');
    }
  };

  const handleLoadClick = async () => {
    const loadedPages = await listPages();
    setPages(loadedPages);
    setShowLoadDialog(true);
  };

  const handleLoadPage = async (fileName) => {
    const page = await loadPage(fileName);
    if (page) {
      dispatch(pageActions.setPage(page));
      setShowLoadDialog(false);
    }
  };

  const generateCSS = (page) => {
    const colors = page.styles.colors;
    const fonts = page.styles.fonts;
    const spacing = page.styles.spacing ?? { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 };

    return `/* Page Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-neutral: ${colors.neutral};
  --font-heading1-family: ${fonts.heading1.family}, sans-serif;
  --font-heading1-size: ${fonts.heading1.size}px;
  --font-heading1-weight: ${fonts.heading1.weight};
  --font-heading2-family: ${fonts.heading2.family}, sans-serif;
  --font-heading2-size: ${fonts.heading2.size}px;
  --font-heading2-weight: ${fonts.heading2.weight};
  --font-body-family: ${fonts.body.family}, sans-serif;
  --font-body-size: ${fonts.body.size}px;
  --font-body-weight: ${fonts.body.weight};
  --font-label-family: ${fonts.label.family}, sans-serif;
  --font-label-size: ${fonts.label.size}px;
  --font-label-weight: ${fonts.label.weight};
  --spacing-xs: ${spacing.xs}px;
  --spacing-sm: ${spacing.sm}px;
  --spacing-md: ${spacing.md}px;
  --spacing-lg: ${spacing.lg}px;
  --spacing-xl: ${spacing.xl}px;
}

html, body {
  font-family: var(--font-body-family);
  font-size: var(--font-body-size);
  font-weight: var(--font-body-weight);
}

body {
  background-color: ${page.styles.bgColor ?? '#f9fafb'};
}

h1 {
  font-family: var(--font-heading1-family);
  font-size: var(--font-heading1-size);
  font-weight: var(--font-heading1-weight);
}

h2 {
  font-family: var(--font-heading2-family);
  font-size: var(--font-heading2-size);
  font-weight: var(--font-heading2-weight);
}

h3, .label {
  font-family: var(--font-label-family);
  font-size: var(--font-label-size);
  font-weight: var(--font-label-weight);
}
`;
  };

  const handleExport = () => {
    const htmlContent = generateHTML(state.page, null);
    const cssContent = generateCSS(state.page);

    // Download HTML
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const htmlLink = document.createElement('a');
    htmlLink.href = htmlUrl;
    htmlLink.download = `${state.page.title || 'page'}.html`;
    document.body.appendChild(htmlLink);
    htmlLink.click();
    document.body.removeChild(htmlLink);
    URL.revokeObjectURL(htmlUrl);

    // Download CSS
    setTimeout(() => {
      const cssBlob = new Blob([cssContent], { type: 'text/css' });
      const cssUrl = URL.createObjectURL(cssBlob);
      const cssLink = document.createElement('a');
      cssLink.href = cssUrl;
      cssLink.download = `${state.page.title || 'page'}.css`;
      document.body.appendChild(cssLink);
      cssLink.click();
      document.body.removeChild(cssLink);
      URL.revokeObjectURL(cssUrl);
    }, 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: THEME.surface,
        borderBottom: `1px solid ${THEME.border}`,
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{state.page.title || 'Untitled Page'}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Save
          </button>
          <button
            onClick={handleLoadClick}
            style={{
              padding: '6px 12px',
              backgroundColor: THEME.background,
              color: THEME.accent,
              border: `1px solid ${THEME.accent}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Load
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '6px 12px',
              backgroundColor: THEME.background,
              color: '#10b981',
              border: '1px solid #10b981',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Export
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: `${EDITOR_LAYOUT.LEFT_PANEL_WIDTH}px`, borderRight: `1px solid ${THEME.border}`, overflow: 'auto' }}>
          <StructureTree />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Preview />
        </div>
        <div style={{ width: `${EDITOR_LAYOUT.RIGHT_PANEL_WIDTH}px`, borderLeft: `1px solid ${THEME.border}`, overflow: 'auto' }}>
          <SettingsPanel />
        </div>
      </div>

      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: THEME.surface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${THEME.border}`,
            minWidth: '300px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Save Page</h3>
            <input
              type="text"
              placeholder="Page name..."
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                backgroundColor: THEME.background,
                border: `1px solid ${THEME.border}`,
                borderRadius: '4px',
                color: THEME.text,
                boxSizing: 'border-box'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: THEME.background,
                  color: THEME.text,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '6px 12px',
                  backgroundColor: THEME.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: THEME.surface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${THEME.border}`,
            minWidth: '400px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Load Page</h3>
            {pages.length === 0 ? (
              <p style={{ color: THEME.textMuted }}>No saved pages</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => handleLoadPage(page.name)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: THEME.background,
                      color: THEME.text,
                      border: `1px solid ${THEME.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '12px'
                    }}
                  >
                    {page.name}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLoadDialog(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: THEME.background,
                  color: THEME.text,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
