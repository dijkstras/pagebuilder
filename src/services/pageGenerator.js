import { extractYouTubeId, buildYouTubeEmbedUrl } from '../utils/youtube.js';
import { getButtonIcon } from '../utils/buttonIcons';

function darkenHex(hex, amount = 0.15) {
  if (!hex || typeof hex !== 'string') return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function generateHTML(page, selectedElementId) {
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    ${generateCSS(page)}
  </style>${selectionStyle}
</head>
<body>
  <div id="app">
    ${segments}
  </div>
</body>
</html>`;
}

function renderSegment(segment, page) {
  const gutter = segment.settings.gutter ?? 24;
  const maxWidth = segment.settings.maxWidth;
  const bgSize = segment.settings.bgSize || 'cover';

  const getBackgroundPosition = (hAlign, vAlign) => {
    const hMap = { left: 'left', center: 'center', right: 'right' };
    const vMap = { top: 'top', center: 'center', bottom: 'bottom' };
    const h = hMap[hAlign] || 'center';
    const v = vMap[vAlign] || 'center';
    return `${h} ${v}`;
  };
  const bgPosition = segment.settings.bgImage
    ? getBackgroundPosition(segment.settings.contentAlignment || 'left', segment.settings.verticalAlignment || 'top')
    : undefined;

  const isGradient = segment.settings.bgType === 'gradient' && segment.settings.bgGradient;
  const gradientBg = isGradient
    ? `linear-gradient(${segment.settings.bgGradient.angle}deg, ${segment.settings.bgGradient.color1}, ${segment.settings.bgGradient.color2})`
    : undefined;
  const hasBgImage = !!segment.settings.bgImage;

  let backgroundImage;
  if (hasBgImage && isGradient) {
    backgroundImage = `url(${segment.settings.bgImage}), ${gradientBg}`;
  } else if (hasBgImage) {
    backgroundImage = `url(${segment.settings.bgImage})`;
  } else {
    backgroundImage = gradientBg;
  }

  const outerStyle = buildStyleString({
    display: 'flex',
    flexDirection: 'column',
    minHeight: `${segment.settings.minHeight ?? 200}px`,
    backgroundColor: isGradient ? undefined : (segment.settings.bgColor || page.styles.colors.background),
    backgroundImage,
    backgroundSize: hasBgImage ? bgSize : undefined,
    backgroundPosition: bgPosition,
    backgroundRepeat: hasBgImage && segment.settings.bgRepeat ? 'repeat' : 'no-repeat',
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
    position: segment.settings.bgVideo ? 'relative' : undefined
  });

  const direction = segment.settings.direction ?? 'row';
  const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const vMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
  const hAlign = hMap[segment.settings.contentAlignment] || 'flex-start';
  const vAlign = vMap[segment.settings.verticalAlignment] || 'flex-start';

  const innerStyle = buildStyleString({
    flex: '1',
    display: 'flex',
    flexDirection: direction,
    flexWrap: direction === 'row' ? 'wrap' : undefined,
    gap: `${gutter}px`,
    justifyContent: direction === 'row' ? hAlign : vAlign,
    alignItems: direction === 'row' ? vAlign : hAlign,
    maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    marginLeft: maxWidth ? 'auto' : undefined,
    marginRight: maxWidth ? 'auto' : undefined
  });

  const children = segment.children.map(child => {
    if (child.type === 'container') {
      return renderContainer(child, page);
    } else {
      return renderContentItem(child, page);
    }
  }).join('\n');

  const segmentVideoId = segment.settings.bgVideo
    ? extractYouTubeId(segment.settings.bgVideo)
    : null;
  const segmentVideoBg = segmentVideoId
    ? `<iframe src="${buildYouTubeEmbedUrl(segmentVideoId)}" style="position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100%;min-width:177.78vh;transform:translate(-50%,-50%);pointer-events:none;border:none;z-index:0" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe>`
    : '';
  const innerZIndex = segmentVideoId ? `${innerStyle}; position: relative; z-index: 1` : innerStyle;

  return `<section style="${outerStyle}" data-element-id="${segment.id}">
  ${segmentVideoBg}
  <div style="${innerZIndex}">
    ${children}
  </div>
</section>`;
}

function renderContainer(container, page) {
  const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const vMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
  const direction = container.settings.direction ?? 'column';
  const hAlign = hMap[container.settings.contentAlignment] || 'flex-start';
  const vAlign = vMap[container.settings.verticalAlignment] || 'flex-start';
  const bgSize = container.settings.bgSize || 'cover';

  const getBackgroundPosition = (hAlign, vAlign) => {
    const hMap = { left: 'left', center: 'center', right: 'right' };
    const vMap = { top: 'top', center: 'center', bottom: 'bottom' };
    const h = hMap[hAlign] || 'center';
    const v = vMap[vAlign] || 'center';
    return `${h} ${v}`;
  };
  const bgPosition = container.settings.bgImage
    ? getBackgroundPosition(container.settings.contentAlignment || 'left', container.settings.verticalAlignment || 'top')
    : undefined;

  const styleObj = {
    width: container.settings.width || 'auto',
    height: container.settings.height || undefined,
    minWidth: '0',
    display: 'flex',
    flexDirection: direction,
    flexWrap: direction === 'row' ? 'wrap' : undefined,
    gap: `${container.settings.spacing}px`,
    justifyContent: direction === 'row' ? hAlign : vAlign,
    alignItems: direction === 'row' ? vAlign : hAlign
  };

  const isGradient = container.settings.bgType === 'gradient' && container.settings.bgGradient;
  const hasBgImage = !!container.settings.bgImage;

  if (!isGradient && container.settings.bgColor && container.settings.bgColor !== 'transparent') {
    styleObj.backgroundColor = container.settings.bgColor;
  }
  if (hasBgImage && isGradient) {
    const { angle, color1, color2 } = container.settings.bgGradient;
    styleObj.backgroundImage = `url(${container.settings.bgImage}), linear-gradient(${angle}deg, ${color1}, ${color2})`;
    styleObj.backgroundSize = bgSize;
    styleObj.backgroundPosition = bgPosition;
    styleObj.backgroundRepeat = container.settings.bgRepeat ? 'repeat' : 'no-repeat';
  } else if (hasBgImage) {
    styleObj.backgroundImage = `url(${container.settings.bgImage})`;
    styleObj.backgroundSize = bgSize;
    styleObj.backgroundPosition = bgPosition;
    styleObj.backgroundRepeat = container.settings.bgRepeat ? 'repeat' : 'no-repeat';
  } else if (isGradient) {
    const { angle, color1, color2 } = container.settings.bgGradient;
    styleObj.backgroundImage = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
  }
  if (container.settings.padding) {
    styleObj.padding = `${container.settings.padding}px`;
  }

  styleObj.border = container.settings.borderEnabled
    ? `${container.settings.borderWidth ?? 1}px solid ${container.settings.borderColor ?? '#000000'}`
    : undefined;
  styleObj.filter = container.settings.elevationEnabled
    ? `drop-shadow(0 ${container.settings.elevation ?? 4}px ${(container.settings.elevation ?? 4) * 3}px rgba(0,0,0,${0.2 + (container.settings.elevation ?? 4) * 0.02}))`
    : undefined;
  styleObj.borderRadius = `${container.settings.borderRadius ?? 0}px`;
  styleObj.overflow = container.settings.bgVideo ? 'hidden' : 'visible';
  if (container.settings.bgVideo) styleObj.position = 'relative';

  const style = buildStyleString(styleObj);
  const children = container.children.map(child => renderContentItem(child, page)).join('\n');

  const containerVideoId = container.settings.bgVideo
    ? extractYouTubeId(container.settings.bgVideo)
    : null;
  const containerVideoBg = containerVideoId
    ? `<iframe src="${buildYouTubeEmbedUrl(containerVideoId)}" style="position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100%;min-width:177.78vh;transform:translate(-50%,-50%);pointer-events:none;border:none;z-index:0" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe>`
    : '';
  const childrenWrapped = containerVideoId
    ? `<div style="position:relative;z-index:1;display:contents">${children}</div>`
    : children;

  return `<div style="${style}" data-element-id="${container.id}">
    ${containerVideoBg}
    ${childrenWrapped}
  </div>`;
}

function sizeOverrides(item) {
  const w = item.settings.customOverrides.width;
  const h = item.settings.customOverrides.height;
  return { width: w || undefined, height: h || undefined };
}

function renderContentItem(item, page) {
  switch (item.type) {
    case 'text': {
      const role = item.settings.textRole || 'body';
      const { width, height } = sizeOverrides(item);
      const textAlign = item.settings.textAlign || 'left';

      if (role === 'heading1') {
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading1-family)',
          fontSize: 'var(--font-heading1-size)',
          fontWeight: 'var(--font-heading1-weight)',
          lineHeight: '1.2',
          width: width ?? 'max-content',
          height,
          textAlign,
          color: item.settings.customOverrides.color || page.styles.colors.text
        });
        return `<h1 style="${style}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</h1>`;
      }
      if (role === 'heading2') {
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading2-family)',
          fontSize: 'var(--font-heading2-size)',
          fontWeight: 'var(--font-heading2-weight)',
          lineHeight: '1.3',
          width: width ?? 'max-content',
          height,
          textAlign,
          color: item.settings.customOverrides.color || page.styles.colors.text
        });
        return `<h2 style="${style}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</h2>`;
      }
      if (role === 'body') {
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-body-family)',
          fontSize: 'var(--font-body-size)',
          fontWeight: 'var(--font-body-weight)',
          lineHeight: '1.6',
          width: width ?? 'max-content',
          height,
          textAlign,
          color: item.settings.customOverrides.color || page.styles.colors.text
        });
        return `<p style="${style}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;
      }
      if (role === 'label') {
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
          color: item.settings.customOverrides.color || page.styles.colors.text
        });
        return `<span class="label" style="${style}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</span>`;
      }
      return `<p style="${buildStyleString({ margin: '0', width: width ?? 'max-content', height, textAlign, color: item.settings.customOverrides.color || page.styles.colors.text })}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;
    }

    case 'image': {
      const { width, height } = sizeOverrides(item);
      const objectFit = item.settings.customOverrides.objectFit || 'cover';
      const imgStyle = buildStyleString({
        display: 'block',
        width: width ?? '300px',
        height: height ?? 'auto',
        maxWidth: '100%',
        objectFit: objectFit === '100% 100%' ? undefined : objectFit,
        objectPosition: 'center'
      });
      const styleStr = objectFit === '100% 100%'
        ? `${imgStyle}; object-fit: cover; object-position: center; width: 100%; height: 100%;`
        : imgStyle;
      return `<img src="${item.settings.customOverrides.src || ''}" alt="" style="${styleStr}" data-element-id="${item.id}" />`;
    }

    case 'button': {
      const buttonStyle = page.styles.buttonStyles.find(s => s.id === item.settings.assignedStyleId)
        || page.styles.buttonStyles[0];
      const isGradient = buttonStyle?.bgType === 'gradient' && buttonStyle?.bgGradient;

      // Background
      const bgColor = item.settings.customOverrides?.bgColor || buttonStyle?.bgColor || '#3b82f6';
      const background = isGradient
        ? `linear-gradient(${buttonStyle.bgGradient.angle ?? 90}deg, ${buttonStyle.bgGradient.color1}, ${buttonStyle.bgGradient.color2})`
        : bgColor;
      const isOutline = bgColor === 'transparent' && !isGradient;

      // Size — prefer sizeOverride when enabled, otherwise fall back to element-level size
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
        borderRadius: `${buttonStyle?.radius || 6}px`,
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

      return `<button class="btn-${buttonStyle?.id || 'primary'}" style="${btnStyle}" data-element-id="${item.id}">${innerContent}</button>`;
    }

    case 'card': {
      const { width, height } = sizeOverrides(item);
      return `<div style="${buildStyleString({ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', width: width ?? '300px', height })}" data-element-id="${item.id}">Card Content</div>`;
    }

    case 'video': {
      const { width, height } = sizeOverrides(item);
      const videoId = extractYouTubeId(item.settings.customOverrides.src || '');
      if (!videoId) {
        return `<div style="${buildStyleString({ width: width ?? '560px', height: height ?? '315px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' })}" data-element-id="${item.id}">No video URL set</div>`;
      }
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return `<iframe src="${embedUrl}" style="${buildStyleString({ width: width ?? '560px', height: height ?? '315px', border: 'none', display: 'block' })}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen data-element-id="${item.id}"></iframe>`;
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
    ${page.styles.buttonStyles.map(bs => {
      const isGradient = bs.bgType === 'gradient' && bs.bgGradient;
      const hoverBg = isGradient
        ? `linear-gradient(${bs.bgGradient.angle ?? 90}deg, ${darkenHex(bs.bgGradient.color1)}, ${darkenHex(bs.bgGradient.color2)})`
        : darkenHex(bs.bgColor || '#3b82f6');
      const isOutline = bs.bgColor === 'transparent' && bs.bgType !== 'gradient';
      if (isOutline) return ''; // skip hover for transparent/outline buttons
      return `.btn-${bs.id}:hover { background: ${hoverBg} !important; }`;
    }).join('\n    ')}
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
