import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore';
import { CONTENT_TYPES } from '../../store/pageTypes';

function findElement(page, elementId) {
  const search = (element) => {
    if (element.id === elementId) return element;
    if (element.children) {
      for (const child of element.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };
  for (const segment of page.root) {
    const found = search(segment);
    if (found) return found;
  }
  return null;
}

export function ContentSettings() {
  const { state, dispatch } = usePageStore();
  const content = findElement(state.page, state.selectedElementId);

  if (!content) return null;

  const handleCustomUpdate = (key, value) => {
    const updates = {
      settings: {
        ...content.settings,
        customOverrides: {
          ...content.settings.customOverrides,
          [key]: value
        }
      }
    };
    dispatch(pageActions.updateElement(content.id, updates));
  };

  const handleStyleAssign = (styleId) => {
    const updates = {
      settings: { ...content.settings, assignedStyleId: styleId }
    };
    dispatch(pageActions.updateElement(content.id, updates));
  };

  return (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
        {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
      </h3>

      {content.type === CONTENT_TYPES.TEXT && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Content</label>
          <textarea
            value={content.settings.customOverrides.content || ''}
            onChange={(e) => handleCustomUpdate('content', e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              minHeight: '80px',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {content.type === CONTENT_TYPES.IMAGE && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Image URL</label>
          <input
            type="text"
            value={content.settings.customOverrides.src || ''}
            onChange={(e) => handleCustomUpdate('src', e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {content.type === CONTENT_TYPES.BUTTON && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Button Label</label>
            <input
              type="text"
              value={content.settings.customOverrides.label || 'Button'}
              onChange={(e) => handleCustomUpdate('label', e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Button Style</label>
            <select
              value={content.settings.assignedStyleId || ''}
              onChange={(e) => handleStyleAssign(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- No style --</option>
              {state.page.styles.buttonStyles.map(style => (
                <option key={style.id} value={style.id}>{style.label}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
