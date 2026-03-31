import React, { useState } from 'react';
import { StructureTree } from './StructureTree/StructureTree';
import { Preview } from './Preview/Preview';
import { SettingsPanel } from './SettingsPanel/SettingsPanel';
import { usePageStore, pageActions } from '../store/pageStore.jsx';
import { savePage, loadPage, listPages } from '../services/googleDrive';
import { THEME, EDITOR_LAYOUT } from '../utils/constants';

export function Editor() {
  const { state, dispatch } = usePageStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [pages, setPages] = useState([]);

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
