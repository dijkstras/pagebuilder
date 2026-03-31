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

export const LAYOUT_TYPES = {
  FLEX: 'flex',
  GRID: 'grid'
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
      neutral: '#6b7280'
    },
    fonts: {
      heading: { family: 'Inter', size: 32, weight: 700 },
      body: { family: 'Inter', size: 16, weight: 400 }
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
      }
    ],
    shapes: { borderRadius: 6 }
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
    bgGradient: null,
    bgImage: null,
    bgVideo: null,
    padding: 40,
    margin: 0
  },
  children: []
});

export const createContainer = (name = 'Container') => ({
  id: `container-${Date.now()}`,
  name,
  type: 'container',
  settings: {
    layout: LAYOUT_TYPES.FLEX,
    columns: 1,
    spacing: 16
  },
  children: []
});

export const createContentItem = (contentType = CONTENT_TYPES.TEXT) => ({
  id: `content-${Date.now()}`,
  type: contentType,
  settings: {
    assignedStyleId: null,
    customOverrides: contentType === CONTENT_TYPES.TEXT ? { content: 'Your text here' } : {},
    responsiveVariants: {
      mobile: {},
      tablet: {},
      desktop: {}
    }
  }
});
