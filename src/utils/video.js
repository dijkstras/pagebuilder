/**
 * Video URL utilities for handling different video types
 */

/**
 * Detects the type of video URL
 * @param {string} url - The video URL
 * @returns {string} - 'youtube', 'direct', or 'unknown'
 */
export function detectVideoType(url) {
  if (!url) return 'unknown';
  
  // YouTube patterns
  const youtubePatterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//
  ];
  
  for (const pattern of youtubePatterns) {
    if (pattern.test(url)) return 'youtube';
  }
  
  // Direct video file extensions
  const videoExtensions = [
    /\.mp4(\?.*)?$/i,
    /\.webm(\?.*)?$/i,
    /\.ogg(\?.*)?$/i,
    /\.mov(\?.*)?$/i,
    /\.avi(\?.*)?$/i,
    /\.mkv(\?.*)?$/i
  ];
  
  for (const pattern of videoExtensions) {
    if (pattern.test(url)) return 'direct';
  }
  
  // Check for common video hosting platforms
  if (/vimeo\.com\/\d+/.test(url)) return 'vimeo';
  if (/twitch\.tv\/videos\/\d+/.test(url)) return 'twitch';
  
  return 'unknown';
}

/**
 * Extracts video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - YouTube video ID or null
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Builds YouTube embed URL with autoplay parameters
 * @param {string} videoId - YouTube video ID
 * @param {Object} params - Additional parameters
 * @returns {string} - YouTube embed URL
 */
export function buildYouTubeEmbedUrl(videoId, params = {}) {
  const defaults = {
    autoplay: 1,
    mute: 1,
    loop: 1,
    playlist: videoId,
    controls: 0,
    showinfo: 0,
    rel: 0,
    modestbranding: 1,
    playsinline: 1
  };
  const merged = { ...defaults, ...params };
  const qs = Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `https://www.youtube.com/embed/${videoId}?${qs}`;
}

/**
 * Extracts Vimeo video ID from URL
 * @param {string} url - Vimeo URL
 * @returns {string|null} - Vimeo video ID or null
 */
export function extractVimeoId(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Builds Vimeo embed URL with autoplay parameters
 * @param {string} videoId - Vimeo video ID
 * @param {Object} params - Additional parameters
 * @returns {string} - Vimeo embed URL
 */
export function buildVimeoEmbedUrl(videoId, params = {}) {
  const defaults = {
    autoplay: 1,
    loop: 1,
    muted: 1,
    background: 1
  };
  const merged = { ...defaults, ...params };
  const qs = Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `https://player.vimeo.com/video/${videoId}?${qs}`;
}

/**
 * Renders appropriate video HTML based on URL type
 * @param {string} url - Video URL
 * @param {Object} options - Rendering options
 * @param {boolean} options.isBackground - Whether this is a background video
 * @param {Object} options.style - CSS styles to apply
 * @param {string} options.bgSize - Background size (cover, contain, or custom size)
 * @param {string} options.bgPositionX - Horizontal position (left, center, right)
 * @param {string} options.bgPositionY - Vertical position (top, center, bottom)
 * @returns {string} - HTML string for the video
 */
export function renderVideo(url, options = {}) {
  const { 
    isBackground = false, 
    style = {}, 
    bgSize = 'cover',
    bgPositionX = 'center',
    bgPositionY = 'center'
  } = options;
  const videoType = detectVideoType(url);
  
  const defaultStyle = isBackground ? {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: bgSize,
    objectPosition: `${bgPositionX} ${bgPositionY}`,
    pointerEvents: 'none',
    border: 'none',
    zIndex: '0'
  } : {
    border: 'none',
    display: 'block'
  };
  
  const mergedStyle = { ...defaultStyle, ...style };
  const styleStr = Object.entries(mergedStyle)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
  
  switch (videoType) {
    case 'youtube': {
      const videoId = extractYouTubeId(url);
      if (!videoId) return '';
      const embedUrl = buildYouTubeEmbedUrl(videoId);
      return `<iframe src="${embedUrl}" style="${styleStr}" frameborder="0" allow="autoplay;encrypted-media" ${!isBackground ? 'allowfullscreen' : ''}></iframe>`;
    }
    
    case 'vimeo': {
      const videoId = extractVimeoId(url);
      if (!videoId) return '';
      const embedUrl = buildVimeoEmbedUrl(videoId);
      return `<iframe src="${embedUrl}" style="${styleStr}" frameborder="0" allow="autoplay;encrypted-media" ${!isBackground ? 'allowfullscreen' : ''}></iframe>`;
    }
    
    case 'direct': {
      const videoAttrs = isBackground 
        ? 'autoplay muted loop playsinline'
        : 'controls';
      return `<video src="${url}" style="${styleStr}" ${videoAttrs}></video>`;
    }
    
    default:
      return '';
  }
}
