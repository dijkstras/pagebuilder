import React, { useState, useEffect } from 'react';
import { StructureTree } from './StructureTree/StructureTree';
import { Preview } from './Preview/Preview';
import { SettingsPanel } from './SettingsPanel/SettingsPanel';
import { usePageStore, pageActions } from '../store/pageStore.jsx';
import { generateHTML, generateCSS } from '../services/pageGenerator';
import { storage } from '../services/fileStorage';
import { THEME, EDITOR_LAYOUT } from '../utils/constants';

export function Editor({ onBackToGrid }) {
  const { state, dispatch } = usePageStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [pages, setPages] = useState([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const handleNewPage = async () => {
    const pageName = saveFileName.trim();

    if (!pageName) {
      return;
    }

    // Validate name
    if (!pageName.match(/^[a-z0-9\-]+$/i)) {
      alert('Page name must contain only letters, numbers, and hyphens');
      return;
    }

    try {
      dispatch(pageActions.setSaveStatus('saving'));
      const newPage = await storage.createNewPage(pageName);
      dispatch(pageActions.setPage(newPage));
      dispatch(pageActions.setSaveStatus('saved'));
      setShowSaveDialog(false);
      setSaveFileName('');

      // Clear saved status after 2 seconds
      setTimeout(() => {
        dispatch(pageActions.setSaveStatus('idle'));
      }, 2000);
    } catch (error) {
      dispatch(pageActions.setSaveStatus('error', error.message));
    }
  };

  const handleLoadClick = async () => {
    const loadedPages = await storage.listPages();
    setPages(loadedPages);
    setShowLoadDialog(true);
  };

  const handleLoadPage = async (pageName) => {
    try {
      console.log('Loading page:', pageName);
      const page = await storage.loadPage(pageName);
      console.log('Page loaded from storage:', page);
      if (page) {
        console.log('Dispatching SET_PAGE action');
        dispatch(pageActions.setPage(page));
        console.log('Page set successfully');
      } else {
        console.warn('Page is null or undefined');
        alert('Page not found');
      }
    } catch (error) {
      console.error('Error loading page:', error);
      console.error('Error stack:', error.stack);
      alert(`Failed to load page: ${error.message}`);
    } finally {
      console.log('Closing load dialog');
      setShowLoadDialog(false);
    }
  };

  const handleDeletePage = async (pageName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${pageName}"? This cannot be undone.`)) {
      return;
    }
    try {
      dispatch(pageActions.setSaveStatus('saving'));
      await storage.deletePage(pageName);
      // Refresh the pages list
      const loadedPages = await storage.listPages();
      setPages(loadedPages);
      dispatch(pageActions.setSaveStatus('saved'));
      setTimeout(() => {
        dispatch(pageActions.setSaveStatus('idle'));
      }, 2000);
    } catch (error) {
      dispatch(pageActions.setSaveStatus('error', error.message));
    }
  };

  const handleDuplicatePage = async (pageName, e) => {
    e.stopPropagation();
    // Sanitize the original name to create a valid default suggestion
    const sanitizedName = pageName.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const defaultCopyName = sanitizedName ? `${sanitizedName}-copy` : 'page-copy';
    const newName = prompt(`Duplicate "${pageName}" as:`, defaultCopyName);
    if (!newName) return;

    if (!newName.match(/^[a-z0-9\-]+$/i)) {
      alert('Page name must contain only letters, numbers, and hyphens');
      return;
    }

    try {
      dispatch(pageActions.setSaveStatus('saving'));
      await storage.duplicatePage(pageName, newName);
      // Refresh the pages list
      const loadedPages = await storage.listPages();
      setPages(loadedPages);
      dispatch(pageActions.setSaveStatus('saved'));
      setTimeout(() => {
        dispatch(pageActions.setSaveStatus('idle'));
      }, 2000);
    } catch (error) {
      dispatch(pageActions.setSaveStatus('error', error.message));
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackToGrid && (
            <button
              onClick={onBackToGrid}
              style={{
                padding: '6px 12px',
                backgroundColor: THEME.background,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← Back to Pages
            </button>
          )}
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            {state.page.title || 'Untitled Page'}
          </h1>
          {state.saveStatus !== 'idle' && (
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: state.saveStatus === 'error' ? '#ef4444' : '#10b981',
              minWidth: '80px'
            }}>
              {state.saveStatus === 'saving' && '⟳ Saving...'}
              {state.saveStatus === 'saved' && '✓ Saved'}
              {state.saveStatus === 'error' && `✗ Error: ${state.saveError}`}
            </span>
          )}
          {state.lastSaved && (
            <span style={{
              fontSize: '11px',
              color: '#6b7280',
              whiteSpace: 'nowrap'
            }}>
              Last saved: {new Date(state.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
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
            New Page
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
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            style={{
              padding: '6px 12px',
              backgroundColor: isFullScreen ? THEME.accent : THEME.background,
              color: isFullScreen ? 'white' : THEME.text,
              border: isFullScreen ? 'none' : `1px solid ${THEME.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {isFullScreen ? '✕ Exit Full' : '⛶ Full Screen'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isFullScreen && (
          <div style={{ width: `${EDITOR_LAYOUT.LEFT_PANEL_WIDTH}px`, borderRight: `1px solid ${THEME.border}`, overflow: 'auto' }}>
            <StructureTree />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Preview />
        </div>
        {!isFullScreen && (
          <div style={{ width: `${EDITOR_LAYOUT.RIGHT_PANEL_WIDTH}px`, borderLeft: `1px solid ${THEME.border}`, overflow: 'auto' }}>
            <SettingsPanel />
          </div>
        )}
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
            <h3 style={{ marginBottom: '16px' }}>Create Page</h3>
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
              onKeyDown={(e) => e.key === 'Enter' && handleNewPage()}
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
                onClick={handleNewPage}
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
                Create
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
                  <div
                    key={page.id}
                    style={{
                      padding: '12px',
                      backgroundColor: THEME.background,
                      border: `1px solid ${THEME.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleLoadPage(page.name)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = THEME.surfaceHover || '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = THEME.background}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: THEME.text, marginBottom: '4px' }}>
                        {page.name}
                      </div>
                      <div style={{ fontSize: '11px', color: THEME.textMuted }}>
                        Modified: {new Date(page.lastModified).toLocaleDateString()} {new Date(page.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                      <button
                        onClick={(e) => handleDuplicatePage(page.name, e)}
                        title="Duplicate"
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 500
                        }}
                      >
                        Copy
                      </button>
                      <button
                        onClick={(e) => handleDeletePage(page.name, e)}
                        title="Delete"
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 500
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
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
