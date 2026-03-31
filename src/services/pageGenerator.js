import { buildClamp } from '../utils/constants';

export function generateHTML(page, selectedElementId) {
  const segments = page.root.map(segment => renderSegment(segment, page)).join('\n');

  const selectionStyle = selectedElementId ? `
  <style>
    @keyframes selection-pulse {
      0%   { outline: 2px solid rgba(99,102,241,0.9); outline-offset: 3px; box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
      40%  { outline: 2px solid rgba(99,102,241,0.7); outline-offset: 3px; box-shadow: 0 0 0 6px rgba(99,102,241,0.2); }
      100% { outline: 2px solid transparent;          outline-offset: 3px; box-shadow: 0 0 0 0 rgba(99,102,241,0); }
    }
    [data-element-id="${selectedElementId}"] {
      animation: selection-pulse 0.7s ease-out 1 forwards;
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

  const outerStyle = buildStyleString({
    minHeight: `${segment.settings.minHeight ?? 200}px`,
    backgroundColor: segment.settings.bgColor,
    backgroundImage: segment.settings.bgImage ? `url(${segment.settings.bgImage})` : undefined,
    backgroundSize: segment.settings.bgImage ? 'cover' : undefined,
    backgroundPosition: segment.settings.bgImage ? 'center' : undefined,
    padding: `${segment.settings.padding}px`,
    margin: `${segment.settings.margin}px`
  });

  const direction = segment.settings.direction ?? 'row';
  const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const vMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
  const hAlign = hMap[segment.settings.contentAlignment] || 'flex-start';
  const vAlign = vMap[segment.settings.verticalAlignment] || 'flex-start';

  const innerStyle = buildStyleString({
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

  return `<section style="${outerStyle}" data-element-id="${segment.id}">
  <div style="${innerStyle}">
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

  if (container.settings.bgColor && container.settings.bgColor !== 'transparent') {
    styleObj.backgroundColor = container.settings.bgColor;
  }
  if (container.settings.bgImage) {
    styleObj.backgroundImage = `url(${container.settings.bgImage})`;
    styleObj.backgroundSize = 'cover';
    styleObj.backgroundPosition = 'center';
  }
  if (container.settings.padding) {
    styleObj.padding = `${container.settings.padding}px`;
  }

  const style = buildStyleString(styleObj);
  const children = container.children.map(child => renderContentItem(child, page)).join('\n');

  return `<div style="${style}" data-element-id="${container.id}">
    ${children}
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
      const role = item.settings.textRole;
      const { width, height } = sizeOverrides(item);
      if (role === 'heading') {
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading-family)',
          fontSize: 'var(--font-heading-size)',
          fontWeight: 'var(--font-heading-weight)',
          lineHeight: '1.2',
          width: width ?? 'max-content',
          height
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
          height
        });
        return `<p style="${style}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;
      }
      return `<p style="${buildStyleString({ margin: '0', width: width ?? 'max-content', height })}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;
    }

    case 'image': {
      const { width, height } = sizeOverrides(item);
      const imgStyle = buildStyleString({
        display: 'block',
        width: width ?? '300px',
        height: height ?? 'auto',
        maxWidth: '100%'
      });
      return `<img src="${item.settings.customOverrides.src || ''}" alt="" style="${imgStyle}" data-element-id="${item.id}" />`;
    }

    case 'button': {
      const buttonStyle = page.styles.buttonStyles.find(s => s.id === item.settings.assignedStyleId)
        || page.styles.buttonStyles[0];
      const isOutline = buttonStyle?.bgColor === 'transparent';
      const { width, height } = sizeOverrides(item);
      const btnStyle = buildStyleString({
        display: 'inline-block',
        backgroundColor: buttonStyle?.bgColor || '#3b82f6',
        color: buttonStyle?.textColor || '#ffffff',
        padding: `${buttonStyle?.padding || 12}px 24px`,
        borderRadius: `${buttonStyle?.radius || 6}px`,
        border: isOutline ? `1.5px solid ${buttonStyle?.textColor || '#3b82f6'}` : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-family)',
        fontWeight: '500',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        width,
        height
      });
      return `<button style="${btnStyle}" data-element-id="${item.id}">${item.settings.customOverrides.label || 'Button'}</button>`;
    }

    case 'card': {
      const { width, height } = sizeOverrides(item);
      return `<div style="${buildStyleString({ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', width: width ?? '300px', height })}" data-element-id="${item.id}">Card Content</div>`;
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

function generateCSS(page) {
  const colors = page.styles.colors;
  const fonts = page.styles.fonts;
  const spacing = page.styles.spacing ?? { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 };

  const headingClamp = buildClamp(fonts.heading.sizeMin, fonts.heading.sizeMax);
  const bodyClamp = buildClamp(fonts.body.sizeMin, fonts.body.sizeMax);

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-neutral: ${colors.neutral};
      --font-heading-family: ${fonts.heading.family}, sans-serif;
      --font-heading-size: ${headingClamp};
      --font-heading-weight: ${fonts.heading.weight};
      --font-body-family: ${fonts.body.family}, sans-serif;
      --font-body-size: ${bodyClamp};
      --font-body-weight: ${fonts.body.weight};
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
    h1, h2, h3 {
      font-family: var(--font-heading-family);
      font-size: var(--font-heading-size);
      font-weight: var(--font-heading-weight);
    }
  `;
}
