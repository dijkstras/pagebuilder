import React, { useState, useEffect } from 'react';
import { storage } from '../../services/fileStorage';
import { THEME } from '../../utils/constants';
import { generateHTML } from '../../services/pageGenerator';

export function PageGrid({ onPageSelect, onNewPage }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagePreviews, setPagePreviews] = useState({});

  const handlePageClick = async (pageName) => {
    console.log('PageGrid: Page clicked:', pageName);
    onPageSelect(pageName);
  };

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const loadedPages = await storage.listPages();
      setPages(loadedPages);
      
      // Generate previews for each page
      const previews = {};
      for (const page of loadedPages) {
        try {
          const pageData = await storage.loadPage(page.name);
          if (pageData) {
            previews[page.name] = generatePreview(pageData);
          }
        } catch (error) {
          console.error(`Error loading preview for ${page.name}:`, error);
          previews[page.name] = null;
        }
      }
      setPagePreviews(previews);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = (pageData) => {
    try {
      // Generate a simplified HTML preview
      const html = generateHTML(pageData, null);
      
      // Create a data URL for the preview
      const blob = new Blob([html], { type: 'text/html' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating preview:', error);
      return null;
    }
  };

  const handleDeletePage = async (pageName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${pageName}"? This cannot be undone.`)) {
      return;
    }
    try {
      await storage.deletePage(pageName);
      await loadPages(); // Refresh the page list
    } catch (error) {
      console.error('Error deleting page:', error);
      alert(`Failed to delete page: ${error.message}`);
    }
  };

  const handleDuplicatePage = async (pageName, e) => {
    e.stopPropagation();
    const sanitizedName = pageName.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const defaultCopyName = sanitizedName ? `${sanitizedName}-copy` : 'page-copy';
    const newName = prompt(`Duplicate "${pageName}" as:`, defaultCopyName);
    if (!newName) return;

    if (!newName.match(/^[a-z0-9\-]+$/i)) {
      alert('Page name must contain only letters, numbers, and hyphens');
      return;
    }

    try {
      await storage.duplicatePage(pageName, newName);
      await loadPages(); // Refresh the page list
    } catch (error) {
      console.error('Error duplicating page:', error);
      alert(`Failed to duplicate page: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        color: THEME.text
      }}>
        Loading pages...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: THEME.background, minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <img 
            src="https://superb-activity-b7b8c463f3.media.strapiapp.com/logo_0e2ef7d0ed.webp"
            alt="Pagebuilder Logo"
            style={{
              height: 'auto',
              width: '240px',
              objectFit: 'contain'
            }}
          />
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 600,
              color: THEME.text,
              margin: 0,
              lineHeight: '1.2'
            }}>
              Pagebuilder 1.0
            </h1>
            <p style={{
              fontSize: '14px',
              color: THEME.textMuted,
              margin: 0,
              marginTop: '2px'
            }}>
              by Sjoerd Dijkstra
            </p>
          </div>
        </div>
        <button
          onClick={onNewPage}
          style={{
            padding: '12px 24px',
            backgroundColor: THEME.accent,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = THEME.accent}
        >
          + Create New Page
        </button>
      </div>

      {pages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          borderRadius: '12px'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: THEME.text,
            marginBottom: '16px',
            fontWeight: 500
          }}>
            No pages yet
          </h2>
          <p style={{
            color: THEME.textMuted,
            marginBottom: '24px',
            fontSize: '16px'
          }}>
            Create your first page to get started
          </p>
          <button
            onClick={onNewPage}
            style={{
              padding: '12px 24px',
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Create Your First Page
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {pages.map(page => (
            <div
              key={page.id}
              onClick={() => handlePageClick(page.name)}
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                height: '320px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Preview Area */}
              <div 
                onClick={() => handlePageClick(page.name)}
                style={{
                  height: '200px',
                  backgroundColor: '#1a1a1a',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {pagePreviews[page.name] ? (
                  <>
                    <iframe
                      src={pagePreviews[page.name]}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        transform: 'scale(0.3)',
                        transformOrigin: 'top left',
                        width: '333%',
                        height: '333%',
                        pointerEvents: 'none'
                      }}
                      title={`Preview of ${page.name}`}
                    />
                    <div
                      onClick={() => handlePageClick(page.name)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        cursor: 'pointer',
                        zIndex: 1
                      }}
                    />
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: THEME.textMuted,
                    fontSize: '14px'
                  }}>
                    Preview unavailable
                  </div>
                )}
              </div>

              {/* Page Info */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: THEME.text,
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {page.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: THEME.textMuted,
                  marginBottom: '12px'
                }}>
                  {new Date(page.lastModified).toLocaleDateString()} at {new Date(page.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => handleDuplicatePage(page.name, e)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    Copy
                  </button>
                  <button
                    onClick={(e) => handleDeletePage(page.name, e)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
