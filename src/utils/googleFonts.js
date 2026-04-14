// Cache for font weights to avoid repeated API calls
const fontWeightsCache = new Map();

// Common weight labels
export const WEIGHT_LABELS = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi-bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black'
};

// Fallback weights for common font types
const FALLBACK_WEIGHTS = {
  // Most fonts support these basic weights
  default: [400, 500, 600, 700],
  // Display fonts often have fewer weights
  display: [400, 700],
  // Script fonts usually only have one weight
  script: [400],
  // Variable fonts support all weights
  variable: [100, 200, 300, 400, 500, 600, 700, 800, 900]
};

// Font categorization based on common patterns
function getFontCategory(fontFamily) {
  const name = fontFamily.toLowerCase();
  
  // Common display fonts
  const displayFonts = ['playfair display', 'montserrat', 'oswald', 'poppins', 'raleway', 'work sans'];
  if (displayFonts.some(font => name.includes(font))) {
    return 'display';
  }
  
  // Common script fonts
  const scriptFonts = ['pacifico', 'caveat', 'dancing script', 'great vibes'];
  if (scriptFonts.some(font => name.includes(font))) {
    return 'script';
  }
  
  // Common variable fonts
  const variableFonts = ['inter', 'roboto', 'open sans', 'source sans 3', 'dm sans', 'bricolage grotesque'];
  if (variableFonts.some(font => name.includes(font))) {
    return 'variable';
  }
  
  return 'default';
}

// Get available weights for a font family based on common knowledge
export function getAvailableFontWeights(fontFamily) {
  // Check cache first
  if (fontWeightsCache.has(fontFamily)) {
    return fontWeightsCache.get(fontFamily);
  }

  const name = fontFamily.toLowerCase();
  
  // Known weights for popular Google Fonts
  const knownWeights = {
    // Variable fonts - support all weights
    'inter': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    'roboto': [100, 300, 400, 500, 700, 900],
    'open sans': [300, 400, 600, 700, 800],
    'source sans 3': [200, 300, 400, 500, 600, 700, 800, 900],
    'dm sans': [400, 500, 700],
    
    // Display fonts with limited weights
    'montserrat': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    'poppins': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    'raleway': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    'work sans': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    'oswald': [200, 300, 400, 500, 600, 700],
    'bricolage grotesque': [200, 300, 400, 500, 600, 700, 800],
    
    // Serif fonts
    'merriweather': [300, 400, 700, 900],
    'playfair display': [400, 500, 600, 700, 800, 900],
    'lora': [400, 500, 600, 700],
    'crimson text': [400, 600, 700],
    
    // Script/Display fonts with very limited weights
    'pacifico': [400],
    'caveat': [400, 700],
    'inconsolata': [400, 700],
    'space grotesk': [300, 400, 500, 600, 700],
    'nunito': [200, 300, 400, 500, 600, 700, 800, 900]
  };

  // Check if we have known weights for this font
  if (knownWeights[name]) {
    fontWeightsCache.set(fontFamily, knownWeights[name]);
    return knownWeights[name];
  }

  // Fallback to category-based weights
  const category = getFontCategory(fontFamily);
  const fallbackWeights = FALLBACK_WEIGHTS[category] || FALLBACK_WEIGHTS.default;
  
  fontWeightsCache.set(fontFamily, fallbackWeights);
  return fallbackWeights;
}

// Get weight options for a font family (formatted for dropdown)
export function getWeightOptions(fontFamily) {
  const weights = getAvailableFontWeights(fontFamily);
  return weights.map(weight => ({
    label: WEIGHT_LABELS[weight] || `Weight ${weight}`,
    value: weight
  }));
}

// Generate Google Fonts URL with specific weights
export function generateFontsUrl(fontMap) {
  const params = [];
  
  Object.entries(fontMap).forEach(([family, weights]) => {
    const weightsStr = weights ? `:wght@${weights.join(';')}` : '';
    const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
    params.push(`family=${encodedFamily}${weightsStr}`);
  });
  
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}
