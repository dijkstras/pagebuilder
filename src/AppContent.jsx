import React, { useState, useEffect } from 'react';
import { Editor } from './components/Editor';
import { PageGrid } from './components/PageGrid/PageGrid';
import { usePageStore, pageActions } from './store/pageStore.jsx';
import { storage } from './services/fileStorage';

export function AppContent() {
  const { state, dispatch } = usePageStore();
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  const handlePageSelect = async (pageName) => {
    console.log('AppContent: handlePageSelect called with:', pageName);
    try {
      const page = await storage.loadPage(pageName);
      console.log('AppContent: Page loaded:', page);
      if (page) {
        dispatch(pageActions.setPage(page));
        dispatch(pageActions.setView('editor'));
        console.log('AppContent: View switched to editor');
      } else {
        alert('Page not found');
      }
    } catch (error) {
      console.error('Error loading page:', error);
      alert(`Failed to load page: ${error.message}`);
    }
  };

  const handleNewPage = async () => {
    const pageName = newPageName.trim();

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
      dispatch(pageActions.setView('editor'));
      dispatch(pageActions.setSaveStatus('saved'));
      setShowNewPageDialog(false);
      setNewPageName('');

      // Clear saved status after 2 seconds
      setTimeout(() => {
        dispatch(pageActions.setSaveStatus('idle'));
      }, 2000);
    } catch (error) {
      dispatch(pageActions.setSaveStatus('error', error.message));
    }
  };

  const handleBackToGrid = () => {
    dispatch(pageActions.setView('grid'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (showNewPageDialog) {
        setShowNewPageDialog(false);
        setNewPageName('');
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNewPageDialog]);

  if (state.currentView === 'grid') {
    return (
      <>
        <PageGrid 
          onPageSelect={handlePageSelect}
          onNewPage={() => setShowNewPageDialog(true)}
        />
        
        {showNewPageDialog && (
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
              backgroundColor: '#1a202c',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #4a5568',
              minWidth: '300px'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#f7fafc' }}>Create New Page</h3>
              <input
                type="text"
                placeholder="Page name..."
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '16px',
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#f7fafc',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleNewPage()}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowNewPageDialog(false);
                    setNewPageName('');
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#2d3748',
                    color: '#f7fafc',
                    border: '1px solid #4a5568',
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
                    backgroundColor: '#4299e1',
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
      </>
    );
  }

  return <Editor onBackToGrid={handleBackToGrid} />;
}
