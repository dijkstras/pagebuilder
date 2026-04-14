export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024
};

export const CONTENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  VIDEO: 'video',
  CARD: 'card',
  LABEL: 'label'
};

export const MAX_WIDTH_PRESETS = [
  { label: 'Full width', value: null },
  { label: '960px', value: 960 },
  { label: '1200px', value: 1200 },
  { label: '1400px', value: 1400 },
  { label: 'Custom', value: 'custom' }
];

export const LAYOUT_PRESETS = {
  'full':       { label: 'Full width',     slots: [12] },
  '50-50':      { label: '50 / 50',        slots: [6, 6] },
  '33-67':      { label: '1/3 + 2/3',      slots: [4, 8] },
  '67-33':      { label: '2/3 + 1/3',      slots: [8, 4] },
  '33-33-33':   { label: '3 equal',         slots: [4, 4, 4] },
  '25-75':      { label: '1/4 + 3/4',      slots: [3, 9] },
  '75-25':      { label: '3/4 + 1/4',      slots: [9, 3] },
  '25-50-25':   { label: 'Sidebar layout',  slots: [3, 6, 3] }
};

export const GAP_PRESETS = {
  none: { label: 'None',    twClass: 'gap-0',  px: 0 },
  sm:   { label: 'Small',   twClass: 'gap-3',  px: 12 },
  md:   { label: 'Medium',  twClass: 'gap-6',  px: 24 },
  lg:   { label: 'Large',   twClass: 'gap-10', px: 40 },
  xl:   { label: 'X-Large', twClass: 'gap-16', px: 64 }
};

export const SEGMENT_SPACING_PRESETS = {
  sm: { label: 'Small',   px: 24 },
  md: { label: 'Medium',  px: 40 },
  lg: { label: 'Large',   px: 80 }
};

// Default empty page structure
export const createEmptyPage = () => ({
  id: `page-${Date.now()}`,
  title: 'Untitled Page',
  breakpoints: BREAKPOINTS,
  styles: {
    logo: null,
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      text: '#1f2937',
      background: '#f9fafb',
      neutral: '#6b7280',
      card: '#ffffff'
    },
    fonts: {
      heading1: { family: 'Inter', size: 48, weight: 700 },
      heading2: { family: 'Inter', size: 32, weight: 600 },
      body: { family: 'Inter', size: 16, weight: 400 },
      label: { family: 'Inter', size: 12, weight: 500 },
      button: { family: 'Inter', weight: 500 }
    },
    buttonStyles: [
      {
        id: 'primary',
        label: 'Primary',
        bgColor: '#3b82f6',
        bgColorSlot: 'primary',
        bgType: 'solid',
        bgGradient: null,
        fontSize: 14,
        textColor: '#ffffff',
        textColorSlot: 'custom',
        padding: 12,
        radius: 6
      },
      {
        id: 'secondary',
        label: 'Secondary',
        bgColor: '#e5e7eb',
        bgColorSlot: 'neutral',
        bgType: 'solid',
        bgGradient: null,
        fontSize: 14,
        textColor: '#1f2937',
        textColorSlot: 'text',
        padding: 12,
        radius: 6
      },
      {
        id: 'tertiary',
        label: 'Tertiary',
        bgColor: 'transparent',
        bgColorSlot: 'custom',
        bgType: 'solid',
        bgGradient: null,
        fontSize: 14,
        textColor: '#3b82f6',
        textColorSlot: 'primary',
        padding: 12,
        radius: 6
      }
    ],
    shapes: { borderRadius: 6 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
    segmentSpacing: 'md',
    bgColor: '#f9fafb',
    bgColorSlot: 'background'
  },
  root: []
});

export const createSegment = (name = 'Segment', layout = 'full') => {
  const preset = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS['full'];
  const slots = preset.slots.map((span, i) => createSlot(
    `Column ${i + 1}`,
    span
  ));
  return {
    id: `segment-${Date.now()}`,
    name,
    type: 'segment',
    settings: {
      layout,
      gap: 'md',
      fullWidth: true,
      bgColor: '#ffffff',
      bgImage: null,
      bgVideo: null,
      maxWidth: null,
      contentAlignment: 'left',
      verticalAlignment: 'top',
      minHeight: 200,
      borderEnabled: false,
      borderWidth: 1,
      borderColor: '#000000',
      elevationEnabled: false,
      elevation: 4,
      borderRadius: 0
    },
    children: slots
  };
};

export const createSlot = (name = 'Column', gridColumn = 12) => ({
  id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name,
  type: 'slot',
  settings: {
    gridColumn,
    height: '250px',
    spacing: 16,
    bgColor: 'transparent',
    bgImage: null,
    bgVideo: null,
    padding: 0,
    contentAlignment: 'left',
    verticalAlignment: 'top',
    direction: 'column',
    overflow: 'wrap',
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#000000',
    elevationEnabled: false,
    elevation: 4,
    borderRadius: 0,
    responsive: {
      hideOnMobile: false,
      mobileOrder: null
    }
  },
  children: []
});

export const createContainer = (name = 'Container') => ({
  id: `container-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name,
  type: 'container',
  settings: {
    gridColumn: 12,
    height: 'auto',
    spacing: 16,
    bgColor: 'transparent',
    bgImage: null,
    bgVideo: null,
    bgType: 'solid',
    bgGradient: null,
    padding: 0,
    contentAlignment: 'left',
    verticalAlignment: 'top',
    direction: 'column',
    overflow: 'wrap',
    minWidth: null,
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#000000',
    elevationEnabled: false,
    elevation: 4,
    borderRadius: 0,
    responsive: {
      hideOnMobile: false,
      mobileOrder: null
    },
    mobileOverrides: {}
  },
  children: []
});

export const createContentItem = (contentType = CONTENT_TYPES.TEXT) => {
  if (contentType === CONTENT_TYPES.LABEL) {
    return {
      id: `content-${Date.now()}`,
      type: contentType,
      settings: {
        content: 'Label text',
        textAlign: 'left',
        color: null,
        colorSlot: null,
        bgColor: '#e5e7eb',
        bgColorSlot: 'neutral',
        paddingX: 12,
        paddingY: 4,
        borderEnabled: false,
        borderWidth: 1,
        borderColor: '#9ca3af',
        borderRadius: 4,
        responsive: {
          hideOnMobile: false,
          hideOnDesktop: false
        },
        responsiveVariants: {
          mobile: {},
          tablet: {},
          desktop: {}
        }
      }
    };
  }

  if (contentType === CONTENT_TYPES.CARD) {
    return {
      id: `content-${Date.now()}`,
      type: contentType,
      settings: {
        width: '300px',
        height: 'auto',
        bgColor: '#ffffff',
        bgColorSlot: 'card',
        bgType: 'solid',
        bgGradient: null,
        padding: 20,
        direction: 'column',
        contentAlignment: 'left',
        verticalAlignment: 'top',
        spacing: 12,
        borderEnabled: false,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        elevationEnabled: false,
        elevation: 4,
        // Card elements
        showImage: true,
        showText: true,
        showButton: true,
        image: {
          src: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          objectFit: 'cover',
          borderRadius: '4px'
        },
        text: {
          content: 'Card title goes here',
          textRole: 'heading2',
          textAlign: 'left',
          color: null
        },
        button: {
          label: 'Learn More',
          assignedStyleId: 'primary',
          icon: { key: null, position: 'none' },
          sizeOverride: { enabled: false, width: 'auto', height: 'auto' }
        }
      },
      responsiveVariants: {
        mobile: {},
        tablet: {},
        desktop: {}
      }
    };
  }

  return {
    id: `content-${Date.now()}`,
    type: contentType,
    settings: {
      assignedStyleId: contentType === CONTENT_TYPES.BUTTON ? 'primary' : null,
      textRole: contentType === CONTENT_TYPES.TEXT ? 'body' : null,
      customOverrides: contentType === CONTENT_TYPES.TEXT
        ? { content: 'Your text here' }
        : contentType === CONTENT_TYPES.BUTTON
          ? { label: 'Button', icon: { key: null, position: 'none' }, sizeOverride: { enabled: false, width: 'auto', height: 'auto' } }
          : contentType === CONTENT_TYPES.IMAGE
            ? { src: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
            : contentType === CONTENT_TYPES.VIDEO
              ? { src: '' }
              : {},
      responsive: {
        hideOnMobile: false,
        hideOnDesktop: false
      },
      responsiveVariants: {
        mobile: {},
        tablet: {},
        desktop: {}
      }
    }
  };
};

// Migrate saved pages from older data shapes
export function migratePage(page) {
  const existingButtons = page.styles?.buttonStyles ?? [];
  const hasTertiary = existingButtons.some(b => b.id === 'tertiary');
  const buttonStyles = hasTertiary ? existingButtons : [
    ...existingButtons,
    { id: 'tertiary', label: 'Tertiary', bgColor: 'transparent', textColor: '#3b82f6', padding: 12, radius: 6 }
  ];

  // Ensure all 6 semantic colors exist
  const defaultColors = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    text: '#1f2937',
    background: '#f9fafb',
    neutral: '#6b7280',
    card: '#ffffff'
  };

  const colors = {
    ...defaultColors,
    ...(page.styles?.colors ?? {})
  };

  return {
    ...page,
    mobileOverrides: page.mobileOverrides ?? {},
    styles: {
      ...page.styles,
      colors,
      fonts: {
        heading1: migrateFontToken(page.styles?.fonts?.heading1, { size: 48, weight: 700 }),
        heading2: migrateFontToken(page.styles?.fonts?.heading2, { size: 32, weight: 600 }),
        body: migrateFontToken(page.styles?.fonts?.body, { size: 16, weight: 400 }),
        label: migrateFontToken(page.styles?.fonts?.label, { size: 12, weight: 500 }),
        button: page.styles?.fonts?.button ?? { family: 'Inter', weight: 500 }
      },
      spacing: page.styles?.spacing ?? { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
      bgColor: page.styles?.bgColor ?? '#f9fafb',
      buttonStyles: buttonStyles.map(b => ({
        ...b,
        bgType: b.bgType ?? 'solid',
        bgGradient: b.bgGradient ?? null,
        fontSize: b.fontSize ?? 14
      }))
    },
    root: (page.root ?? []).map(migrateSegment)
  };
}

function migrateFontToken(font, defaults) {
  if (!font) return { family: 'Inter', ...defaults };
  // Handle old minMax structure and new size structure
  const size = font.size ?? defaults.size;
  return { family: font.family ?? 'Inter', size, weight: font.weight ?? defaults.weight };
}

function migrateContentItem(item) {
  const settings = item.settings ?? {};
  const responsive = settings.responsive ?? { hideOnMobile: false, hideOnDesktop: false };
  const mobileOverrides = settings.mobileOverrides ?? {};

  if (item.type === 'button') {
    const overrides = settings.customOverrides ?? {};
    const needsIcon = !overrides.icon;
    const needsSize = !overrides.sizeOverride;
    return {
      ...item,
      settings: {
        ...settings,
        responsive,
        mobileOverrides,
        customOverrides: {
          ...overrides,
          ...(needsIcon ? { icon: { key: null, position: 'none' } } : {}),
          ...(needsSize ? { sizeOverride: { enabled: false, width: 'auto', height: 'auto' } } : {})
        }
      }
    };
  }

  // All other types: just ensure responsive and mobileOverrides exist
  return {
    ...item,
    settings: { ...settings, responsive, mobileOverrides }
  };
}

function inferLayoutFromChildren(segment) {
  const containers = (segment.children ?? []).filter(c => c.type === 'container' || c.type === 'slot');
  if (containers.length === 0 || containers.length === 1) return 'full';

  const legacyColumnMap = { 1: 12, 2: 6, 3: 4, 4: 3 };
  const spans = containers.map(c => {
    const s = c.settings ?? {};
    return s.gridColumn ?? s.columnSpan ?? (s.columns ? (legacyColumnMap[s.columns] ?? 12) : 12);
  });

  // Try exact match
  const exact = Object.entries(LAYOUT_PRESETS).find(([, preset]) =>
    preset.slots.length === spans.length &&
    preset.slots.every((s, i) => s === spans[i])
  );
  if (exact) return exact[0];

  // Nearest match with same slot count
  const sameLengthPresets = Object.entries(LAYOUT_PRESETS)
    .filter(([, preset]) => preset.slots.length === spans.length);
  if (sameLengthPresets.length > 0) {
    const nearest = sameLengthPresets.reduce((best, [key, preset]) => {
      const diff = preset.slots.reduce((sum, s, i) => sum + Math.abs(s - spans[i]), 0);
      return diff < best.diff ? { key, diff } : best;
    }, { key: 'full', diff: Infinity });
    return nearest.key;
  }

  return 'full';
}

function inferGap(gutter) {
  if (gutter == null || gutter === 'auto') return 'md';
  if (gutter === 0) return 'none';
  if (gutter <= 16) return 'sm';
  if (gutter <= 32) return 'md';
  if (gutter <= 48) return 'lg';
  return 'xl';
}

function migrateSegment(segment) {
  const s = segment.settings ?? {};

  // Infer layout and gap from existing data if not set
  const layout = s.layout ?? inferLayoutFromChildren(segment);
  const gap = s.gap ?? inferGap(s.gutter);
  const preset = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS['full'];

  // Migrate children: separate slots/containers from loose content
  const rawChildren = segment.children ?? [];
  const slotsOrContainers = rawChildren.filter(c => c.type === 'container' || c.type === 'slot');
  const looseContent = rawChildren.filter(c => c.type !== 'container' && c.type !== 'slot');

  let migratedChildren = slotsOrContainers.map((child, i) => migrateContainerToSlot(child, preset.slots[i]));

  // Wrap loose content in a slot
  if (looseContent.length > 0) {
    migratedChildren.push({
      id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-wrap`,
      name: 'Content',
      type: 'slot',
      settings: {
        gridColumn: 12,
        height: 'auto',
        spacing: 16,
        bgColor: 'transparent',
        bgImage: null,
        bgVideo: null,
        padding: 20,
        contentAlignment: 'left',
        verticalAlignment: 'top',
        direction: 'column',
        borderEnabled: false,
        borderWidth: 1,
        borderColor: '#000000',
        elevationEnabled: false,
        elevation: 4,
        borderRadius: 0,
        responsive: { hideOnMobile: false, mobileOrder: null }
      },
      children: looseContent.map(migrateContentItem)
    });
  }

  // Ensure slot count matches preset
  while (migratedChildren.length < preset.slots.length) {
    migratedChildren.push(createSlot(
      `Column ${migratedChildren.length + 1}`,
      preset.slots[migratedChildren.length]
    ));
  }

  return {
    ...segment,
    settings: {
      ...s,
      layout,
      gap,
      fullWidth: s.fullWidth ?? true,
      bgColor: s.bgColor ?? '#ffffff',
      bgImage: s.bgImage ?? null,
      bgVideo: s.bgVideo ?? null,
      bgType: s.bgType ?? 'solid',
      bgGradient: s.bgGradient ?? null,
      maxWidth: s.maxWidth ?? null,
      contentAlignment: s.contentAlignment ?? 'left',
      verticalAlignment: s.verticalAlignment ?? 'top',
      minHeight: s.minHeight ?? 200,
      borderEnabled: s.borderEnabled ?? false,
      borderWidth: s.borderWidth ?? 1,
      borderColor: s.borderColor ?? '#000000',
      elevationEnabled: s.elevationEnabled ?? false,
      elevation: s.elevation ?? 4,
      borderRadius: s.borderRadius ?? 0,
      mobileOverrides: s.mobileOverrides ?? {}
    },
    children: migratedChildren
  };
}

function migrateContainerToSlot(container, presetSpan) {
  const s = container.settings ?? {};
  const legacyColumnMap = { 1: 12, 2: 6, 3: 4, 4: 3 };
  const gridColumn = s.gridColumn ?? s.columnSpan ?? (s.columns ? (legacyColumnMap[s.columns] ?? 12) : presetSpan ?? 12);

  return {
    ...container,
    id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, // Generate unique ID
    type: 'slot',
    settings: {
      ...s,
      gridColumn,
      height: s.height ?? '250px',
      spacing: s.spacing ?? 16,
      bgColor: s.bgColor ?? 'transparent',
      bgImage: s.bgImage ?? null,
      bgVideo: s.bgVideo ?? null,
      bgType: s.bgType ?? 'solid',
      bgGradient: s.bgGradient ?? null,
      padding: s.padding ?? 0,
      contentAlignment: s.contentAlignment ?? 'left',
      verticalAlignment: s.verticalAlignment ?? 'top',
      direction: s.direction ?? 'column',
      overflow: s.overflow ?? 'wrap',
      borderEnabled: s.borderEnabled ?? false,
      borderWidth: s.borderWidth ?? 1,
      borderColor: s.borderColor ?? '#000000',
      elevationEnabled: s.elevationEnabled ?? false,
      elevation: s.elevation ?? 4,
      borderRadius: s.borderRadius ?? 0,
      responsive: s.responsive ?? { hideOnMobile: false, mobileOrder: null },
      mobileOverrides: s.mobileOverrides ?? {}
    },
    children: (container.children ?? []).map(migrateContentItem)
  };
}
