import React from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { GradientPicker } from './GradientPicker.jsx';

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

export function SlotSettings() {
  const { state, dispatch } = usePageStore();
  const slot = findElement(state.page, state.selectedElementId);
  const [spacingInput, setSpacingInput] = React.useState('');
  const isEditingRef = React.useRef(false);

  React.useEffect(() => {
    if (slot && !isEditingRef.current) {
      const currentValue = slot.settings.spacing === 'auto' ? 'auto' : slot.settings.spacing?.toString() ?? '16';
      setSpacingInput(currentValue);
    }
  }, [slot?.settings.spacing]);

  if (!slot) return null;

  const handleUpdate = (key, value) => {
    const updates = {
      settings: { ...slot.settings, [key]: value }
    };
    dispatch(pageActions.updateElement(slot.id, updates));
  };

  const handleResponsiveUpdate = (key, value) => {
    handleUpdate('responsive', {
      ...(slot.settings.responsive || {}),
      [key]: value
    });
  };

  const colors = state.page.styles.colors || {};
  const responsive = slot.settings.responsive || {};

  return (
    <div>
      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
        <input
          type="text"
          value={slot.name || ''}
          onChange={(e) => dispatch(pageActions.updateElement(slot.id, { name: e.target.value }))}
          placeholder="Slot name…"
          style={{ width: '100%', padding: '7px 10px', backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Content Direction</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'column', label: '↓', title: 'Vertical (top to bottom)' },
            { value: 'row', label: '→', title: 'Horizontal (left to right)' }
          ].map(({ value, label, title }) => (
            <button
              key={value}
              title={title}
              onClick={() => handleUpdate('direction', value)}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '16px',
                backgroundColor: (slot.settings.direction ?? 'column') === value ? '#3b82f6' : '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {label} {value === 'row' ? 'Horizontal' : 'Vertical'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Alignment</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↔</span>
            {[{ v: 'left', l: '←' }, { v: 'center', l: '—' }, { v: 'right', l: '→' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('contentAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (slot.settings.contentAlignment ?? 'left') === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↕</span>
            {[{ v: 'top', l: '↑' }, { v: 'center', l: '—' }, { v: 'bottom', l: '↓' }].map(({ v, l }) => (
              <button key={v} onClick={() => handleUpdate('verticalAlignment', v)} style={{
                flex: 1, height: '28px', fontSize: '13px',
                backgroundColor: (slot.settings.verticalAlignment ?? 'top') === v ? '#3b82f6' : '#374151',
                color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Content Spacing</label>
        <input
          type="text"
          value={spacingInput}
          onChange={(e) => {
            const value = e.target.value;
            isEditingRef.current = true;
            setSpacingInput(value);
            const trimmedValue = value.trim();
            if (trimmedValue.toLowerCase() === 'auto') {
              handleUpdate('spacing', 'auto');
              isEditingRef.current = false;
            } else if (trimmedValue !== '') {
              const numericMatch = trimmedValue.match(/^(\d+(?:\.\d+)?)\s*(px|%)?$/i);
              if (numericMatch) {
                const numValue = parseFloat(numericMatch[1]);
                if (numValue >= 0) handleUpdate('spacing', numValue);
              }
              isEditingRef.current = false;
            }
          }}
          onBlur={() => {
            isEditingRef.current = false;
            if (spacingInput.trim() === '') {
              handleUpdate('spacing', 16);
              setSpacingInput('16');
            } else if (slot) {
              const currentValue = slot.settings.spacing === 'auto' ? 'auto' : slot.settings.spacing?.toString() ?? '16';
              setSpacingInput(currentValue);
            }
          }}
          placeholder="16px or auto"
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Gap between items inside this slot
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Height</label>
        <input
          type="text"
          value={(slot.settings.height && slot.settings.height !== 'auto') ? slot.settings.height : ''}
          onChange={(e) => handleUpdate('height', e.target.value || 'auto')}
          placeholder="auto"
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>e.g. 200px, 50%, auto</div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background</label>
        <GradientPicker
          bgType={slot.settings.bgType || 'solid'}
          bgColor={slot.settings.bgColor}
          bgGradient={slot.settings.bgGradient}
          onUpdate={handleUpdate}
          colors={colors}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Padding (px)</label>
        <input
          type="number"
          value={slot.settings.padding}
          onChange={(e) => handleUpdate('padding', parseInt(e.target.value))}
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Corner Radius (px)</label>
        <input
          type="number"
          value={slot.settings.borderRadius ?? 0}
          min={0}
          onChange={(e) => handleUpdate('borderRadius', parseInt(e.target.value) || 0)}
          style={{
            width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
            border: '1px solid #4b5563', borderRadius: '4px', boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={slot.settings.borderEnabled || false}
            onChange={(e) => handleUpdate('borderEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Border
        </label>
        {slot.settings.borderEnabled && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width (px)</label>
              <input
                type="number"
                value={slot.settings.borderWidth ?? 1}
                min={1}
                onChange={(e) => handleUpdate('borderWidth', parseInt(e.target.value) || 1)}
                style={{
                  width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
                  border: '1px solid #4b5563', borderRadius: '4px', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Color</label>
              <input
                type="text"
                value={slot.settings.borderColor ?? '#000000'}
                onChange={(e) => handleUpdate('borderColor', e.target.value)}
                placeholder="#000000"
                style={{
                  width: '100%', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
                  border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={slot.settings.elevationEnabled || false}
            onChange={(e) => handleUpdate('elevationEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Elevation
        </label>
        {slot.settings.elevationEnabled && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af' }}>Shadow intensity</label>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{slot.settings.elevation ?? 4}</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={slot.settings.elevation ?? 4}
              onChange={(e) => handleUpdate('elevation', parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* Responsive Section */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsive</label>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={responsive.hideOnMobile || false}
              onChange={(e) => handleResponsiveUpdate('hideOnMobile', e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Hide on mobile
          </label>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', marginLeft: '24px' }}>
            Hidden below 768px
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Mobile order</label>
          <input
            type="number"
            value={responsive.mobileOrder ?? ''}
            onChange={(e) => handleResponsiveUpdate('mobileOrder', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="auto"
            min={1}
            style={{
              width: '80px', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6',
              border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box'
            }}
          />
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            Override stacking order on mobile
          </div>
        </div>
      </div>
    </div>
  );
}
