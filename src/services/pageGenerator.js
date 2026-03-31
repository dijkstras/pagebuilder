import { buildClamp } from '../utils/constants';

export function generateHTML(page) {
  const segments = page.root.map(segment => renderSegment(segment, page)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    ${generateCSS(page)}
  </style>
</head>
<body>
  <div id="app">
    ${segments}
  </div>
</body>
</html>`;
}

function renderSegment(segment, page) {
  const alignMap = { left: 'start', center: 'center', right: 'end' };
  const justify = alignMap[segment.settings.contentAlignment] || 'start';
  const gutter = segment.settings.gutter ?? 24;
  const maxWidth = segment.settings.maxWidth;

  const outerStyle = buildStyleString({
    width: '100%',
    minHeight: '200px',
    backgroundColor: segment.settings.bgColor,
    backgroundImage: segment.settings.bgImage ? `url(${segment.settings.bgImage})` : undefined,
    backgroundSize: segment.settings.bgImage ? 'cover' : undefined,
    backgroundPosition: segment.settings.bgImage ? 'center' : undefined,
    padding: `${segment.settings.padding}px`,
    margin: `${segment.settings.margin}px`,
    containerType: 'inline-size',
    containerName: segment.id
  });

  const direction = segment.settings.direction ?? 'row';
  const innerStyle = direction === 'column'
    ? buildStyleString({
        display: 'flex',
        flexDirection: 'column',
        gap: `${gutter}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        marginLeft: maxWidth ? 'auto' : undefined,
        marginRight: maxWidth ? 'auto' : undefined,
        alignItems: 'stretch'
      })
    : buildStyleString({
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: `${gutter}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        marginLeft: maxWidth ? 'auto' : undefined,
        marginRight: maxWidth ? 'auto' : undefined,
        justifyItems: justify
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
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const columnSpan = container.settings.columnSpan ?? 12;
  const direction = container.settings.direction ?? 'column';
  const alignment = alignMap[container.settings.contentAlignment] || 'flex-start';

  const styleObj = {
    gridColumn: `span ${columnSpan}`,
    display: 'flex',
    flexDirection: direction,
    flexWrap: direction === 'row' ? 'wrap' : undefined,
    gap: `${container.settings.spacing}px`,
    alignItems: direction === 'row' ? 'center' : 'stretch',
    justifyContent: direction === 'row' ? alignment : undefined,
    containerType: 'inline-size',
    containerName: container.id
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

function renderContentItem(item, page) {
  switch (item.type) {
    case 'text': {
      const role = item.settings.textRole;
      if (role === 'heading') {
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading-family)',
          fontSize: 'var(--font-heading-size)',
          fontWeight: 'var(--font-heading-weight)',
          lineHeight: '1.2'
        });
        return `<h2 style="${style}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</h2>`;
      }
      if (role === 'body') {
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-body-family)',
          fontSize: 'var(--font-body-size)',
          fontWeight: 'var(--font-body-weight)',
          lineHeight: '1.6'
        });
        return `<p style="${style}" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;
      }
      return `<p style="margin:0" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;
    }

    case 'image':
      return `<img src="${item.settings.customOverrides.src || ''}" alt="" style="max-width:100%;height:auto" data-element-id="${item.id}" />`;

    case 'button': {
      const buttonStyle = page.styles.buttonStyles.find(s => s.id === item.settings.assignedStyleId)
        || page.styles.buttonStyles[0];
      const isOutline = buttonStyle?.bgColor === 'transparent';
      const btnStyle = buildStyleString({
        backgroundColor: buttonStyle?.bgColor || '#3b82f6',
        color: buttonStyle?.textColor || '#ffffff',
        padding: `${buttonStyle?.padding || 12}px 24px`,
        borderRadius: `${buttonStyle?.radius || 6}px`,
        border: isOutline ? `1.5px solid ${buttonStyle?.textColor || '#3b82f6'}` : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-family)',
        fontWeight: '500',
        fontSize: '14px'
      });
      return `<button style="${btnStyle}" data-element-id="${item.id}">${item.settings.customOverrides.label || 'Button'}</button>`;
    }

    case 'card':
      return `<div style="border:1px solid #ddd;padding:16px;border-radius:8px" data-element-id="${item.id}">Card Content</div>`;

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
    section { width: 100%; }
  `;
}
