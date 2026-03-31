import React, { useRef } from 'react';

const inputStyle = {
  flex: 1,
  padding: '6px',
  backgroundColor: '#374151',
  color: '#f3f4f6',
  border: '1px solid #4b5563',
  borderRadius: '4px',
  fontSize: '12px',
  boxSizing: 'border-box'
};

export function GradientPicker({ bgType = 'solid', bgColor, bgGradient, onUpdate }) {
  const gradient = bgGradient || { color1: bgColor || '#ffffff', color2: '#000000', angle: 90 };
  const dialRef = useRef(null);
  const dragging = useRef(false);

  const updateGradient = (key, value) => {
    onUpdate('bgGradient', { ...gradient, [key]: value });
  };

  const getAngleFromPointer = (e) => {
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = Math.round(Math.atan2(e.clientX - cx, -(e.clientY - cy)) * (180 / Math.PI));
    if (angle < 0) angle += 360;
    return angle;
  };

  const handlePointerDown = (e) => {
    dragging.current = true;
    dialRef.current.setPointerCapture(e.pointerId);
    updateGradient('angle', getAngleFromPointer(e));
  };

  const handlePointerMove = (e) => {
    if (!dragging.current) return;
    updateGradient('angle', getAngleFromPointer(e));
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  return (
    <div>
      {/* Solid / Gradient toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {['solid', 'gradient'].map(mode => (
          <button
            key={mode}
            onClick={() => onUpdate('bgType', mode)}
            style={{
              flex: 1,
              padding: '5px',
              fontSize: '12px',
              backgroundColor: bgType === mode ? '#3b82f6' : '#374151',
              color: bgType === mode ? '#fff' : '#9ca3af',
              border: `1px solid ${bgType === mode ? '#3b82f6' : '#4b5563'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: bgType === mode ? '600' : '400',
              textTransform: 'capitalize'
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {bgType !== 'gradient' ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={bgColor || '#ffffff'}
            onChange={(e) => onUpdate('bgColor', e.target.value)}
            style={{ width: '40px', height: '40px', cursor: 'pointer', flexShrink: 0 }}
          />
          <input
            type="text"
            value={bgColor || ''}
            onChange={(e) => onUpdate('bgColor', e.target.value)}
            style={inputStyle}
          />
        </div>
      ) : (
        <div>
          {/* Preview bar */}
          <div style={{
            height: '20px',
            borderRadius: '4px',
            background: `linear-gradient(${gradient.angle}deg, ${gradient.color1}, ${gradient.color2})`,
            marginBottom: '10px',
            border: '1px solid #4b5563'
          }} />

          {/* Color 1 */}
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Color 1</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={gradient.color1}
              onChange={(e) => updateGradient('color1', e.target.value)}
              style={{ width: '40px', height: '40px', cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              type="text"
              value={gradient.color1}
              onChange={(e) => updateGradient('color1', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Color 2 */}
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Color 2</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="color"
              value={gradient.color2}
              onChange={(e) => updateGradient('color2', e.target.value)}
              style={{ width: '40px', height: '40px', cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              type="text"
              value={gradient.color2}
              onChange={(e) => updateGradient('color2', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Direction dial */}
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Direction</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div
              ref={dialRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #4b5563',
                background: '#374151',
                position: 'relative',
                cursor: 'grab',
                flexShrink: 0,
                userSelect: 'none'
              }}
            >
              {/* Indicator needle */}
              <div style={{
                position: 'absolute',
                left: 'calc(50% - 1px)',
                bottom: '50%',
                width: '2px',
                height: '14px',
                background: '#3b82f6',
                borderRadius: '2px',
                transformOrigin: 'center bottom',
                transform: `rotate(${gradient.angle}deg)`
              }} />
              {/* Center dot */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#4b5563',
                transform: 'translate(-50%, -50%)'
              }} />
            </div>
            <input
              type="number"
              value={gradient.angle}
              min="0"
              max="360"
              onChange={(e) => {
                let val = parseInt(e.target.value) || 0;
                val = ((val % 360) + 360) % 360;
                updateGradient('angle', val);
              }}
              style={{ width: '60px', padding: '6px', backgroundColor: '#374151', color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', fontSize: '12px' }}
            />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>deg</span>
          </div>
        </div>
      )}
    </div>
  );
}
