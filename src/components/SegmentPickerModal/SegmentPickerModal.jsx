import React, { useState, useEffect } from 'react';
import { segmentStorage } from '../../services/segmentStorage';
import { THEME } from '../../utils/constants';

export function SegmentPickerModal({ isOpen, onClose, onSelect, onEmptySelect }) {
  const [segments, setSegments] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSegments(segmentStorage.getAll());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this saved segment?')) {
      segmentStorage.delete(id);
      setSegments(segmentStorage.getAll());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: THEME.surface,
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: THEME.text
            }}>
              Add Segment
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: THEME.textMuted
            }}>
              Choose a saved segment or start with an empty one
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.textMuted,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Empty Segment Option */}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={onEmptySelect}
              style={{
                width: '100%',
                padding: '20px',
                backgroundColor: THEME.background,
                border: `2px dashed ${THEME.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = THEME.accent;
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.backgroundColor = THEME.background;
              }}
            >
              <span style={{
                fontSize: '24px',
                color: THEME.accent,
                fontWeight: 300
              }}>+</span>
              <span style={{
                fontSize: '15px',
                fontWeight: 500,
                color: THEME.text
              }}>
                Empty Segment
              </span>
            </button>
          </div>

          {/* Saved Segments */}
          {segments.length > 0 && (
            <>
              <h3 style={{
                fontSize: '13px',
                fontWeight: 600,
                color: THEME.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '16px'
              }}>
                Saved Segments
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    onClick={() => onSelect(segment)}
                    onMouseEnter={() => setHoveredId(segment.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      backgroundColor: THEME.background,
                      border: `1px solid ${hoveredId === segment.id ? THEME.accent : THEME.border}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative'
                    }}
                  >
                    {/* Preview */}
                    <SegmentPreview segment={segment.data} />

                    {/* Info */}
                    <div style={{
                      padding: '12px',
                      borderTop: `1px solid ${THEME.border}`
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: THEME.text,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {segment.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: THEME.textMuted
                      }}>
                        {new Date(segment.savedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Delete button on hover */}
                    {hoveredId === segment.id && (
                      <button
                        onClick={(e) => handleDelete(e, segment.id)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          border: 'none',
                          color: 'white',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {segments.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: THEME.textMuted,
              fontSize: '14px'
            }}>
              No saved segments yet. Save a segment from the settings panel to see it here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SegmentPreview({ segment }) {
  const settings = segment?.settings || {};
  const slots = segment?.children || [];
  const gap = settings.gap || 'md';
  
  const gapMap = { none: 4, sm: 6, md: 10, lg: 16, xl: 24 };
  const gapValue = gapMap[gap] || 10;

  // Build background style
  const backgroundStyle = buildBackgroundStyle(settings);
  
  // Border radius
  const borderRadius = settings.borderRadius || 0;
  
  // Border
  const borderStyle = settings.borderEnabled ? {
    border: `${settings.borderWidth || 1}px solid ${settings.borderColor || '#000000'}`
  } : {};
  
  // Shadow
  const shadowStyle = settings.elevationEnabled ? {
    boxShadow: `0 ${(settings.elevation || 4) / 3}px ${(settings.elevation || 4) / 1.5}px rgba(0,0,0,0.15)`
  } : {};

  return (
    <div style={{
      height: '160px',
      ...backgroundStyle,
      ...borderStyle,
      ...shadowStyle,
      borderRadius: `${borderRadius}px`,
      padding: '12px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background image overlay if exists */}
      {settings.bgImage && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${settings.bgImage})`,
          backgroundSize: settings.bgSize || 'cover',
          backgroundPosition: `${settings.bgPositionX || 'center'} ${settings.bgPositionY || 'center'}`,
          backgroundRepeat: settings.bgRepeat ? 'repeat' : 'no-repeat',
          opacity: settings.bgOpacity ? parseFloat(settings.bgOpacity) : 1,
          zIndex: 0
        }} />
      )}
      
      {/* Content layer */}
      <div style={{
        display: 'flex',
        gap: `${gapValue}px`,
        height: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {slots.map((slot, index) => (
          <SlotPreview key={slot.id || index} slot={slot} flex={1} />
        ))}
        {slots.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: settings.bgType === 'gradient' || settings.bgImage ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)',
            fontSize: '11px',
            fontWeight: 500
          }}>
            Empty Segment
          </div>
        )}
      </div>
    </div>
  );
}

function buildBackgroundStyle(settings) {
  const bgType = settings.bgType || 'solid';
  const bgColor = settings.bgColor || '#ffffff';
  const bgGradient = settings.bgGradient;
  
  if (bgType === 'gradient' && bgGradient) {
    const { color1, color2, angle } = bgGradient;
    const c1 = color1 || bgColor || '#ffffff';
    const c2 = color2 || '#000000';
    const a = angle ?? 90;
    return {
      background: `linear-gradient(${a}deg, ${c1}, ${c2})`
    };
  }
  
  return { backgroundColor: bgColor };
}

function SlotPreview({ slot, flex }) {
  const settings = slot?.settings || {};
  const items = slot?.children || [];
  const direction = settings.direction || 'column';
  const padding = settings.padding || 0;
  
  const isRow = direction === 'row';
  
  // Build background style (supports solid, gradient, transparent)
  const backgroundStyle = buildSlotBackgroundStyle(settings);
  
  // Border
  const borderStyle = settings.borderEnabled ? {
    border: `${settings.borderWidth || 1}px solid ${settings.borderColor || '#000000'}`
  } : {};
  
  // Shadow
  const shadowStyle = settings.elevationEnabled ? {
    boxShadow: `0 ${(settings.elevation || 4) / 4}px ${(settings.elevation || 4) / 2}px rgba(0,0,0,0.1)`
  } : {};
  
  const borderRadius = settings.borderRadius || 0;

  return (
    <div style={{
      flex,
      ...backgroundStyle,
      ...borderStyle,
      ...shadowStyle,
      borderRadius: `${borderRadius}px`,
      padding: `${padding}px`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: isRow ? 'row' : 'column',
      gap: '6px',
      alignItems: settings.verticalAlignment === 'center' ? 'center' : 
                  settings.verticalAlignment === 'bottom' ? 'flex-end' : 'flex-start',
      justifyContent: settings.contentAlignment === 'center' ? 'center' :
                       settings.contentAlignment === 'right' ? 'flex-end' : 'flex-start',
      position: 'relative'
    }}>
      {/* Background image for slot */}
      {settings.bgImage && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${settings.bgImage})`,
          backgroundSize: settings.bgSize || 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: settings.bgRepeat ? 'repeat' : 'no-repeat',
          zIndex: 0
        }} />
      )}
      
      {/* Content layer */}
      <div style={{
        display: 'flex',
        flexDirection: isRow ? 'row' : 'column',
        gap: '6px',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        alignItems: settings.verticalAlignment === 'center' ? 'center' : 
                    settings.verticalAlignment === 'bottom' ? 'flex-end' : 'flex-start',
        justifyContent: settings.contentAlignment === 'center' ? 'center' :
                         settings.contentAlignment === 'right' ? 'flex-end' : 'flex-start'
      }}>
        {items.length === 0 ? (
          <div style={{
            width: '100%',
            height: isRow ? '100%' : '20px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '2px'
          }} />
        ) : (
          items.slice(0, 4).map((item, index) => (
            <ContentPreview key={item.id || index} item={item} />
          ))
        )}
        {items.length > 4 && (
          <div style={{
            fontSize: '9px',
            color: 'rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            +{items.length - 4} more
          </div>
        )}
      </div>
    </div>
  );
}

function buildSlotBackgroundStyle(settings) {
  const bgType = settings.bgType || 'solid';
  const bgColor = settings.bgColor || 'transparent';
  const bgGradient = settings.bgGradient;
  
  if (bgType === 'gradient' && bgGradient) {
    const { color1, color2, angle } = bgGradient;
    const c1 = color1 || bgColor || '#ffffff';
    const c2 = color2 || '#000000';
    const a = angle ?? 90;
    return {
      background: `linear-gradient(${a}deg, ${c1}, ${c2})`
    };
  }
  
  if (bgColor === 'transparent') {
    return { backgroundColor: 'rgba(255,255,255,0.3)' };
  }
  
  return { backgroundColor: bgColor };
}

function ContentPreview({ item }) {
  const type = item?.type;
  const settings = item?.settings || {};
  const overrides = settings.customOverrides || {};

  switch (type) {
    case 'text':
      return <TextPreview settings={settings} overrides={overrides} />;
    case 'image':
      return <ImagePreview overrides={overrides} />;
    case 'button':
      return <ButtonPreview overrides={overrides} />;
    case 'card':
      return <CardPreview settings={settings} />;
    case 'video':
      return <VideoPreview />;
    default:
      return <div style={{ fontSize: '9px', color: 'rgba(0,0,0,0.3)' }}>{type}</div>;
  }
}

function TextPreview({ settings, overrides }) {
  const textRole = settings.textRole || 'body';
  const content = overrides.content || 'Text';
  const color = settings.color;
  
  const roleStyles = {
    heading1: { fontSize: '14px', fontWeight: 700, lineHeight: 1.2 },
    heading2: { fontSize: '12px', fontWeight: 600, lineHeight: 1.3 },
    body: { fontSize: '10px', fontWeight: 400, lineHeight: 1.4 },
    label: { fontSize: '9px', fontWeight: 500, lineHeight: 1.3 }
  };
  
  const style = roleStyles[textRole] || roleStyles.body;
  
  // Truncate long text
  const displayText = content.length > 60 ? content.slice(0, 60) + '...' : content;
  
  return (
    <div style={{
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      color: color || 'rgba(0,0,0,0.7)',
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      maxWidth: '100%'
    }}>
      {displayText}
    </div>
  );
}

function ImagePreview({ overrides }) {
  const src = overrides.src;
  const objectFit = overrides.objectFit || 'cover';
  
  if (!src) {
    return (
      <div style={{
        width: '100%',
        height: '40px',
        backgroundColor: 'rgba(0,0,0,0.08)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        color: 'rgba(0,0,0,0.3)'
      }}>
        IMG
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt=""
      style={{
        width: '100%',
        height: '50px',
        objectFit,
        borderRadius: '4px'
      }}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  );
}

function ButtonPreview({ overrides }) {
  const label = overrides.label || 'Button';
  const sizeOverride = overrides.sizeOverride || {};
  
  return (
    <div style={{
      display: 'inline-flex',
      padding: '4px 10px',
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '4px',
      fontSize: '9px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>
      {label}
    </div>
  );
}

function CardPreview({ settings }) {
  const cardSettings = settings || {};
  const { showImage, showText, showButton } = cardSettings;
  
  return (
    <div style={{
      width: '100%',
      backgroundColor: cardSettings.bgColor || 'white',
      borderRadius: `${cardSettings.borderRadius || 8}px`,
      padding: '6px',
      border: cardSettings.borderEnabled ? `1px solid ${cardSettings.borderColor || '#e5e7eb'}` : 'none',
      boxShadow: cardSettings.elevationEnabled ? `0 ${cardSettings.elevation / 4}px ${cardSettings.elevation / 2}px rgba(0,0,0,0.1)` : 'none'
    }}>
      {showImage !== false && (
        <div style={{
          width: '100%',
          height: '35px',
          backgroundColor: 'rgba(0,0,0,0.08)',
          borderRadius: '3px',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: 'rgba(0,0,0,0.3)'
        }}>
          IMG
        </div>
      )}
      {showText !== false && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(0,0,0,0.8)',
            marginBottom: '2px'
          }}>
            {cardSettings.text?.content?.slice(0, 20) || 'Title'}
          </div>
        </div>
      )}
      {showButton !== false && (
        <div style={{
          display: 'inline-flex',
          padding: '3px 8px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '3px',
          fontSize: '8px',
          fontWeight: 500
        }}>
          {cardSettings.button?.label || 'Action'}
        </div>
      )}
    </div>
  );
}

function VideoPreview() {
  return (
    <div style={{
      width: '100%',
      height: '40px',
      backgroundColor: 'rgba(0,0,0,0.08)',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '9px',
      color: 'rgba(0,0,0,0.3)'
    }}>
      ▶ Video
    </div>
  );
}
