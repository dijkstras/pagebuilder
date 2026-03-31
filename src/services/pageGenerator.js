import { BREAKPOINTS } from '../store/pageTypes';

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
  const styleObj = {
    width: '100%',
    minHeight: '200px',
    backgroundColor: segment.settings.bgColor,
    padding: `${segment.settings.padding}px`,
    margin: `${segment.settings.margin}px`,
    display: 'flex',
    flexDirection: 'column'
  };
  const style = buildStyleString(styleObj);
  const children = segment.children.map(child => {
    if (child.type === 'container') {
      return renderContainer(child, page);
    } else {
      return renderContentItem(child, page);
    }
  }).join('\n');

  return `<section style="${style}" data-element-id="${segment.id}">
    ${children}
  </section>`;
}

function renderContainer(container, page) {
  const style = buildStyleString({
    display: container.settings.layout,
    gridTemplateColumns: container.settings.layout === 'grid'
      ? `repeat(${container.settings.columns}, 1fr)`
      : undefined,
    gap: `${container.settings.spacing}px`
  });

  const children = container.children.map(child => renderContentItem(child, page)).join('\n');

  return `<div style="${style}" data-element-id="${container.id}">
    ${children}
  </div>`;
}

function renderContentItem(item, page) {
  switch (item.type) {
    case 'text':
      return `<p style="margin:0" data-element-id="${item.id}">${item.settings.customOverrides.content || ''}</p>`;

    case 'image':
      return `<img src="${item.settings.customOverrides.src || ''}" alt="" style="max-width:100%;height:auto" data-element-id="${item.id}" />`;

    case 'button':
      const buttonStyle = page.styles.buttonStyles.find(s => s.id === item.settings.assignedStyleId);
      const btnStyle = buildStyleString({
        backgroundColor: buttonStyle?.bgColor || '#3b82f6',
        color: buttonStyle?.textColor || '#ffffff',
        padding: `${buttonStyle?.padding || 12}px 24px`,
        borderRadius: `${buttonStyle?.radius || 6}px`,
        border: 'none',
        cursor: 'pointer'
      });
      return `<button style="${btnStyle}" data-element-id="${item.id}">${item.settings.customOverrides.label || 'Button'}</button>`;

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
  const breakpointCSS = Object.entries(BREAKPOINTS)
    .map(([breakpoint, width]) => {
      return `@media (max-width: ${width}px) { /* ${breakpoint} */ }`;
    })
    .join('\n');

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: 'Inter', sans-serif; }
    body { background-color: ${page.styles.colors.primary}; }
    section { width: 100%; }
    ${breakpointCSS}
  `;
}
