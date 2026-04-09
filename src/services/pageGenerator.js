import { renderVideo } from '../utils/video.js';
import { getButtonIcon } from '../utils/buttonIcons';
import { GAP_PRESETS } from '../store/pageTypes';

function darkenHex(hex, amount = 0.15) {
  if (!hex || typeof hex !== 'string') return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getTextStyle(customOverrides, defaultColor) {
  const textType = customOverrides.textType;
  const color = customOverrides.color;
  const textGradient = customOverrides.textGradient;
  
  if (textType === 'gradient' && textGradient) {
    const gradient = `linear-gradient(${textGradient.angle || 90}deg, ${textGradient.color1 || '#000000'}, ${textGradient.color2 || '#ffffff'})`;
    return {
      background: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent'
    };
  }
  
  return { color: color || defaultColor };
}

export function generateHTML(page, selectedElementId, options = {}) {
  const { showGridOverlay = false } = options;
  const segments = page.root.map(segment => renderSegment(segment, page)).join('\n');

  const selectionStyle = selectedElementId ? `
  <style>
    @keyframes selection-pulse {
      0%   { box-shadow: inset 0 0 0 2px rgba(99,102,241,0.9), inset 0 0 8px 0 rgba(99,102,241,0.6); }
      25%  { box-shadow: inset 0 0 0 2px rgba(99,102,241,0.8), inset 0 0 16px 2px rgba(99,102,241,0.3); }
      50%  { box-shadow: inset 0 0 0 2px rgba(99,102,241,0.9), inset 0 0 8px 0 rgba(99,102,241,0.6); }
      75%  { box-shadow: inset 0 0 0 2px rgba(99,102,241,0.6), inset 0 0 8px 0 rgba(99,102,241,0.3); }
      100% { box-shadow: inset 0 0 0 2px rgba(99,102,241,0), inset 0 0 8px 0 rgba(99,102,241,0); }
    }
    @keyframes image-pulse {
      0%   { box-shadow: inset 0 0 0 3px rgba(99,102,241,1), inset 0 0 12px 0 rgba(99,102,241,0.8), 0 0 8px rgba(99,102,241,0.5); }
      25%  { box-shadow: inset 0 0 0 3px rgba(99,102,241,0.9), inset 0 0 20px 4px rgba(99,102,241,0.5), 0 0 16px rgba(99,102,241,0.8); }
      50%  { box-shadow: inset 0 0 0 3px rgba(99,102,241,1), inset 0 0 12px 0 rgba(99,102,241,0.8), 0 0 8px rgba(99,102,241,0.5); }
      75%  { box-shadow: inset 0 0 0 3px rgba(99,102,241,0.6), inset 0 0 12px 0 rgba(99,102,241,0.4), 0 0 8px rgba(99,102,241,0.3); }
      100% { box-shadow: inset 0 0 0 3px rgba(99,102,241,0), inset 0 0 12px 0 rgba(99,102,241,0), 0 0 8px rgba(99,102,241,0); }
    }
    [data-element-id="${selectedElementId}"] {
      animation: selection-pulse 3s ease-in-out forwards;
    }
    img[data-element-id="${selectedElementId}"] {
      animation: image-pulse 3s ease-in-out forwards;
      border-radius: 4px;
    }
  </style>` : '';

  const gridOverlayHtml = showGridOverlay ? `
  <div style="position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:9999">
    <div class="grid grid-cols-12 gap-6 max-w-[1200px] mx-auto h-full" style="padding:0 40px">
      ${Array.from({ length: 12 }, () => '<div class="col-span-1" style="background:rgba(99,102,241,0.08);height:100%"></div>').join('\n      ')}
    </div>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>${page.title}</title>
  <style>
    ${generateCSS(page)}
  </style>${selectionStyle}
</head>
<body>
  <div id="app">
    ${segments}
  </div>
  ${gridOverlayHtml}
</body>
</html>`;
}

function renderSegment(segment, page) {
  const maxWidth = segment.settings.maxWidth;
  const bgSize = segment.settings.bgSize || 'cover';
  const gapKey = segment.settings.gap || 'md';
  const gapPreset = GAP_PRESETS[gapKey] || GAP_PRESETS.md;

  const getBackgroundPosition = (hAlign, vAlign) => {
    const hMap = { left: 'left', center: 'center', right: 'right' };
    const vMap = { top: 'top', center: 'center', bottom: 'bottom' };
    const h = hMap[hAlign] || 'center';
    const v = vMap[vAlign] || 'center';
    return `${h} ${v}`;
  };
  const bgPosition = segment.settings.bgImage
    ? getBackgroundPosition(
        segment.settings.bgPositionX || segment.settings.contentAlignment || 'left',
        segment.settings.bgPositionY || segment.settings.verticalAlignment || 'top'
      )
    : undefined;

  const isGradient = segment.settings.bgType === 'gradient' && segment.settings.bgGradient;
  const gradientBg = isGradient
    ? `linear-gradient(${segment.settings.bgGradient.angle}deg, ${segment.settings.bgGradient.color1}, ${segment.settings.bgGradient.color2})`
    : undefined;
  const hasBgImage = !!segment.settings.bgImage;

  const outerStyle = buildStyleString({
    display: 'flex',
    flexDirection: 'column',
    minHeight: `${segment.settings.minHeight ?? 200}px`,
    maxHeight: segment.settings.maxHeight ? `${segment.settings.maxHeight}px` : undefined,
    backgroundColor: segment.settings.bgColor || page.styles.colors.background,
    backgroundImage: isGradient ? gradientBg : undefined,
    backgroundSize: isGradient ? 'cover' : undefined,
    backgroundPosition: isGradient ? 'center' : undefined,
    backgroundRepeat: isGradient ? 'no-repeat' : undefined,
    padding: `${segment.settings.padding}px`,
    margin: `${segment.settings.margin}px`,
    border: segment.settings.borderEnabled
      ? `${segment.settings.borderWidth ?? 1}px solid ${segment.settings.borderColor ?? '#000000'}`
      : undefined,
    filter: segment.settings.elevationEnabled
      ? `drop-shadow(0 ${segment.settings.elevation ?? 4}px ${(segment.settings.elevation ?? 4) * 3}px rgba(0,0,0,${0.2 + (segment.settings.elevation ?? 4) * 0.02}))`
      : undefined,
    borderRadius: `${segment.settings.borderRadius ?? 0}px`,
    overflow: segment.settings.bgVideo ? 'hidden' : 'visible',
    position: (segment.settings.bgVideo || hasBgImage || isGradient) ? 'relative' : undefined
  });

  // Build Tailwind grid classes for the inner wrapper
  const gridClasses = [
    'grid', 'grid-cols-12',
    gapPreset.twClass
  ];
  if (maxWidth) gridClasses.push(`max-w-[${maxWidth}px]`, 'mx-auto');

  const children = segment.children.map(child => {
    if (child.type === 'slot' || child.type === 'container') {
      return renderSlot(child, page);
    } else {
      return renderContentItem(child, page);
    }
  }).join('\n');

  const segmentVideoBg = segment.settings.bgVideo
    ? renderVideo(segment.settings.bgVideo, {
        isBackground: true,
        bgSize: segment.settings.bgVideoSize || 'fill',
        bgPositionX: segment.settings.bgVideoPositionX || 'center',
        bgPositionY: segment.settings.bgVideoPositionY || 'center'
      })
    : '';

  const innerZIndexStyle = hasBgImage || segment.settings.bgVideo ? ' style="position:relative;z-index:1"' : '';

  // Add pseudo-element for background image when needed
  const bgImageOverlay = hasBgImage ? `
    <style>
      [data-element-id="${segment.id}"]::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url(${segment.settings.bgImage});
        background-size: ${bgSize};
        background-position: ${bgPosition};
        background-repeat: ${segment.settings.bgRepeat ? 'repeat' : 'no-repeat'};
        ${segment.settings.bgOpacity ? `opacity: ${segment.settings.bgOpacity};` : ''}
        z-index: 0;
        border-radius: ${segment.settings.borderRadius ?? 0}px;
      }
    </style>` : '';

  return `<section style="${outerStyle}" data-element-id="${segment.id}">
  ${segmentVideoBg}
  ${bgImageOverlay}
  <div class="${gridClasses.join(' ')}"${innerZIndexStyle}>
    ${children}
  </div>
</section>`;
}

function renderSlot(slot, page) {
  const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const vMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
  const direction = slot.settings.direction ?? 'column';
  const hAlign = hMap[slot.settings.contentAlignment] || 'flex-start';
  const vAlign = vMap[slot.settings.verticalAlignment] || 'flex-start';
  const bgSize = slot.settings.bgSize || 'cover';
  const spacing = slot.settings.spacing;
  const isAutoSpacing = spacing === 'auto';

  const getBackgroundPosition = (hAlignVal, vAlignVal) => {
    const hMapLocal = { left: 'left', center: 'center', right: 'right' };
    const vMapLocal = { top: 'top', center: 'center', bottom: 'bottom' };
    return `${hMapLocal[hAlignVal] || 'center'} ${vMapLocal[vAlignVal] || 'center'}`;
  };
  const bgPosition = slot.settings.bgImage
    ? getBackgroundPosition(
        slot.settings.bgPositionX || slot.settings.contentAlignment || 'left',
        slot.settings.bgPositionY || slot.settings.verticalAlignment || 'top'
      )
    : undefined;

  const isGradient = slot.settings.bgType === 'gradient' && slot.settings.bgGradient;
  const hasBgImage = !!slot.settings.bgImage;
  const slotVideoBg = slot.settings.bgVideo
    ? renderVideo(slot.settings.bgVideo, {
        isBackground: true,
        bgSize: slot.settings.bgVideoSize || 'fill',
        bgPositionX: slot.settings.bgVideoPositionX || 'center',
        bgPositionY: slot.settings.bgVideoPositionY || 'center'
      })
    : '';

  // Tailwind classes for grid column and responsive behaviour
  const span = slot.settings.gridColumn ?? 12;
  const twClasses = ['col-span-12'];
  if (span !== 12) twClasses.push(`md:col-span-${span}`);

  // Responsive visibility
  const resp = slot.settings.responsive;
  if (resp?.hideOnMobile) twClasses.push('hidden', 'md:block');
  if (resp?.mobileOrder != null) {
    twClasses.push(`order-${resp.mobileOrder}`, 'md:order-none');
  }

  // Inline styles for visual properties
  const styleObj = {
    height: (slot.settings.height && slot.settings.height !== 'auto') ? slot.settings.height : undefined,
    display: (slot.settings.bgVideo || hasBgImage) ? 'block' : 'flex',
    ...(slot.settings.bgVideo || hasBgImage ? {} : {
      flexDirection: direction,
      flexWrap: (direction === 'row') ? 'wrap' : undefined,
      gap: isAutoSpacing ? undefined : `${typeof spacing === 'number' ? spacing : 16}px`,
      justifyContent: isAutoSpacing
        ? 'space-between'
        : (direction === 'row' ? hAlign : vAlign),
      alignItems: direction === 'row' ? vAlign : hAlign
    })
  };

  if (!isGradient && slot.settings.bgColor && slot.settings.bgColor !== 'transparent') {
    styleObj.backgroundColor = slot.settings.bgColor;
  }
  if (isGradient) {
    const { angle, color1, color2 } = slot.settings.bgGradient;
    styleObj.backgroundImage = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
    styleObj.backgroundSize = 'cover';
    styleObj.backgroundPosition = 'center';
    styleObj.backgroundRepeat = 'no-repeat';
  }
  if (slot.settings.padding) {
    styleObj.padding = `${slot.settings.padding}px`;
  }

  styleObj.border = slot.settings.borderEnabled
    ? `${slot.settings.borderWidth ?? 1}px solid ${slot.settings.borderColor ?? '#000000'}`
    : undefined;
  styleObj.filter = slot.settings.elevationEnabled
    ? `drop-shadow(0 ${slot.settings.elevation ?? 4}px ${(slot.settings.elevation ?? 4) * 3}px rgba(0,0,0,${0.2 + (slot.settings.elevation ?? 4) * 0.02}))`
    : undefined;
  styleObj.borderRadius = `${slot.settings.borderRadius ?? 0}px`;
  styleObj.overflow = (slot.settings.bgVideo || slot.settings.borderRadius > 0) ? 'hidden' : 'visible';
  if (slot.settings.bgVideo || hasBgImage || isGradient) styleObj.position = 'relative';

  const style = buildStyleString(styleObj);
  const children = slot.children.map(child => renderContentItem(child, page)).join('\n');

  const childrenWrapped = (slot.settings.bgVideo || hasBgImage)
    ? `<div style="position:relative;z-index:1;display:flex;flex-direction:${direction};flex-wrap:${direction === 'row' ? 'wrap' : 'unset'};gap:${isAutoSpacing ? 'unset' : `${typeof spacing === 'number' ? spacing : 16}px`};justify-content:${isAutoSpacing ? 'space-between' : (direction === 'row' ? hAlign : vAlign)};align-items:${direction === 'row' ? vAlign : hAlign};width:100%;height:100%">${children}</div>`
    : (children || '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;border:1px dashed #d1d5db;border-radius:4px">Drop content here</div>');

  // Add pseudo-element for background image when needed
  const slotBgImageOverlay = hasBgImage ? `
    <style>
      [data-element-id="${slot.id}"]::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url(${slot.settings.bgImage});
        background-size: ${bgSize};
        background-position: ${bgPosition};
        background-repeat: ${slot.settings.bgRepeat ? 'repeat' : 'no-repeat'};
        ${slot.settings.bgOpacity ? `opacity: ${slot.settings.bgOpacity};` : ''}
        z-index: 0;
        border-radius: ${slot.settings.borderRadius ?? 0}px;
      }
    </style>` : '';

  return `<div class="${twClasses.join(' ')}" style="${style}" data-element-id="${slot.id}">
    ${slotVideoBg}
    ${slotBgImageOverlay}
    ${childrenWrapped}
  </div>`;
}

function sizeOverrides(item) {
  const overrides = item.settings?.customOverrides ?? {};
  return { width: overrides.width || undefined, height: overrides.height || undefined };
}

function getContentResponsiveClasses(item) {
  const r = item.settings?.responsive;
  if (!r) return '';
  const classes = [];
  if (r.hideOnMobile) classes.push('hidden md:block');
  if (r.hideOnDesktop) classes.push('md:hidden');
  return classes.join(' ');
}

function wrapWithResponsive(html, item) {
  const classes = getContentResponsiveClasses(item);
  if (!classes) return html;
  return `<div class="${classes}">${html}</div>`;
}

function renderContentItem(item, page) {
  const rendered = renderContentItemInner(item, page);
  return wrapWithResponsive(rendered, item);
}

function renderContentItemInner(item, page) {
  switch (item.type) {
    case 'text': {
      const role = item.settings.textRole || 'body';
      const { width, height } = sizeOverrides(item);
      const textAlign = item.settings.textAlign || 'left';
      const customOverrides = item.settings?.customOverrides || {};

      if (role === 'heading1') {
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading1-family)',
          fontSize: 'var(--font-heading1-size)',
          fontWeight: 'var(--font-heading1-weight)',
          lineHeight: '1.2',
          width: width ?? 'max-content',
          height,
          textAlign,
          ...textStyle
        });
        return `<h1 style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</h1>`;
      }
      if (role === 'heading2') {
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading2-family)',
          fontSize: 'var(--font-heading2-size)',
          fontWeight: 'var(--font-heading2-weight)',
          lineHeight: '1.3',
          width: width ?? 'max-content',
          height,
          textAlign,
          ...textStyle
        });
        return `<h2 style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</h2>`;
      }
      if (role === 'body') {
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-body-family)',
          fontSize: 'var(--font-body-size)',
          fontWeight: 'var(--font-body-weight)',
          lineHeight: '1.6',
          width: width ?? 'max-content',
          height,
          textAlign,
          ...textStyle
        });
        return `<p style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</p>`;
      }
      if (role === 'label') {
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-label-family)',
          fontSize: 'var(--font-label-size)',
          fontWeight: 'var(--font-label-weight)',
          lineHeight: '1.4',
          width: width ?? 'max-content',
          height,
          textAlign,
          display: 'inline-block',
          ...textStyle
        });
        return `<span class="label" style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</span>`;
      }
      const textStyle = getTextStyle(customOverrides, page.styles.colors.text);
      return `<p style="${buildStyleString({ margin: '0', width: width ?? 'max-content', height, textAlign, ...textStyle })}" data-element-id="${item.id}">${customOverrides.content || ''}</p>`;
    }

    case 'image': {
      const { width, height } = sizeOverrides(item);
      const customOverrides = item.settings?.customOverrides || {};
      const objectFit = customOverrides.objectFit || 'cover';
      const borderRadius = customOverrides.borderRadius;
      const opacity = customOverrides.opacity;
      const imgStyle = buildStyleString({
        display: 'block',
        width: width ?? '300px',
        height: height ?? 'auto',
        maxWidth: '100%',
        objectFit: objectFit === '100% 100%' ? undefined : objectFit,
        objectPosition: 'center',
        ...(borderRadius && { borderRadius }),
        ...(opacity && { opacity })
      });
      const styleStr = objectFit === '100% 100%'
        ? `${imgStyle}; object-fit: cover; object-position: center; width: 100%; height: 100%;`
        : imgStyle;
      return `<img src="${customOverrides.src || ''}" alt="" style="${styleStr}" data-element-id="${item.id}" />`;
    }

    case 'button': {
      const buttonStyles = page.styles.buttonStyles || [];
      const buttonStyle = buttonStyles.find(s => s.id === item.settings.assignedStyleId)
        || buttonStyles[0];
      const isGradient = buttonStyle?.bgType === 'gradient' && buttonStyle?.bgGradient;

      // Background
      const bgColor = item.settings.customOverrides?.bgColor || buttonStyle?.bgColor || '#3b82f6';
      const background = isGradient
        ? `linear-gradient(${buttonStyle.bgGradient.angle ?? 90}deg, ${buttonStyle.bgGradient.color1}, ${buttonStyle.bgGradient.color2})`
        : bgColor;
      const isOutline = buttonStyle?.bgColor === 'transparent' && !isGradient;

      // sizeOverride (button-specific) takes priority over element-level size overrides
      const so = item.settings.customOverrides?.sizeOverride;
      const { width: elWidth, height: elHeight } = sizeOverrides(item);
      const width = (so?.enabled && so.width && so.width !== 'auto') ? so.width : elWidth;
      const height = (so?.enabled && so.height && so.height !== 'auto') ? so.height : elHeight;

      const textColor = item.settings.customOverrides?.textColor || buttonStyle?.textColor || '#ffffff';
      const fontSize = `${buttonStyle?.fontSize ?? 14}px`;

      // Icon
      const iconData = item.settings.customOverrides?.icon;
      const iconSvg = (iconData?.position !== 'none' && iconData?.key)
        ? getButtonIcon(iconData.key)
        : null;
      const label = item.settings.customOverrides?.label || 'Button';
      const iconStyle = 'display:inline-flex;align-items:center;vertical-align:middle;margin-right:4px;';
      const iconAfterStyle = 'display:inline-flex;align-items:center;vertical-align:middle;margin-left:4px;';
      const innerContent = iconSvg
        ? iconData.position === 'before'
          ? `<span style="${iconStyle}">${iconSvg}</span>${label}`
          : `${label}<span style="${iconAfterStyle}">${iconSvg}</span>`
        : label;

      const btnStyle = buildStyleString({
        display: 'inline-block',
        background: background,
        color: textColor,
        padding: `${buttonStyle?.padding || 12}px 24px`,
        borderRadius: `${buttonStyle?.radius ?? 6}px`,
        border: isOutline ? `1.5px solid ${textColor}` : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-button-family)',
        fontWeight: 'var(--font-button-weight)',
        fontSize,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        width,
        height
      });

      const btnClass = `btn-${(buttonStyle?.id || 'primary').replace(/[^a-z0-9-_]/gi, '-')}`;
      return `<button class="${btnClass}" style="${btnStyle}" data-element-id="${item.id}">${innerContent}</button>`;
    }

    case 'video': {
      const { width, height } = sizeOverrides(item);
      const customOverrides = item.settings?.customOverrides || {};
      const videoUrl = customOverrides.src || '';
      const objectFit = customOverrides.objectFit || 'cover';
      
      if (!videoUrl) {
        return `<div style="${buildStyleString({ width: width ?? '560px', height: height ?? '315px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' })}" data-element-id="${item.id}">No video URL set</div>`;
      }
      
      const videoStyle = {
        width: width ?? '560px',
        height: height ?? '315px',
        objectFit: objectFit === '100% 100%' ? 'cover' : objectFit
      };
      
      // For stretch mode, we need special handling
      if (objectFit === '100% 100%') {
        videoStyle.width = '100%';
        videoStyle.height = '100%';
        videoStyle.objectFit = 'cover';
      }
      
      return renderVideo(videoUrl, { style: videoStyle, isBackground: false });
    }

    case 'card': {
      const { width, height } = sizeOverrides(item);
      const settings = item.settings || {};
      
      // Map alignment values to flexbox values
      const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
      const vMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
      const hAlign = hMap[settings.contentAlignment] || 'flex-start';
      const vAlign = vMap[settings.verticalAlignment] || 'flex-start';
      
      const cardStyle = buildStyleString({
        width: settings.width || (width ?? '300px'),
        height: settings.height || (height ?? 'auto'),
        minWidth: '200px',
        backgroundColor: settings.bgType === 'gradient' 
          ? `linear-gradient(${settings.bgGradient?.angle ?? 90}deg, ${settings.bgGradient?.color1}, ${settings.bgGradient?.color2})`
          : settings.bgColor || '#ffffff',
        backgroundImage: settings.bgType === 'gradient' ? undefined : undefined,
        backgroundSize: settings.bgType === 'gradient' ? 'cover' : undefined,
        backgroundPosition: settings.bgType === 'gradient' ? 'center' : undefined,
        backgroundRepeat: settings.bgType === 'gradient' ? 'no-repeat' : undefined,
        padding: `${settings.padding || 20}px`,
        border: settings.borderEnabled 
          ? `${settings.borderWidth ?? 1}px solid ${settings.borderColor || '#e5e7eb'}`
          : 'none',
        borderRadius: `${settings.borderRadius || 8}px`,
        filter: settings.elevationEnabled
          ? `drop-shadow(0 ${settings.elevation ?? 4}px ${(settings.elevation ?? 4) * 3}px rgba(0,0,0,${0.2 + (settings.elevation ?? 4) * 0.02}))`
          : undefined,
        display: 'flex',
        flexDirection: settings.direction || 'column',
        justifyContent: vAlign,
        alignItems: hAlign,
        gap: typeof settings.spacing === 'string' ? settings.spacing : `${settings.spacing || 12}px`,
        boxSizing: 'border-box'
      });

      const imageHtml = settings.image?.src && settings.showImage !== false ? `
        <img src="${settings.image.src}" 
             style="${buildStyleString({
               width: settings.image?.width || '100%',
               height: settings.image?.height || '200px',
               objectFit: settings.image?.objectFit || 'cover',
               borderRadius: settings.image?.borderRadius || '4px'
             })}" 
             alt="" />` : '';

      const textHtml = settings.text?.content && settings.showText !== false ? `
        <${settings.text.textRole === 'heading1' ? 'h1' : settings.text.textRole === 'heading2' ? 'h2' : settings.text.textRole === 'label' ? 'span' : 'p'}
          style="${buildStyleString({
            margin: '0',
            fontFamily: `var(--font-${settings.text.textRole || 'body'}-family)`,
            fontSize: `var(--font-${settings.text.textRole || 'body'}-size)`,
            fontWeight: `var(--font-${settings.text.textRole || 'body'}-weight)`,
            lineHeight: settings.text.textRole === 'heading1' ? '1.2' : settings.text.textRole === 'heading2' ? '1.3' : settings.text.textRole === 'label' ? '1.4' : '1.6',
            textAlign: settings.text.textAlign || 'left',
            color: settings.text.color || page.styles.colors.text
          })}">${settings.text.content}</${settings.text.textRole === 'heading1' ? 'h1' : settings.text.textRole === 'heading2' ? 'h2' : settings.text.textRole === 'label' ? 'span' : 'p'}>` : '';

      const buttonHtml = settings.button?.label && settings.showButton !== false ? (() => {
        const buttonStyles = page.styles.buttonStyles || [];
        const buttonStyle = buttonStyles.find(s => s.id === settings.button.assignedStyleId)
          || buttonStyles[0];
        const isGradient = buttonStyle?.bgType === 'gradient' && buttonStyle?.bgGradient;

        const bgColor = buttonStyle?.bgColor || '#3b82f6';
        const background = isGradient
          ? `linear-gradient(${buttonStyle.bgGradient.angle ?? 90}deg, ${buttonStyle.bgGradient.color1}, ${buttonStyle.bgGradient.color2})`
          : bgColor;
        const isOutline = buttonStyle?.bgColor === 'transparent' && !isGradient;

        const so = settings.button.sizeOverride;
        const width = (so?.enabled && so.width && so.width !== 'auto') ? so.width : 'auto';
        const height = (so?.enabled && so.height && so.height !== 'auto') ? so.height : 'auto';

        const textColor = buttonStyle?.textColor || '#ffffff';
        const fontSize = `${buttonStyle?.fontSize ?? 14}px`;

        const iconData = settings.button.icon;
        const iconSvg = (iconData?.position !== 'none' && iconData?.key)
          ? getButtonIcon(iconData.key)
          : null;
        const label = settings.button.label || 'Button';
        const iconStyle = 'display:inline-flex;align-items:center;vertical-align:middle;margin-right:4px;';
        const iconAfterStyle = 'display:inline-flex;align-items:center;vertical-align:middle;margin-left:4px;';
        const innerContent = iconSvg
          ? iconData.position === 'before'
            ? `<span style="${iconStyle}">${iconSvg}</span>${label}`
            : `${label}<span style="${iconAfterStyle}">${iconSvg}</span>`
          : label;

        const btnStyle = buildStyleString({
          display: 'inline-block',
          background: background,
          color: textColor,
          padding: `${buttonStyle?.padding || 12}px 24px`,
          borderRadius: `${buttonStyle?.radius ?? 6}px`,
          border: isOutline ? `1.5px solid ${textColor}` : 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-button-family)',
          fontWeight: 'var(--font-button-weight)',
          fontSize,
          whiteSpace: 'nowrap',
          textDecoration: 'none',
          width,
          height
        });

        return `<button style="${btnStyle}">${innerContent}</button>`;
      })() : '';

      return `<div style="${cardStyle}" data-element-id="${item.id}">
        ${imageHtml}
        ${textHtml}
        ${buttonHtml}
      </div>`;
    }

    default:
      return '';
  }
}

function buildStyleString(styleObj) {
  return Object.entries(styleObj)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
}

export function generateCSS(page) {
  const colors = page.styles.colors;
  const fonts = page.styles.fonts;
  const spacing = page.styles.spacing ?? { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 };

  const googleFontsImport = generateGoogleFontsImport(fonts);

  return `
    ${googleFontsImport}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-neutral: ${colors.neutral};
      --font-heading1-family: ${fonts.heading1?.family ?? 'Inter'}, sans-serif;
      --font-heading1-size: ${fonts.heading1?.size ?? 48}px;
      --font-heading1-weight: ${fonts.heading1?.weight ?? 700};
      --font-heading2-family: ${fonts.heading2?.family ?? 'Inter'}, sans-serif;
      --font-heading2-size: ${fonts.heading2?.size ?? 32}px;
      --font-heading2-weight: ${fonts.heading2?.weight ?? 600};
      --font-body-family: ${fonts.body?.family ?? 'Inter'}, sans-serif;
      --font-body-size: ${fonts.body?.size ?? 16}px;
      --font-body-weight: ${fonts.body?.weight ?? 400};
      --font-label-family: ${fonts.label?.family ?? 'Inter'}, sans-serif;
      --font-label-size: ${fonts.label?.size ?? 12}px;
      --font-label-weight: ${fonts.label?.weight ?? 500};
      --font-button-family: ${fonts.button?.family ?? 'Inter'}, sans-serif;
      --font-button-weight: ${fonts.button?.weight ?? 500};
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
    body { background-color: ${page.styles.bgColor ?? '#f9fafb'}; }
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
    ${(page.styles.buttonStyles || []).map(bs => {
      const isGradient = bs.bgType === 'gradient' && bs.bgGradient;
      const hoverBg = isGradient
        ? `linear-gradient(${bs.bgGradient.angle ?? 90}deg, ${darkenHex(bs.bgGradient.color1)}, ${darkenHex(bs.bgGradient.color2)})`
        : darkenHex(bs.bgColor || '#3b82f6');
      const isOutline = bs.bgColor === 'transparent' && bs.bgType !== 'gradient';
      if (isOutline) return ''; // skip hover for transparent/outline buttons
      const safeId = (bs.id || 'primary').replace(/[^a-z0-9-_]/gi, '-');
      return `.btn-${safeId}:hover { background: ${hoverBg} !important; }`;
    }).filter(Boolean).join('\n    ')}
  `;
}

export function generateGoogleFontsImport(fonts) {
  // Collect unique font families
  const families = new Set();

  Object.values(fonts).forEach(font => {
    if (!font || !font.family) return;
    families.add(font.family.replace(/\s+/g, ' ').trim());
  });

  if (families.size === 0) return '';

  // No weight specs — static fonts (e.g. Pacifico, BBH Bartle) only have weight 400
  // and return 503 when you request a specific wght. The browser uses the nearest
  // available weight via CSS font matching against the weight CSS variable.
  const params = Array.from(families)
    .map(family => `family=${encodeURIComponent(family).replace(/%20/g, '+')}`)
    .join('&');

  const url = `https://fonts.googleapis.com/css2?${params}&display=swap`;
  return `@import url('${url}');`;
}
