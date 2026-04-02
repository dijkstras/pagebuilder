/**
 * Extracts a YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * Returns null if no ID can be extracted.
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
