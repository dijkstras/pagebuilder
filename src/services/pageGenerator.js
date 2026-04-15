import { renderVideo } from '../utils/video.js';
import { getButtonIcon } from '../utils/buttonIcons';
import { GAP_PRESETS, SEGMENT_SPACING_PRESETS } from '../store/pageTypes';
import { generateFontsUrl } from '../utils/googleFonts.js';

function darkenHex(hex, amount = 0.15) {
  if (!hex || typeof hex !== 'string') return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getTextStyle(customOverrides, defaultColor, paletteColors = {}) {
  const textType = customOverrides.textType;
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
  
  const slot = customOverrides.colorSlot;
  const resolvedColor = slot && slot !== 'custom'
    ? (slot === 'transparent' ? 'transparent' : (paletteColors[slot] || customOverrides.color))
    : customOverrides.color;
  return { color: resolvedColor || defaultColor };
}

function collectMobileOverrideCSS(page, isMobilePreview = false) {
  const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const vMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
  const GAP_PX = { none: 0, sm: 12, md: 24, lg: 40, xl: 64 };
  const rules = [];

  const addRule = (id, cssProps) => {
    const decls = Object.entries(cssProps)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `  ${k}: ${v} !important;`)
      .join('\n');
    if (decls) rules.push(`[data-element-id="${id}"] {\n${decls}\n}`);
  };

  const processSegment = (segment) => {
    const mo = segment.settings?.mobileOverrides;
    if (mo && Object.keys(mo).length > 0) {
      const css = {};
      if (mo.minHeight !== undefined) css['min-height'] = `${mo.minHeight}px`;
      if (mo.maxHeight !== undefined) css['max-height'] = `${mo.maxHeight}px`;
      if (mo.bgColor !== undefined && mo.bgType !== 'gradient') css['background-color'] = mo.bgColor;
      if (mo.bgType === 'gradient' && mo.bgGradient) {
        const { angle, color1, color2, color1Slot, color2Slot } = mo.bgGradient;
        const colors = page.styles.colors || {};
        const resolvedColor1 = color1Slot && color1Slot !== 'custom'
          ? (color1Slot === 'transparent' ? 'transparent' : (colors[color1Slot] || color1))
          : color1;
        const resolvedColor2 = color2Slot && color2Slot !== 'custom'
          ? (color2Slot === 'transparent' ? 'transparent' : (colors[color2Slot] || color2))
          : color2;
        css['background-image'] = `linear-gradient(${angle}deg, ${resolvedColor1}, ${resolvedColor2})`;
      }
      if (mo.gap !== undefined) {
        const gapPx = GAP_PX[mo.gap];
        if (gapPx !== undefined) css['gap'] = `${gapPx}px`;
      }
      if (mo.hidden === true) css['display'] = 'none';
      addRule(segment.id, css);
    }
    (segment.children || []).forEach(child => {
      if (child.type === 'slot' || child.type === 'container') {
        processSlot(child);
      } else {
        processContentItem(child, page);
      }
    });
  };

  const processSlot = (slot) => {
    const mo = slot.settings?.mobileOverrides;
    if (mo && Object.keys(mo).length > 0) {
      const css = {};
      const direction = mo.direction ?? slot.settings.direction ?? 'column';
      if (mo.direction !== undefined) css['flex-direction'] = mo.direction;
      const needsAlignmentUpdate = mo.contentAlignment !== undefined || mo.verticalAlignment !== undefined || mo.direction !== undefined;
      if (needsAlignmentUpdate) {
        const hAlign = hMap[mo.contentAlignment ?? slot.settings.contentAlignment] || 'flex-start';
        const vAlign = vMap[mo.verticalAlignment ?? slot.settings.verticalAlignment] || 'flex-start';
        css['display'] = 'flex';
        css['justify-content'] = direction === 'row' ? hAlign : vAlign;
        css['align-items'] = direction === 'row' ? vAlign : hAlign;
      }
      const mobileContentAlignment = mo.contentAlignment ?? slot.settings.contentAlignment;
      if (direction === 'column' && mobileContentAlignment && mobileContentAlignment !== 'left') {
        rules.push(`[data-element-id="${slot.id}"] > * {\n  width: fit-content !important;\n  max-width: 100% !important;\n}`);
      }
      if (mo.spacing !== undefined) {
        const sp = mo.spacing;
        css['gap'] = `${typeof sp === 'number' ? sp : 16}px`;
        if (sp === 'auto') css['justify-content'] = 'space-between';
      }
      if (mo.height !== undefined) css['min-height'] = mo.height !== 'auto' ? mo.height : 'unset';
      if (mo.bgColor !== undefined && mo.bgType !== 'gradient') css['background-color'] = mo.bgColor;
      if (mo.bgType === 'gradient' && mo.bgGradient) {
        const { angle, color1, color2, color1Slot, color2Slot } = mo.bgGradient;
        const colors = page.styles.colors || {};
        const resolvedColor1 = color1Slot && color1Slot !== 'custom'
          ? (color1Slot === 'transparent' ? 'transparent' : (colors[color1Slot] || color1))
          : color1;
        const resolvedColor2 = color2Slot && color2Slot !== 'custom'
          ? (color2Slot === 'transparent' ? 'transparent' : (colors[color2Slot] || color2))
          : color2;
        css['background-image'] = `linear-gradient(${angle}deg, ${resolvedColor1}, ${resolvedColor2})`;
      }
      if (mo.padding !== undefined) css['padding'] = `${mo.padding}px`;
      if (mo.borderRadius !== undefined) css['border-radius'] = `${mo.borderRadius}px`;
      if (mo.overflow !== undefined && direction === 'row') {
        if (mo.overflow === 'scroll') {
          const clip = (mo.clipContent ?? slot.settings?.clipContent) !== false;
          css['flex-wrap'] = 'nowrap';
          css['overflow-x'] = clip ? 'auto' : 'visible';
          css['overflow-y'] = clip ? 'hidden' : 'visible';
        } else {
          css['flex-wrap'] = 'wrap';
          css['overflow-x'] = 'visible';
        }
      }
      if (mo.hidden === true) css['display'] = 'none';
      addRule(slot.id, css);
    }
    (slot.children || []).forEach(child => {
      if (child.type === 'container') {
        processSlot(child);
      } else {
        processContentItem(child, page);
      }
    });
  };

  const processContentItem = (item, page) => {
    const mo = item.settings?.mobileOverrides;
    if (mo && Object.keys(mo).length > 0) {
      const css = {};
      if (mo.textAlign !== undefined) css['text-align'] = mo.textAlign;
      if (mo.textRole !== undefined) {
        const fonts = page.styles.fonts;
        const role = mo.textRole;
        if (fonts[role]) {
          css['font-family'] = `${fonts[role].family}, sans-serif`;
          css['font-size'] = `${fonts[role].size}px`;
          css['font-weight'] = fonts[role].weight;
        }
      }
      if (mo.hidden === true) css['display'] = 'none';
      addRule(item.id, css);
    }
  };

  page.root.forEach(processSegment);

  // Page-level overrides
  const pmo = page.mobileOverrides ?? {};
  if (Object.keys(pmo).length > 0) {
    const pageCSS = [];

    if (pmo.bgColor !== undefined || pmo.bgColorSlot !== undefined) {
      const slot = pmo.bgColorSlot;
      const colors = page.styles.colors || {};
      const resolvedPgBg = slot && slot !== 'custom' ? (slot === 'transparent' ? 'transparent' : (colors[slot] || pmo.bgColor)) : pmo.bgColor;
      if (resolvedPgBg !== undefined) pageCSS.push(`  body { background-color: ${resolvedPgBg} !important; }`);
    }
    if (pmo.segmentSpacing !== undefined) {
      const spacingPx = SEGMENT_SPACING_PRESETS[pmo.segmentSpacing]?.px ?? 40;
      pageCSS.push(`  section { padding: ${spacingPx}px 16px !important; }`);
    }

    // Font overrides → CSS custom properties
    if (pmo.fonts && Object.keys(pmo.fonts).length > 0) {
      const rootDecls = [];
      const f = pmo.fonts;
      if (f.heading1) {
        if (f.heading1.family) rootDecls.push(`    --font-heading1-family: ${f.heading1.family}, sans-serif`);
        if (f.heading1.size)   rootDecls.push(`    --font-heading1-size: ${f.heading1.size}px`);
        if (f.heading1.weight) rootDecls.push(`    --font-heading1-weight: ${f.heading1.weight}`);
      }
      if (f.heading2) {
        if (f.heading2.family) rootDecls.push(`    --font-heading2-family: ${f.heading2.family}, sans-serif`);
        if (f.heading2.size)   rootDecls.push(`    --font-heading2-size: ${f.heading2.size}px`);
        if (f.heading2.weight) rootDecls.push(`    --font-heading2-weight: ${f.heading2.weight}`);
      }
      if (f.body) {
        if (f.body.family) rootDecls.push(`    --font-body-family: ${f.body.family}, sans-serif`);
        if (f.body.size)   rootDecls.push(`    --font-body-size: ${f.body.size}px`);
        if (f.body.weight) rootDecls.push(`    --font-body-weight: ${f.body.weight}`);
      }
      if (f.label) {
        if (f.label.family) rootDecls.push(`    --font-label-family: ${f.label.family}, sans-serif`);
        if (f.label.size)   rootDecls.push(`    --font-label-size: ${f.label.size}px`);
        if (f.label.weight) rootDecls.push(`    --font-label-weight: ${f.label.weight}`);
      }
      if (f.button) {
        if (f.button.family) rootDecls.push(`    --font-button-family: ${f.button.family}, sans-serif`);
        if (f.button.weight) rootDecls.push(`    --font-button-weight: ${f.button.weight}`);
      }
      if (rootDecls.length > 0) {
        pageCSS.push(`  :root {\n${rootDecls.join(';\n')};\n  }`);
      }
    }

    // Color overrides → CSS custom properties
    if (pmo.colors && Object.keys(pmo.colors).length > 0) {
      const colorDecls = [];
      const c = pmo.colors;
      if (c.primary)    colorDecls.push(`    --color-primary: ${c.primary}`);
      if (c.secondary)  colorDecls.push(`    --color-secondary: ${c.secondary}`);
      if (c.neutral)    colorDecls.push(`    --color-neutral: ${c.neutral}`);
      if (c.background) pageCSS.push(`  body { background-color: ${c.background} !important; }`);
      if (colorDecls.length > 0) {
        pageCSS.push(`  :root {\n${colorDecls.join(';\n')};\n  }`);
      }
    }

    // Button style overrides → .btn-{id} class overrides
    if (pmo.buttonStyles && Object.keys(pmo.buttonStyles).length > 0) {
      Object.entries(pmo.buttonStyles).forEach(([btnId, overrides]) => {
        const safeId = btnId.replace(/[^a-z0-9-_]/gi, '-');
        const decls = [];
        if (overrides.bgColor !== undefined && overrides.bgType !== 'gradient') {
          decls.push(`    background: ${overrides.bgColor}`);
          decls.push(`    background-color: ${overrides.bgColor}`);
        }
        if (overrides.bgType === 'gradient' && overrides.bgGradient) {
          const { angle, color1, color2 } = overrides.bgGradient;
          decls.push(`    background: linear-gradient(${angle ?? 90}deg, ${color1}, ${color2})`);
        }
        if (overrides.textColor !== undefined) decls.push(`    color: ${overrides.textColor}`);
        if (overrides.fontSize !== undefined)  decls.push(`    font-size: ${overrides.fontSize}px`);
        if (overrides.padding !== undefined)   decls.push(`    padding: ${overrides.padding}px 20px`);
        if (overrides.radius !== undefined)    decls.push(`    border-radius: ${overrides.radius}px`);
        if (decls.length > 0) {
          pageCSS.push(`  .btn-${safeId} {\n${decls.map(d => d + ' !important').join(';\n')};\n  }`);
        }
      });
    }

    if (pageCSS.length > 0) rules.push(pageCSS.join('\n'));
  }

  // Always clamp horizontal section padding on mobile so desktop-sized values don't bleed through
  const baselineRule = `section { padding-left: 16px !important; padding-right: 16px !important; overflow-x: hidden !important; }`;
  // Ensure content wrapper and grid container respect viewport width on mobile
  const contentWrapperRule = `section > div { max-width: 100% !important; width: 100% !important; box-sizing: border-box !important; overflow-x: hidden !important; }`;
  const gridRule = `section > div > div { max-width: 100% !important; width: 100% !important; box-sizing: border-box !important; overflow-x: hidden !important; }`;
  // Ensure slots respect viewport width on mobile
  const slotRule = `section > div > div > div { max-width: 100% !important; width: 100% !important; box-sizing: border-box !important; overflow-x: hidden !important; }`;
  // Reduce gap on mobile to prevent overflow with multiple columns
  const gapRule = `section > div > div { gap: 12px !important; }`;
  const allRules = [baselineRule, contentWrapperRule, gridRule, slotRule, gapRule, ...rules];
  if (isMobilePreview) return allRules.join('\n');
  return `@media (max-width: 767px) {\n${allRules.join('\n')}\n}`;
}

export function generateHTML(page, selectedElementId, options = {}) {
  const { showGridOverlay = false, isMobilePreview = false } = options;
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
    @keyframes slot-pulse {
      0%   { outline: 2px solid rgba(99,102,241,0.9); outline-offset: 0; }
      25%  { outline: 2px solid rgba(99,102,241,0.8); outline-offset: 2px; }
      50%  { outline: 2px solid rgba(99,102,241,0.9); outline-offset: 0; }
      75%  { outline: 2px solid rgba(99,102,241,0.6); outline-offset: 2px; }
      100% { outline: 2px solid rgba(99,102,241,0); outline-offset: 0; }
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
    div[data-element-id="${selectedElementId}"] {
      animation: slot-pulse 3s ease-in-out forwards !important;
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

  const mobileOverrideCSS = collectMobileOverrideCSS(page, isMobilePreview);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>${page.title}</title>
  <style>
    ${generateCSS(page)}
    ${mobileOverrideCSS}
  </style>${selectionStyle}
</head>
<body style="margin: 0; padding: 0; overflow-x: hidden;">
  <div id="app" style="max-width: 100vw; overflow-x: hidden;">
    ${segments}
  </div>
  ${gridOverlayHtml}
  <script>
    // Handle clicks on elements with data-element-id
    document.addEventListener('click', function(event) {
      const element = event.target.closest('[data-element-id]');
      if (element) {
        const elementId = element.getAttribute('data-element-id');
        if (elementId) {
          // Send message to parent window
          window.parent.postMessage({
            type: 'SELECT_ELEMENT',
            elementId: elementId
          }, '*');
        }
      }
    });
  </script>
</body>
</html>`;
}

function renderSegment(segment, page, segmentHorizontalScroll = false) {
  const hidden = segment.settings.hidden;
  const mobileHidden = segment.settings.mobileHidden;
  
  const maxWidth = segment.settings.maxWidth;
  const bgSize = segment.settings.bgSize || 'cover';
  const gapKey = segment.settings.gap || 'md';
  const gapPreset = GAP_PRESETS[gapKey] || GAP_PRESETS.md;
  const segmentSpacingKey = page.styles.segmentSpacing || 'md';
  const segmentSpacing = SEGMENT_SPACING_PRESETS[segmentSpacingKey]?.px || 40;

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
  const segPaletteColors = page.styles.colors || {};
  const gradientBg = isGradient
    ? (() => {
        const { angle, color1, color2, color1Slot, color2Slot } = segment.settings.bgGradient;
        const resolvedColor1 = color1Slot && color1Slot !== 'custom'
          ? (color1Slot === 'transparent' ? 'transparent' : (segPaletteColors[color1Slot] || color1))
          : color1;
        const resolvedColor2 = color2Slot && color2Slot !== 'custom'
          ? (color2Slot === 'transparent' ? 'transparent' : (segPaletteColors[color2Slot] || color2))
          : color2;
        return `linear-gradient(${angle}deg, ${resolvedColor1}, ${resolvedColor2})`;
      })()
    : undefined;
  const hasBgImage = !!segment.settings.bgImage;

  const outerStyle = buildStyleString({
    display: 'flex',
    flexDirection: 'column',
    minHeight: `${segment.settings.minHeight ?? 200}px`,
    maxHeight: segment.settings.maxHeight ? `${segment.settings.maxHeight}px` : undefined,
    backgroundColor: (() => {
      const segSlot = segment.settings.bgColorSlot;
      const segColors = page.styles.colors || {};
      if (segSlot && segSlot !== 'custom') return segSlot === 'transparent' ? 'transparent' : (segColors[segSlot] || segment.settings.bgColor);
      return segment.settings.bgColor || segColors.background;
    })(),
    backgroundImage: isGradient ? gradientBg : undefined,
    backgroundSize: isGradient ? 'cover' : undefined,
    backgroundPosition: isGradient ? 'center' : undefined,
    backgroundRepeat: isGradient ? 'no-repeat' : undefined,
    padding: `${segmentSpacing}px`,
    ...(segment.settings.borderEnabled ? (() => {
      const resolvedBorderColor = segment.settings.borderColorSlot && segment.settings.borderColorSlot !== 'custom'
        ? (segment.settings.borderColorSlot === 'transparent' ? 'transparent' : ((page.styles.colors || {})[segment.settings.borderColorSlot] || segment.settings.borderColor))
        : (segment.settings.borderColor ?? '#000000');
      const borderWidth = `${segment.settings.borderWidth ?? 1}px solid ${resolvedBorderColor}`;
      const edges = segment.settings.borderEdges || { top: true, right: true, bottom: true, left: true };
      return {
        borderTop: edges.top !== false ? borderWidth : undefined,
        borderRight: edges.right !== false ? borderWidth : undefined,
        borderBottom: edges.bottom !== false ? borderWidth : undefined,
        borderLeft: edges.left !== false ? borderWidth : undefined
      };
    })() : {}),
    filter: segment.settings.elevationEnabled
      ? `drop-shadow(0 ${segment.settings.elevation ?? 4}px ${(segment.settings.elevation ?? 4) * 3}px rgba(0,0,0,${0.2 + (segment.settings.elevation ?? 4) * 0.02}))`
      : undefined,
    borderRadius: `${segment.settings.borderRadius ?? 0}px`,
    overflowX: segment.settings.horizontalScroll ? 'auto' : (segment.settings.bgVideo ? 'hidden' : undefined),
    overflow: (!segment.settings.horizontalScroll && !segment.settings.bgVideo) ? 'visible' : undefined,
    position: (segment.settings.bgVideo || hasBgImage || isGradient) ? 'relative' : undefined,
    width: '100%'
  });

  // Build Tailwind grid classes for the inner wrapper
  const gridClasses = [
    'grid', 'grid-cols-12',
    gapPreset.twClass
  ];
  // Add mobile max-width constraint to prevent overflow
  gridClasses.push('max-w-full', 'w-full');
  if (maxWidth) gridClasses.push(`md:max-w-[${maxWidth}px]`, 'mx-auto');

  const hScroll = !!segment.settings.horizontalScroll;
  const children = segment.children.map(child => {
    if (child.type === 'slot' || child.type === 'container') {
      return renderSlot(child, page, hScroll, false);
    } else {
      return renderContentItem(child, page);
    }
  }).join('\n');

  // Render heading if enabled
  const headingHtml = segment.settings.headingEnabled ? (() => {
    const headingFont = segment.settings.headingFont || 'heading1';
    const headingAlignment = segment.settings.headingAlignment || 'left';
    const headingContent = segment.settings.headingContent || 'Section Heading';
    const resolvedHeadingColor = segment.settings.headingColorSlot && segment.settings.headingColorSlot !== 'custom'
      ? (segment.settings.headingColorSlot === 'transparent' ? 'transparent' : ((page.styles.colors || {})[segment.settings.headingColorSlot] || segment.settings.headingColor))
      : (segment.settings.headingColor ?? '#000000');

    const fontVars = {
      heading1: { family: 'var(--font-heading1-family)', size: 'var(--font-heading1-size)', weight: 'var(--font-heading1-weight)', lineHeight: '1.2', tag: 'h1' },
      heading2: { family: 'var(--font-heading2-family)', size: 'var(--font-heading2-size)', weight: 'var(--font-heading2-weight)', lineHeight: '1.3', tag: 'h2' },
      body: { family: 'var(--font-body-family)', size: 'var(--font-body-size)', weight: 'var(--font-body-weight)', lineHeight: '1.6', tag: 'p' }
    };
    const font = fontVars[headingFont] || fontVars.heading1;

    const headingStyle = buildStyleString({
      maxWidth: hScroll ? undefined : '1280px',
      margin: hScroll ? '0 0 20px 0' : '0 auto 20px auto',
      width: hScroll ? undefined : '100%',
      paddingLeft: hScroll ? undefined : '16px',
      paddingRight: hScroll ? undefined : '16px',
      fontFamily: font.family,
      fontSize: font.size,
      fontWeight: font.weight,
      lineHeight: font.lineHeight,
      textAlign: headingAlignment,
      color: resolvedHeadingColor,
      boxSizing: 'border-box'
    });

    return `<${font.tag} style="${headingStyle}">${headingContent}</${font.tag}>`;
  })() : '';

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

  // Content wrapper with max-width constraint
  const contentWrapperStyle = buildStyleString({
    maxWidth: hScroll ? undefined : '1280px',
    margin: hScroll ? undefined : '0 auto',
    width: hScroll ? undefined : '100%',
    paddingLeft: hScroll ? undefined : '16px',
    paddingRight: hScroll ? undefined : '16px',
    display: hScroll ? 'flex' : undefined
  });

  const segmentHtml = `<section style="${outerStyle}" data-element-id="${segment.id}">
  ${segmentVideoBg}
  ${bgImageOverlay}
  ${headingHtml}
  <div style="${contentWrapperStyle}">
    <div class="${gridClasses.join(' ')}"${innerZIndexStyle}>
      ${children}
    </div>
  </div>
</section>`;

  // Wrap with visibility classes
  if (hidden && mobileHidden) return ''; // Hidden on both
  if (hidden && !mobileHidden) return `<div class="md:hidden">${segmentHtml}</div>`; // Hidden on desktop only
  if (!hidden && mobileHidden) return `<div class="hidden md:block">${segmentHtml}</div>`; // Hidden on mobile only
  return segmentHtml; // Visible on both
}

function renderSlot(slot, page, segmentHScroll = false, isNested = false) {
  if (slot.settings.hidden) return '';
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
  const isHorizontalScroll = !segmentHScroll && direction === 'row' && slot.settings.overflow === 'scroll';
  const clipContent = slot.settings.clipContent !== false; // default true
  const slotVideoBg = slot.settings.bgVideo
    ? renderVideo(slot.settings.bgVideo, {
        isBackground: true,
        bgSize: slot.settings.bgVideoSize || 'fill',
        bgPositionX: slot.settings.bgVideoPositionX || 'center',
        bgPositionY: slot.settings.bgVideoPositionY || 'center'
      })
    : '';

  // Tailwind classes for grid column and responsive behaviour
  // Only apply grid column classes to top-level slots, not nested containers
  const twClasses = [];
  if (!isNested) {
    const span = slot.settings.gridColumn ?? 12;
    twClasses.push('col-span-12');
    if (span !== 12) twClasses.push(`md:col-span-${span}`);
  }

  // Responsive visibility - independent desktop and mobile settings
  const resp = slot.settings.responsive;
  const hidden = slot.settings.hidden;
  const mobileHidden = slot.settings.mobileHidden;
  
  // Mobile visibility (hidden on mobile, visible on desktop)
  if (mobileHidden && !hidden) {
    twClasses.push('hidden', 'md:block');
  }
  // Desktop visibility (hidden on desktop, visible on mobile)
  else if (hidden && !mobileHidden) {
    twClasses.push('md:hidden');
  }
  // Hidden on both
  else if (hidden && mobileHidden) {
    twClasses.push('hidden');
  }
  
  if (resp?.mobileOrder != null) {
    twClasses.push(`order-${resp.mobileOrder}`, 'md:order-none');
  }

  // Inline styles for visual properties
  const isContainer = slot.type === 'container';
  const styleObj = {
    minHeight: (slot.settings.height && slot.settings.height !== 'auto') ? slot.settings.height : undefined,
    height: isContainer ? '100%' : undefined,
    display: (slot.settings.bgVideo || hasBgImage) ? 'block' : 'flex',
    ...(slot.settings.bgVideo || hasBgImage ? {} : {
      flexDirection: direction,
      flexWrap: (direction === 'row') ? (segmentHScroll || slot.settings.overflow === 'scroll' ? 'nowrap' : 'wrap') : undefined,
      gap: `${typeof spacing === 'number' ? spacing : 16}px`,
      justifyContent: isAutoSpacing ? 'space-between' : (direction === 'row' ? hAlign : vAlign),
      alignItems: direction === 'row' ? vAlign : hAlign,
      alignContent: direction === 'row' ? (slot.settings.alignContent || 'flex-start') : undefined
    })
  };

  const slotPaletteColors = page.styles.colors || {};
  const resolvedSlotBg = slot.settings.bgColorSlot && slot.settings.bgColorSlot !== 'custom'
    ? (slot.settings.bgColorSlot === 'transparent' ? 'transparent' : (slotPaletteColors[slot.settings.bgColorSlot] || slot.settings.bgColor))
    : slot.settings.bgColor;
  if (!isGradient && resolvedSlotBg && resolvedSlotBg !== 'transparent') {
    styleObj.backgroundColor = resolvedSlotBg;
  }
  if (isGradient) {
    const { angle, color1, color2, color1Slot, color2Slot } = slot.settings.bgGradient;
    const resolvedColor1 = color1Slot && color1Slot !== 'custom'
      ? (color1Slot === 'transparent' ? 'transparent' : (slotPaletteColors[color1Slot] || color1))
      : color1;
    const resolvedColor2 = color2Slot && color2Slot !== 'custom'
      ? (color2Slot === 'transparent' ? 'transparent' : (slotPaletteColors[color2Slot] || color2))
      : color2;
    styleObj.backgroundImage = `linear-gradient(${angle}deg, ${resolvedColor1}, ${resolvedColor2})`;
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
  // When horizontal scroll is enabled, slot needs overflow: auto to show scrollbar
  if (isHorizontalScroll && clipContent) {
    styleObj.overflowX = 'auto';
    styleObj.overflowY = 'hidden';
  } else if (slot.settings.bgVideo || slot.settings.borderRadius > 0) {
    styleObj.overflow = 'hidden';
  } else {
    styleObj.overflow = 'visible';
  }
  if (slot.settings.bgVideo || hasBgImage || isGradient) styleObj.position = 'relative';
  if (!segmentHScroll) {
    styleObj.maxWidth = '100%';
    styleObj.flexShrink = '1';
  }
  styleObj.boxSizing = 'border-box';
  // For nested containers, use width instead of minWidth to respect parent width
  // Otherwise minWidth: 100% would reference viewport width instead of parent
  if (isNested && slot.settings.minWidth && typeof slot.settings.minWidth === 'string' && slot.settings.minWidth.includes('%')) {
    styleObj.width = slot.settings.minWidth;
    styleObj.minWidth = '0';
  } else {
    styleObj.minWidth = slot.settings.minWidth || '0';
    styleObj.width = 'auto';
  }

  const style = buildStyleString(styleObj);
  const children = slot.children.map(child =>
    child.type === 'container' ? renderSlot(child, page, false, true) : renderContentItem(child, page)
  ).join('\n');

  const childrenWrapped = (slot.settings.bgVideo || hasBgImage)
    ? `<div style="position:relative;z-index:1;display:flex;flex-direction:${direction};flex-wrap:${direction === 'row' ? (slot.settings.overflow === 'scroll' ? 'nowrap' : 'wrap') : 'unset'};${direction === 'row' && slot.settings.overflow === 'scroll' ? 'overflow-x:auto;' : ''}gap:${typeof spacing === 'number' ? spacing : 16}px;justify-content:${isAutoSpacing ? 'space-between' : (direction === 'row' ? hAlign : vAlign)};align-items:${direction === 'row' ? vAlign : hAlign};align-content:${direction === 'row' ? (slot.settings.alignContent || 'flex-start') : 'unset'};width:100%;height:100%">${children}</div>`
    : (children || '<div class="slot-placeholder" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:none;border-radius:4px;position:relative"><svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0"><rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" fill="none" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,10" rx="4"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite"/></rect></svg><span style="position:relative;z-index:1;background:rgba(255,255,255,0.7);color:#374151;padding:4px 12px;border-radius:3px;font-size:13px;font-weight:500">Content Slot</span></div>');

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

  const containerChildWidthStyle = (isContainer && direction === 'column' && slot.settings.contentAlignment && slot.settings.contentAlignment !== 'left')
    ? `<style>[data-element-id="${slot.id}"] > * { width: fit-content !important; max-width: 100%; }</style>`
    : '';

  return `<div class="${twClasses.join(' ')}" style="${style}" data-element-id="${slot.id}">
    ${slotVideoBg}
    ${slotBgImageOverlay}
    ${containerChildWidthStyle}
    ${childrenWrapped}
  </div>`;
}

function sizeOverrides(item) {
  const overrides = item.settings?.customOverrides ?? {};
  return { width: overrides.width || undefined, height: overrides.height || undefined };
}

function getContentResponsiveClasses(item) {
  const settings = item.settings || {};
  const classes = [];
  const hidden = settings.hidden;
  const mobileHidden = settings.mobileHidden;
  
  // Mobile visibility (hidden on mobile, visible on desktop)
  if (mobileHidden && !hidden) {
    classes.push('hidden', 'md:block');
  }
  // Desktop visibility (hidden on desktop, visible on mobile)
  else if (hidden && !mobileHidden) {
    classes.push('md:hidden');
  }
  // Hidden on both
  else if (hidden && mobileHidden) {
    classes.push('hidden');
  }
  
  return classes.join(' ');
}

function wrapWithResponsive(html, item) {
  const classes = getContentResponsiveClasses(item);
  if (!classes) return html;
  // Remove data-element-id from inner HTML to avoid duplicates
  const cleanHtml = html.replace(/data-element-id="${item.id}"/g, '');
  return `<div class="${classes}" data-element-id="${item.id}">${cleanHtml}</div>`;
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
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text, page.styles.colors);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading1-family)',
          fontSize: 'var(--font-heading1-size)',
          fontWeight: 'var(--font-heading1-weight)',
          lineHeight: '1.2',
          width: width ?? '100%',
          height,
          textAlign,
          ...textStyle
        });
        return `<h1 style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</h1>`;
      }
      if (role === 'heading2') {
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text, page.styles.colors);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-heading2-family)',
          fontSize: 'var(--font-heading2-size)',
          fontWeight: 'var(--font-heading2-weight)',
          lineHeight: '1.3',
          width: width ?? '100%',
          height,
          textAlign,
          ...textStyle
        });
        return `<h2 style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</h2>`;
      }
      if (role === 'body') {
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text, page.styles.colors);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-body-family)',
          fontSize: 'var(--font-body-size)',
          fontWeight: 'var(--font-body-weight)',
          lineHeight: '1.6',
          width: width ?? '100%',
          height,
          textAlign,
          ...textStyle
        });
        return `<p style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</p>`;
      }
      if (role === 'label') {
        const textStyle = getTextStyle(customOverrides, page.styles.colors.text, page.styles.colors);
        const style = buildStyleString({
          margin: '0',
          fontFamily: 'var(--font-label-family)',
          fontSize: 'var(--font-label-size)',
          fontWeight: 'var(--font-label-weight)',
          lineHeight: '1.4',
          width: width ?? '100%',
          height,
          textAlign,
          display: 'inline-block',
          ...textStyle
        });
        return `<span class="label" style="${style}" data-element-id="${item.id}">${customOverrides.content || ''}</span>`;
      }
      const textStyle = getTextStyle(customOverrides, page.styles.colors.text, page.styles.colors);
      return `<p style="${buildStyleString({ margin: '0', width: width ?? '100%', height, textAlign, ...textStyle })}" data-element-id="${item.id}">${customOverrides.content || ''}</p>`;
    }

    case 'image': {
      const { width, height } = sizeOverrides(item);
      const customOverrides = item.settings?.customOverrides || {};
      const objectFit = customOverrides.objectFit || 'cover';
      const borderRadius = customOverrides.borderRadius;
      const opacity = customOverrides.opacity;
      const imgStyle = buildStyleString({
        display: 'block',
        width: width ?? '100%',
        height: height ?? 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
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

      // Resolve color slots
      const paletteColors = page.styles.colors || {};
      const resolvedBgColor = buttonStyle?.bgColorSlot === 'transparent' ? 'transparent'
        : (buttonStyle?.bgColorSlot && buttonStyle.bgColorSlot !== 'custom')
          ? (paletteColors[buttonStyle.bgColorSlot] || buttonStyle?.bgColor)
          : buttonStyle?.bgColor;

      // Background
      const bgColor = item.settings.customOverrides?.bgColor || resolvedBgColor || '#3b82f6';
      const background = isGradient
        ? (() => {
            const { angle, color1, color2, color1Slot, color2Slot } = buttonStyle.bgGradient;
            const resolvedColor1 = color1Slot && color1Slot !== 'custom'
              ? (color1Slot === 'transparent' ? 'transparent' : (paletteColors[color1Slot] || color1))
              : color1;
            const resolvedColor2 = color2Slot && color2Slot !== 'custom'
              ? (color2Slot === 'transparent' ? 'transparent' : (paletteColors[color2Slot] || color2))
              : color2;
            return `linear-gradient(${angle ?? 90}deg, ${resolvedColor1}, ${resolvedColor2})`;
          })()
        : bgColor;
      const isOutline = resolvedBgColor === 'transparent' && !isGradient;

      // sizeOverride (button-specific) takes priority over element-level size overrides
      const so = item.settings.customOverrides?.sizeOverride;
      const { width: elWidth, height: elHeight } = sizeOverrides(item);
      const width = (so?.enabled && so.width && so.width !== 'auto') ? so.width : elWidth;
      const height = (so?.enabled && so.height && so.height !== 'auto') ? so.height : elHeight;

      const resolvedTextColor = buttonStyle?.textColorSlot === 'transparent' ? 'transparent'
        : (buttonStyle?.textColorSlot && buttonStyle.textColorSlot !== 'custom')
          ? (paletteColors[buttonStyle.textColorSlot] || buttonStyle?.textColor)
          : buttonStyle?.textColor;
      const textColor = item.settings.customOverrides?.textColor || resolvedTextColor || '#ffffff';
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
        return `<div style="${buildStyleString({ width: width ?? '100%', height: height ?? '315px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' })}" data-element-id="${item.id}">No video URL set</div>`;
      }
      
      const videoStyle = {
        width: width ?? '100%',
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

    case 'label': {
      const settings = item.settings || {};
      const paletteColors = page.styles.colors || {};

      const resolvedColor = settings.colorSlot && settings.colorSlot !== 'custom'
        ? (paletteColors[settings.colorSlot] || settings.color)
        : settings.color;

      const resolvedBgColor = settings.bgColorSlot && settings.bgColorSlot !== 'custom'
        ? (paletteColors[settings.bgColorSlot] || settings.bgColor)
        : settings.bgColor;

      const labelStyle = buildStyleString({
        display: 'inline-block',
        fontFamily: 'var(--font-label-family)',
        fontSize: 'var(--font-label-size)',
        fontWeight: 'var(--font-label-weight)',
        lineHeight: '1.4',
        textAlign: settings.textAlign || 'left',
        color: resolvedColor || paletteColors.text || 'inherit',
        backgroundColor: resolvedBgColor || '#e5e7eb',
        padding: `${settings.paddingY ?? 4}px ${settings.paddingX ?? 12}px`,
        borderRadius: `${settings.borderRadius ?? 4}px`,
        border: settings.borderEnabled
          ? `${settings.borderWidth ?? 1}px solid ${settings.borderColor || '#9ca3af'}`
          : 'none',
        boxSizing: 'border-box'
      });

      return `<span style="${labelStyle}" data-element-id="${item.id}">${settings.content || ''}</span>`;
    }

    case 'card': {
      const { width, height } = sizeOverrides(item);
      const settings = item.settings || {};
      
      // Map alignment values to flexbox values
      const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
      const vMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
      const hAlign = hMap[settings.contentAlignment] || 'flex-start';
      const vAlign = vMap[settings.verticalAlignment] || 'flex-start';
      
      const cardWidth = settings.width || width;
      const cardStyle = buildStyleString({
        width: cardWidth ?? '100%',
        height: settings.height || (height ?? 'auto'),
        minWidth: '200px',
        flexShrink: cardWidth ? '0' : undefined,
        backgroundColor: settings.bgType === 'gradient'
          ? `linear-gradient(${settings.bgGradient?.angle ?? 90}deg, ${settings.bgGradient?.color1}, ${settings.bgGradient?.color2})`
          : (settings.bgColorSlot && settings.bgColorSlot !== 'custom'
              ? (settings.bgColorSlot === 'transparent' ? 'transparent' : ((page.styles.colors || {})[settings.bgColorSlot] || settings.bgColor))
              : settings.bgColor) || (page.styles.colors || {}).card || '#ffffff',
        backgroundImage: settings.bgType === 'gradient' ? undefined : undefined,
        backgroundSize: settings.bgType === 'gradient' ? 'cover' : undefined,
        backgroundPosition: settings.bgType === 'gradient' ? 'center' : undefined,
        backgroundRepeat: settings.bgType === 'gradient' ? 'no-repeat' : undefined,
        padding: `${settings.padding || 20}px`,
        border: settings.borderEnabled
          ? `${settings.borderWidth ?? 1}px solid ${settings.borderColor || '#e5e7eb'}`
          : 'none',
        borderRadius: `${settings.borderRadius ?? 8}px`,
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

        const cardPaletteColors = page.styles.colors || {};
        const cardResolvedBgColor = buttonStyle?.bgColorSlot === 'transparent' ? 'transparent'
          : (buttonStyle?.bgColorSlot && buttonStyle.bgColorSlot !== 'custom')
            ? (cardPaletteColors[buttonStyle.bgColorSlot] || buttonStyle?.bgColor)
            : buttonStyle?.bgColor;
        const bgColor = cardResolvedBgColor || '#3b82f6';
        const background = isGradient
          ? (() => {
              const { angle, color1, color2, color1Slot, color2Slot } = buttonStyle.bgGradient;
              const resolvedColor1 = color1Slot && color1Slot !== 'custom'
                ? (color1Slot === 'transparent' ? 'transparent' : (cardPaletteColors[color1Slot] || color1))
                : color1;
              const resolvedColor2 = color2Slot && color2Slot !== 'custom'
                ? (color2Slot === 'transparent' ? 'transparent' : (cardPaletteColors[color2Slot] || color2))
                : color2;
              return `linear-gradient(${angle ?? 90}deg, ${resolvedColor1}, ${resolvedColor2})`;
            })()
          : bgColor;
        const isOutline = cardResolvedBgColor === 'transparent' && !isGradient;

        const so = settings.button.sizeOverride;
        const width = (so?.enabled && so.width && so.width !== 'auto') ? so.width : 'auto';
        const height = (so?.enabled && so.height && so.height !== 'auto') ? so.height : 'auto';

        const cardResolvedTextColor = buttonStyle?.textColorSlot === 'transparent' ? 'transparent'
          : (buttonStyle?.textColorSlot && buttonStyle.textColorSlot !== 'custom')
            ? (cardPaletteColors[buttonStyle.textColorSlot] || buttonStyle?.textColor)
            : buttonStyle?.textColor;
        const textColor = cardResolvedTextColor || '#ffffff';
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
  if (!page || !page.styles) {
    return '';
  }
  const colors = page.styles.colors ?? {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    text: '#1f2937',
    background: '#f9fafb',
    neutral: '#6b7280',
    card: '#ffffff'
  };
  const fonts = page.styles.fonts ?? {
    heading1: { family: 'Inter', size: 48, weight: 700 },
    heading2: { family: 'Inter', size: 32, weight: 600 },
    body: { family: 'Inter', size: 16, weight: 400 },
    label: { family: 'Inter', size: 12, weight: 500 },
    button: { family: 'Inter', weight: 500 }
  };
  // Ensure fonts is never undefined
  if (!fonts) {
    return '';
  }
  const spacing = page.styles.spacing ?? { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 };

  const googleFontsImport = generateGoogleFontsImport(fonts);

  return `
    ${googleFontsImport}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .slot-placeholder {
      border: none !important;
    }
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-neutral: ${colors.neutral};
      --font-heading1-family: ${fonts?.heading1?.family ?? 'Inter'}, sans-serif;
      --font-heading1-size: ${fonts?.heading1?.size ?? 48}px;
      --font-heading1-weight: ${fonts?.heading1?.weight ?? 700};
      --font-heading2-family: ${fonts?.heading2?.family ?? 'Inter'}, sans-serif;
      --font-heading2-size: ${fonts?.heading2?.size ?? 32}px;
      --font-heading2-weight: ${fonts?.heading2?.weight ?? 600};
      --font-body-family: ${fonts?.body?.family ?? 'Inter'}, sans-serif;
      --font-body-size: ${fonts?.body?.size ?? 16}px;
      --font-body-weight: ${fonts?.body?.weight ?? 400};
      --font-label-family: ${fonts?.label?.family ?? 'Inter'}, sans-serif;
      --font-label-size: ${fonts?.label?.size ?? 12}px;
      --font-label-weight: ${fonts?.label?.weight ?? 500};
      --font-button-family: ${fonts?.button?.family ?? 'Inter'}, sans-serif;
      --font-button-weight: ${fonts?.button?.weight ?? 500};
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
    body { background-color: ${page.styles.bgColorSlot && page.styles.bgColorSlot !== 'custom' ? (page.styles.bgColorSlot === 'transparent' ? 'transparent' : (page.styles.colors[page.styles.bgColorSlot] || page.styles.bgColor)) : (page.styles.bgColor ?? '#f9fafb')}; }
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
      const hoverPaletteColors = page.styles.colors || {};
      const resolvedBsColor = bs.bgColorSlot === 'transparent' ? 'transparent'
        : (bs.bgColorSlot && bs.bgColorSlot !== 'custom')
          ? (hoverPaletteColors[bs.bgColorSlot] || bs.bgColor)
          : bs.bgColor;
      const hoverBg = isGradient
        ? (() => {
            const { angle, color1, color2, color1Slot, color2Slot } = bs.bgGradient;
            const resolvedColor1 = color1Slot && color1Slot !== 'custom'
              ? (color1Slot === 'transparent' ? 'transparent' : (hoverPaletteColors[color1Slot] || color1))
              : color1;
            const resolvedColor2 = color2Slot && color2Slot !== 'custom'
              ? (color2Slot === 'transparent' ? 'transparent' : (hoverPaletteColors[color2Slot] || color2))
              : color2;
            return `linear-gradient(${angle ?? 90}deg, ${darkenHex(resolvedColor1)}, ${darkenHex(resolvedColor2)})`;
          })()
        : darkenHex(resolvedBsColor || '#3b82f6');
      const isOutline = resolvedBsColor === 'transparent' && bs.bgType !== 'gradient';
      if (isOutline) return ''; // skip hover for transparent/outline buttons
      const safeId = (bs.id || 'primary').replace(/[^a-z0-9-_]/gi, '-');
      return `.btn-${safeId}:hover { background: ${hoverBg} !important; }`;
    }).filter(Boolean).join('\n    ')}
  `;
}

export function generateGoogleFontsImport(fonts) {
  // Collect font families with their weights
  const fontMap = {};

  if (!fonts) return '';
  Object.values(fonts).forEach(font => {
    if (!font || !font.family) return;
    if (!fontMap[font.family]) fontMap[font.family] = new Set();
    if (font.weight) fontMap[font.family].add(font.weight);
  });

  // Convert Sets to arrays for the URL generator
  const fontMapWithWeights = {};
  Object.entries(fontMap).forEach(([family, weights]) => {
    fontMapWithWeights[family] = Array.from(weights);
  });

  if (Object.keys(fontMapWithWeights).length === 0) return '';

  // Use the new font weight system to generate the URL
  const url = generateFontsUrl(fontMapWithWeights);
  return `@import url('${url}');`;
}
