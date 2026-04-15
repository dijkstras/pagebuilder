import React, { useState } from 'react';
import { usePageStore, pageActions } from '../../store/pageStore.jsx';
import { GradientPicker } from './GradientPicker.jsx';
import { ColorSlotPicker } from './ColorPresets.jsx';
import { LAYOUT_PRESETS, GAP_PRESETS } from '../../store/pageTypes';
import { useMobileSettings, MobileOverrideIcon, MobileOverrideWrap } from './useMobileSettings.jsx';
import { segmentStorage } from '../../services/segmentStorage';

const LAYOUT_VISUALS = {
  'full':       { blocks: [12] },
  '50-50':      { blocks: [6, 6] },
  '33-67':      { blocks: [4, 8] },
  '67-33':      { blocks: [8, 4] },
  '33-33-33':   { blocks: [4, 4, 4] },
  '25-75':      { blocks: [3, 9] },
  '75-25':      { blocks: [9, 3] },
  '25-50-25':   { blocks: [3, 6, 3] }
};

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

const MobileOverrideDot = MobileOverrideIcon;

export function SegmentSettings() {
  const { state, dispatch } = usePageStore();
  const segment = findElement(state.page, state.selectedElementId);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  if (!segment) return null;

  const { isMobile, getSetting, updateSetting, mergeSettings, hasOverride, clearOverride } = useMobileSettings(segment);

  const handleSaveSegment = () => {
    setSaveStatus('saving');
    try {
      const name = segment.name || 'Unnamed Segment';
      segmentStorage.save(name, segment);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (error) {
      console.error('Failed to save segment:', error);
      alert('Failed to save segment');
      setSaveStatus('idle');
    }
  };

  const handleUpdate = (key, value) => {
    if (isMobile) {
      updateSetting(key, value);
    } else {
      dispatch(pageActions.updateElement(segment.id, {
        settings: { ...segment.settings, [key]: value }
      }));
    }
  };

  const handleMergeUpdate = (partial) => mergeSettings(partial);

  const handleLayoutChange = (layoutKey) => {
    dispatch(pageActions.setLayout(segment.id, layoutKey));
  };

  const colors = state.page.styles.colors || {};
  const currentLayout = segment.settings.layout || 'full';
  const currentGap = getSetting('gap', 'md');

  return (
    <div>
      {/* Header with Save Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid #1f2937'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
          <input
            type="text"
            value={segment.name || ''}
            onChange={(e) => dispatch(pageActions.updateElement(segment.id, { name: e.target.value }))}
            placeholder="Segment name…"
            style={{ width: '100%', padding: '7px 10px', backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <button
          onClick={handleSaveSegment}
          disabled={saveStatus !== 'idle'}
          style={{
            marginLeft: '12px',
            padding: '7px 14px',
            backgroundColor: saveStatus === 'saved' ? '#22c55e' : saveStatus === 'saving' ? '#6b7280' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: saveStatus === 'idle' ? 'pointer' : 'default',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap'
          }}
          title="Save segment for reuse"
        >
          {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'saving' ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={segment.settings.headingEnabled || false}
            onChange={(e) => handleUpdate('headingEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Heading
        </label>
        {segment.settings.headingEnabled && (
          <>
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Content</label>
              <input
                type="text"
                value={segment.settings.headingContent || 'Section Heading'}
                onChange={(e) => handleUpdate('headingContent', e.target.value)}
                placeholder="Section Heading"
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: '#374151',
                  color: '#f3f4f6',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Font</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { value: 'heading1', label: 'H1' },
                  { value: 'heading2', label: 'H2' },
                  { value: 'body', label: 'Body' }
                ].map(font => (
                  <button
                    key={font.value}
                    onClick={() => handleUpdate('headingFont', font.value)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '12px',
                      backgroundColor: (segment.settings.headingFont ?? 'heading1') === font.value ? '#3b82f6' : '#374151',
                      color: '#f3f4f6',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Alignment</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { value: 'left', label: '←' },
                  { value: 'center', label: '—' },
                  { value: 'right', label: '→' }
                ].map(align => (
                  <button
                    key={align.value}
                    onClick={() => handleUpdate('headingAlignment', align.value)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '12px',
                      backgroundColor: (segment.settings.headingAlignment ?? 'left') === align.value ? '#3b82f6' : '#374151',
                      color: '#f3f4f6',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {align.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Color</label>
              <ColorSlotPicker
                slot={segment.settings.headingColorSlot ?? null}
                customColor={segment.settings.headingColor ?? '#000000'}
                colors={colors}
                onSlotChange={(slot, color) => {
                  handleUpdate('headingColorSlot', slot);
                  handleUpdate('headingColor', color);
                }}
                onCustomColorChange={(color) => handleUpdate('headingColor', color)}
              />
            </div>
          </>
        )}
      </div>

      {/* Layout Picker */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Layout</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {Object.entries(LAYOUT_PRESETS).map(([key, preset]) => {
            const isActive = currentLayout === key;
            const blocks = LAYOUT_VISUALS[key]?.blocks || [12];
            return (
              <button
                key={key}
                onClick={() => handleLayoutChange(key)}
                title={preset.label}
                style={{
                  padding: '8px 6px',
                  backgroundColor: isActive ? '#1d4ed8' : '#374151',
                  border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {/* Visual block representation */}
                <div style={{ display: 'flex', gap: '2px', width: '100%', height: '16px' }}>
                  {blocks.map((span, i) => (
                    <div
                      key={i}
                      style={{
                        flex: span,
                        backgroundColor: isActive ? '#60a5fa' : '#6b7280',
                        borderRadius: '2px',
                        height: '100%'
                      }}
                    />
                  ))}
                </div>
                <span style={{
                  fontSize: '10px',
                  color: isActive ? '#93c5fd' : '#9ca3af',
                  whiteSpace: 'nowrap'
                }}>
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gap Selector */}
      <MobileOverrideWrap hasOverride={hasOverride('gap')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '6px' }}>Gap<MobileOverrideDot hasOverride={hasOverride('gap')} onClear={() => clearOverride('gap')} /></label>

        <div style={{ display: 'flex', gap: '4px' }}>
          {Object.entries(GAP_PRESETS).map(([key, preset]) => {
            const isActive = currentGap === key;
            return (
              <button
                key={key}
                onClick={() => handleUpdate('gap', key)}
                style={{
                  flex: 1,
                  padding: '6px 2px',
                  fontSize: '11px',
                  backgroundColor: isActive ? '#3b82f6' : '#374151',
                  color: isActive ? '#ffffff' : '#9ca3af',
                  border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('horizontalScroll')}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={getSetting('horizontalScroll', false)}
            onChange={(e) => handleUpdate('horizontalScroll', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Horizontal scroll<MobileOverrideDot hasOverride={hasOverride('horizontalScroll')} onClear={() => clearOverride('horizontalScroll')} />
        </label>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Segment becomes the scroll container. Slot content flows freely beyond slot bounds.
        </div>
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('bgColor') || hasOverride('bgType') || hasOverride('bgGradient')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '6px' }}>Background<MobileOverrideDot hasOverride={hasOverride('bgColor') || hasOverride('bgType') || hasOverride('bgGradient')} onClear={() => { clearOverride('bgColor'); clearOverride('bgType'); clearOverride('bgGradient'); }} /></label>
        <GradientPicker
          bgType={getSetting('bgType', 'solid')}
          bgColor={getSetting('bgColor', segment.settings.bgColor)}
          bgColorSlot={getSetting('bgColorSlot', segment.settings.bgColorSlot) ?? null}
          bgGradient={getSetting('bgGradient', segment.settings.bgGradient)}
          onUpdate={handleUpdate}
          onMergeUpdate={handleMergeUpdate}
          colors={colors}
        />
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('minHeight')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>Min Height (px)<MobileOverrideDot hasOverride={hasOverride('minHeight')} onClear={() => clearOverride('minHeight')} /></label>
        <input
          type="number"
          value={getSetting('minHeight', 200)}
          onChange={(e) => handleUpdate('minHeight', parseInt(e.target.value))}
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
      </MobileOverrideWrap>

      <MobileOverrideWrap hasOverride={hasOverride('maxHeight')}>
        <label style={{ fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>Max Height (px)<MobileOverrideDot hasOverride={hasOverride('maxHeight')} onClear={() => clearOverride('maxHeight')} /></label>
        <input
          type="number"
          value={getSetting('maxHeight', '') || ''}
          onChange={(e) => handleUpdate('maxHeight', e.target.value ? parseInt(e.target.value) : null)}
          placeholder="No limit"
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
      </MobileOverrideWrap>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Image URL</label>
        <input
          type="text"
          value={segment.settings.bgImage || ''}
          onChange={(e) => handleUpdate('bgImage', e.target.value || null)}
          placeholder="https://..."
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            fontSize: '12px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Video URL</label>
        <input
          type="text"
          value={segment.settings.bgVideo || ''}
          onChange={(e) => handleUpdate('bgVideo', e.target.value || null)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            fontSize: '12px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          Plays muted in background. Paste a YouTube URL.
        </div>
      </div>

      {segment.settings.bgVideo && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Video Fit</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { value: 'contain', label: 'Fit' },
              { value: 'cover', label: 'Fill' },
              { value: 'stretch', label: 'Stretch' }
            ].map(fit => {
              const bgVideoSize = segment.settings.bgVideoSize || 'fill';
              const isActive = (fit.value === 'stretch' ? '100% 100%' : (fit.value === 'cover' ? 'fill' : fit.value)) === bgVideoSize;
              return (
                <button
                  key={fit.value}
                  onClick={() => {
                    handleUpdate('bgVideoSize', fit.value === 'stretch' ? '100% 100%' : (fit.value === 'cover' ? 'fill' : fit.value));
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '12px',
                    backgroundColor: isActive ? '#3b82f6' : '#374151',
                    color: isActive ? '#93c5fd' : '#9ca3af',
                    border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: isActive ? '600' : '400'
                  }}
                >
                  {fit.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Fit: maintain aspect ratio • Fill: crop to fit • Stretch: ignore aspect ratio
          </div>
        </div>
      )}

      {segment.settings.bgImage && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Fit</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'contain', label: 'Fit' },
                { value: 'cover', label: 'Fill' },
                { value: 'custom', label: 'Size' }
              ].map(fit => {
                const bgSize = segment.settings.bgSize || 'cover';
                const isActive = fit.value === 'custom' ? bgSize !== 'contain' && bgSize !== 'cover' : bgSize === fit.value;
                return (
                  <button
                    key={fit.value}
                    onClick={() => {
                      if (fit.value === 'custom') {
                        handleUpdate('bgSize', '200px 200px');
                      } else {
                        handleUpdate('bgSize', fit.value);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '12px',
                      backgroundColor: isActive ? '#3b82f6' : '#374151',
                      color: isActive ? '#93c5fd' : '#9ca3af',
                      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: isActive ? '600' : '400'
                    }}
                  >
                    {fit.label}
                  </button>
                );
              })}
            </div>
          </div>

          {segment.settings.bgSize && segment.settings.bgSize !== 'contain' && segment.settings.bgSize !== 'cover' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Size</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width</label>
                  <input
                    type="text"
                    placeholder="200px"
                    value={(segment.settings.bgSize || '').split(' ')[0] || ''}
                    onChange={(e) => {
                      const height = (segment.settings.bgSize || '').split(' ')[1] || '200px';
                      handleUpdate('bgSize', `${e.target.value || '200px'} ${height}`);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#374151',
                      color: '#f3f4f6',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Height</label>
                  <input
                    type="text"
                    placeholder="200px"
                    value={(segment.settings.bgSize || '').split(' ')[1] || ''}
                    onChange={(e) => {
                      const width = (segment.settings.bgSize || '').split(' ')[0] || '200px';
                      handleUpdate('bgSize', `${width} ${e.target.value || '200px'}`);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#374151',
                      color: '#f3f4f6',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                e.g. 200px, 50%, auto
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Background Alignment</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↔</span>
                {[{ v: 'left', l: '←' }, { v: 'center', l: '—' }, { v: 'right', l: '→' }].map(({ v, l }) => (
                  <button key={v} onClick={() => handleUpdate('bgPositionX', v)} style={{
                    flex: 1, height: '28px', fontSize: '13px',
                    backgroundColor: (segment.settings.bgPositionX ?? 'left') === v ? '#3b82f6' : '#374151',
                    color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
                  }}>{l}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', lineHeight: '28px' }}>↕</span>
                {[{ v: 'top', l: '↑' }, { v: 'center', l: '—' }, { v: 'bottom', l: '↓' }].map(({ v, l }) => (
                  <button key={v} onClick={() => handleUpdate('bgPositionY', v)} style={{
                    flex: 1, height: '28px', fontSize: '13px',
                    backgroundColor: (segment.settings.bgPositionY ?? 'top') === v ? '#3b82f6' : '#374151',
                    color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer'
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={segment.settings.bgRepeat || false}
                onChange={(e) => handleUpdate('bgRepeat', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Repeat background
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Opacity</label>
            <input
              type="text"
              value={segment.settings.bgOpacity || ''}
              onChange={(e) => handleUpdate('bgOpacity', e.target.value)}
              placeholder="100%"
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Enter value like: 0.5, 50%, 80%
            </div>
          </div>
        </>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={segment.settings.borderEnabled || false}
            onChange={(e) => handleUpdate('borderEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Border
        </label>
        {segment.settings.borderEnabled && (
          <>
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Edges</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '120px', margin: '0 auto' }}>
                <div></div>
                <button
                  onClick={() => {
                    const currentEdges = segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true };
                    handleUpdate('borderEdges', { ...currentEdges, top: !currentEdges.top });
                  }}
                  style={{
                    padding: '8px',
                    fontSize: '12px',
                    backgroundColor: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).top ? '#3b82f6' : '#374151',
                    color: '#f3f4f6',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).top ? '600' : '400'
                  }}
                >
                  Top
                </button>
                <div></div>
                <button
                  onClick={() => {
                    const currentEdges = segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true };
                    handleUpdate('borderEdges', { ...currentEdges, left: !currentEdges.left });
                  }}
                  style={{
                    padding: '8px',
                    fontSize: '12px',
                    backgroundColor: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).left ? '#3b82f6' : '#374151',
                    color: '#f3f4f6',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).left ? '600' : '400'
                  }}
                >
                  Left
                </button>
                <div></div>
                <button
                  onClick={() => {
                    const currentEdges = segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true };
                    handleUpdate('borderEdges', { ...currentEdges, right: !currentEdges.right });
                  }}
                  style={{
                    padding: '8px',
                    fontSize: '12px',
                    backgroundColor: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).right ? '#3b82f6' : '#374151',
                    color: '#f3f4f6',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).right ? '600' : '400'
                  }}
                >
                  Right
                </button>
                <div></div>
                <button
                  onClick={() => {
                    const currentEdges = segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true };
                    handleUpdate('borderEdges', { ...currentEdges, bottom: !currentEdges.bottom });
                  }}
                  style={{
                    padding: '8px',
                    fontSize: '12px',
                    backgroundColor: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).bottom ? '#3b82f6' : '#374151',
                    color: '#f3f4f6',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: (segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true }).bottom ? '600' : '400'
                  }}
                >
                  Bottom
                </button>
                <div></div>
              </div>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Width (px)</label>
                <input
                  type="number"
                  value={segment.settings.borderWidth ?? 1}
                  min={1}
                  onChange={(e) => handleUpdate('borderWidth', parseInt(e.target.value) || 1)}
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
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Color</label>
                <ColorSlotPicker
                  slot={segment.settings.borderColorSlot ?? null}
                  customColor={segment.settings.borderColor ?? '#000000'}
                  colors={colors}
                  onSlotChange={(slot, color) => {
                    handleUpdate('borderColorSlot', slot);
                    handleUpdate('borderColor', color);
                  }}
                  onCustomColorChange={(color) => handleUpdate('borderColor', color)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={segment.settings.elevationEnabled || false}
            onChange={(e) => handleUpdate('elevationEnabled', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Elevation
        </label>
        {segment.settings.elevationEnabled && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af' }}>Shadow intensity</label>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{segment.settings.elevation ?? 4}</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={segment.settings.elevation ?? 4}
              onChange={(e) => handleUpdate('elevation', parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* Visibility */}
      <MobileOverrideWrap hasOverride={hasOverride('hidden')} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151', marginBottom: 0 }}>
        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibility</label>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isMobile ? !(getSetting('hidden', false)) : !(segment.settings.hidden || false)}
            onChange={(e) => handleUpdate('hidden', !e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Visible{isMobile ? ' on mobile' : ''}
          <MobileOverrideDot hasOverride={hasOverride('hidden')} onClear={() => clearOverride('hidden')} />
        </label>
        {isMobile && (
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', marginLeft: '24px' }}>
            Overrides desktop visibility on mobile
          </div>
        )}
      </MobileOverrideWrap>
    </div>
  );
}
