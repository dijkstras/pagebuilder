export const DEFAULT_PAGE_WIDTH = 1200;

export const EDITOR_LAYOUT = {
  LEFT_PANEL_WIDTH: 300,
  RIGHT_PANEL_WIDTH: 350,
  PREVIEW_MIN_WIDTH: 600
};

export const THEME = {
  background: '#2d3748',
  surface: '#1a202c',
  border: '#4a5568',
  text: '#f7fafc',
  textMuted: '#a0aec0',
  accent: '#4299e1'
};

export const CONTENT_TYPE_LABELS = {
  text: 'Text',
  image: 'Image',
  button: 'Button',
  video: 'Video',
  card: 'Card',
  label: 'Label'
};

export function buildClamp(min, max) {
  const slope = (max - min) / (1440 - 320);
  const intercept = min - slope * 320;
  const vw = (slope * 100).toFixed(2);
  const rem = (intercept / 16).toFixed(3);
  return `clamp(${min}px, ${vw}vw + ${rem}rem, ${max}px)`;
}
