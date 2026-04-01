export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024
};

export const CONTENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  CARD: 'card'
};

export const MAX_WIDTH_PRESETS = [
  { label: 'Full width', value: null },
  { label: '960px', value: 960 },
  { label: '1200px', value: 1200 },
  { label: '1400px', value: 1400 },
  { label: 'Custom', value: 'custom' }
];

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
      neutral: '#6b7280'
    },
    fonts: {
      heading1: { family: 'Inter', size: 48, weight: 700 },
      heading2: { family: 'Inter', size: 32, weight: 600 },
      body: { family: 'Inter', size: 16, weight: 400 },
      label: { family: 'Inter', size: 12, weight: 500 }
    },
    buttonStyles: [
      {
        id: 'primary',
        label: 'Primary',
        bgColor: '#3b82f6',
        textColor: '#ffffff',
        padding: 12,
        radius: 6
      },
      {
        id: 'secondary',
        label: 'Secondary',
        bgColor: '#e5e7eb',
        textColor: '#1f2937',
        padding: 12,
        radius: 6
      },
      {
        id: 'tertiary',
        label: 'Tertiary',
        bgColor: 'transparent',
        textColor: '#3b82f6',
        padding: 12,
        radius: 6
      }
    ],
    shapes: { borderRadius: 6 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
    bgColor: '#f9fafb'
  },
  root: []
});

export const createSegment = (name = 'Segment') => ({
  id: `segment-${Date.now()}`,
  name,
  type: 'segment',
  settings: {
    fullWidth: true,
    bgColor: '#ffffff',
    bgImage: null,
    padding: 40,
    margin: 0,
    gutter: 24,
    maxWidth: null,
    contentAlignment: 'left',
    verticalAlignment: 'top',
    direction: 'row',
    minHeight: 200,
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#000000',
    elevationEnabled: false,
    elevation: 4,
    borderRadius: 0
  },
  children: []
});

export const createContainer = (name = 'Container') => ({
  id: `container-${Date.now()}`,
  name,
  type: 'container',
  settings: {
    columnSpan: 12,
    spacing: 16,
    bgColor: 'transparent',
    bgImage: null,
    padding: 20,
    contentAlignment: 'left',
    verticalAlignment: 'top',
    direction: 'column',
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#000000',
    elevationEnabled: false,
    elevation: 4,
    borderRadius: 0
  },
  children: []
});

export const createContentItem = (contentType = CONTENT_TYPES.TEXT) => ({
  id: `content-${Date.now()}`,
  type: contentType,
  settings: {
    assignedStyleId: contentType === CONTENT_TYPES.BUTTON ? 'primary' : null,
    textRole: contentType === CONTENT_TYPES.TEXT ? 'body' : null,
    customOverrides: contentType === CONTENT_TYPES.TEXT
      ? { content: 'Your text here' }
      : contentType === CONTENT_TYPES.BUTTON
        ? { label: 'Button' }
        : {},
    responsiveVariants: {
      mobile: {},
      tablet: {},
      desktop: {}
    }
  }
});

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
    neutral: '#6b7280'
  };

  const colors = {
    ...defaultColors,
    ...(page.styles?.colors ?? {})
  };

  return {
    ...page,
    styles: {
      ...page.styles,
      colors,
      fonts: {
        heading1: migrateFontToken(page.styles?.fonts?.heading1, { size: 48, weight: 700 }),
        heading2: migrateFontToken(page.styles?.fonts?.heading2, { size: 32, weight: 600 }),
        body: migrateFontToken(page.styles?.fonts?.body, { size: 16, weight: 400 }),
        label: migrateFontToken(page.styles?.fonts?.label, { size: 12, weight: 500 })
      },
      spacing: page.styles?.spacing ?? { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
      bgColor: page.styles?.bgColor ?? '#f9fafb',
      buttonStyles
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

function migrateSegment(segment) {
  const s = segment.settings ?? {};
  return {
    ...segment,
    settings: {
      fullWidth: s.fullWidth ?? true,
      bgColor: s.bgColor ?? '#ffffff',
      bgImage: s.bgImage ?? null,
      padding: s.padding ?? 40,
      margin: s.margin ?? 0,
      gutter: s.gutter ?? 24,
      maxWidth: s.maxWidth ?? null,
      contentAlignment: s.contentAlignment ?? 'left',
      verticalAlignment: s.verticalAlignment ?? 'top',
      direction: s.direction ?? 'row',
      minHeight: s.minHeight ?? 200,
      borderEnabled: s.borderEnabled ?? false,
      borderWidth: s.borderWidth ?? 1,
      borderColor: s.borderColor ?? '#000000',
      elevationEnabled: s.elevationEnabled ?? false,
      elevation: s.elevation ?? 4,
      borderRadius: s.borderRadius ?? 0
    },
    children: (segment.children ?? []).map(child =>
      child.type === 'container' ? migrateContainer(child) : child
    )
  };
}

function migrateContainer(container) {
  const s = container.settings ?? {};
  const legacyColumnMap = { 1: 12, 2: 6, 3: 4, 4: 3 };
  const columnSpan = s.columnSpan ?? (s.columns ? (legacyColumnMap[s.columns] ?? 12) : 12);
  return {
    ...container,
    settings: {
      columnSpan,
      spacing: s.spacing ?? 16,
      bgColor: s.bgColor ?? 'transparent',
      bgImage: s.bgImage ?? null,
      padding: s.padding ?? 20,
      contentAlignment: s.contentAlignment ?? 'left',
      verticalAlignment: s.verticalAlignment ?? 'top',
      direction: s.direction ?? 'column',
      borderEnabled: s.borderEnabled ?? false,
      borderWidth: s.borderWidth ?? 1,
      borderColor: s.borderColor ?? '#000000',
      elevationEnabled: s.elevationEnabled ?? false,
      elevation: s.elevation ?? 4,
      borderRadius: s.borderRadius ?? 0
    },
    children: (container.children ?? []).map(child =>
      child.type === 'container' ? migrateContainer(child) : child
    )
  };
}
