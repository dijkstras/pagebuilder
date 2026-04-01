# Video Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a YouTube video content element and a YouTube video background option for Segments and Containers.

**Architecture:** Two parallel features using the same `extractYouTubeId` utility. The video content element is a new `CONTENT_TYPES.VIDEO` rendered as a YouTube iframe. The video background adds a `bgVideo` field to segment/container settings, rendered as an absolutely-positioned muted/autoplay/looping YouTube iframe behind the content.

**Tech Stack:** React 18, inline styles (no CSS files), HTML generation via pageGenerator.js, data model in pageTypes.js.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/store/pageTypes.js` | Add `VIDEO` to CONTENT_TYPES, add `bgVideo: null` to createSegment/createContainer, update migrations |
| `src/utils/constants.js` | Add `video: 'Video'` to CONTENT_TYPE_LABELS |
| `src/utils/youtube.js` | **Create** — `extractYouTubeId(url)` utility |
| `src/services/pageGenerator.js` | Add `case 'video'` to renderContentItem; add video background iframe to renderSegment and renderContainer |
| `src/components/SettingsPanel/ContentSettings.jsx` | Add VIDEO settings section (YouTube URL input) |
| `src/components/SettingsPanel/SegmentSettings.jsx` | Add background video URL input |
| `src/components/SettingsPanel/ContainerSettings.jsx` | Add background video URL input |
| `src/components/StructureTree/TreeNode.jsx` | Add `video` icon to getIcon map |

---

### Task 1: Add VIDEO content type to data model

**Files:**
- Modify: `src/store/pageTypes.js`
- Modify: `src/utils/constants.js`

- [ ] **Step 1: Add VIDEO to CONTENT_TYPES in pageTypes.js**

In `src/store/pageTypes.js`, change:
```js
export const CONTENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  CARD: 'card'
};
```
to:
```js
export const CONTENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  CARD: 'card',
  VIDEO: 'video'
};
```

- [ ] **Step 2: Add VIDEO case to createContentItem in pageTypes.js**

In `createContentItem`, change:
```js
customOverrides: contentType === CONTENT_TYPES.TEXT
  ? { content: 'Your text here' }
  : contentType === CONTENT_TYPES.BUTTON
    ? { label: 'Button' }
    : {},
```
to:
```js
customOverrides: contentType === CONTENT_TYPES.TEXT
  ? { content: 'Your text here' }
  : contentType === CONTENT_TYPES.BUTTON
    ? { label: 'Button' }
    : contentType === CONTENT_TYPES.VIDEO
      ? { src: '' }
      : {},
```

- [ ] **Step 3: Add video label to CONTENT_TYPE_LABELS in constants.js**

In `src/utils/constants.js`, change:
```js
export const CONTENT_TYPE_LABELS = {
  text: 'Text',
  image: 'Image',
  button: 'Button',
  card: 'Card'
};
```
to:
```js
export const CONTENT_TYPE_LABELS = {
  text: 'Text',
  image: 'Image',
  button: 'Button',
  card: 'Card',
  video: 'Video'
};
```

- [ ] **Step 4: Commit**

```bash
git add src/store/pageTypes.js src/utils/constants.js
git commit -m "feat: add VIDEO content type to data model"
```

---

### Task 2: Add bgVideo to Segment and Container data model

**Files:**
- Modify: `src/store/pageTypes.js`

- [ ] **Step 1: Add bgVideo to createSegment settings**

In `src/store/pageTypes.js`, in `createSegment`, add `bgVideo: null` to the settings object:
```js
settings: {
  fullWidth: true,
  bgColor: '#ffffff',
  bgImage: null,
  bgVideo: null,        // <-- add this line
  padding: 40,
  // ... rest unchanged
```

- [ ] **Step 2: Add bgVideo to createContainer settings**

In `createContainer`, add `bgVideo: null` to the settings object:
```js
settings: {
  columnSpan: 12,
  spacing: 16,
  bgColor: 'transparent',
  bgImage: null,
  bgVideo: null,        // <-- add this line
  padding: 20,
  // ... rest unchanged
```

- [ ] **Step 3: Add bgVideo to migrateSegment**

In `migrateSegment`, add:
```js
bgVideo: s.bgVideo ?? null,
```
after the `bgImage` line:
```js
bgImage: s.bgImage ?? null,
bgVideo: s.bgVideo ?? null,
```

- [ ] **Step 4: Add bgVideo to migrateContainer**

In `migrateContainer`, add:
```js
bgVideo: s.bgVideo ?? null,
```
after the `bgImage` line:
```js
bgImage: s.bgImage ?? null,
bgVideo: s.bgVideo ?? null,
```

- [ ] **Step 5: Commit**

```bash
git add src/store/pageTypes.js
git commit -m "feat: add bgVideo field to segment and container data model"
```

---

### Task 3: Create YouTube ID extraction utility

**Files:**
- Create: `src/utils/youtube.js`

- [ ] **Step 1: Create the utility file**

Create `src/utils/youtube.js` with this content:
```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/youtube.js
git commit -m "feat: add YouTube ID extraction utility"
```

---

### Task 4: Render VIDEO content element in pageGenerator.js

**Files:**
- Modify: `src/services/pageGenerator.js`

- [ ] **Step 1: Import extractYouTubeId and buildYouTubeEmbedUrl at top of pageGenerator.js**

Add this import at the top of `src/services/pageGenerator.js` (it currently has no imports):
```js
import { extractYouTubeId, buildYouTubeEmbedUrl } from '../utils/youtube.js';
```

- [ ] **Step 2: Add video case to renderContentItem**

In `renderContentItem`, add a `case 'video':` block before the `default:` case:
```js
case 'video': {
  const { width, height } = sizeOverrides(item);
  const videoId = extractYouTubeId(item.settings.customOverrides.src || '');
  if (!videoId) {
    return `<div style="${buildStyleString({ width: width ?? '560px', height: height ?? '315px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' })}" data-element-id="${item.id}">No video URL set</div>`;
  }
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  return `<iframe src="${embedUrl}" style="${buildStyleString({ width: width ?? '560px', height: height ?? '315px', border: 'none', display: 'block' })}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen data-element-id="${item.id}"></iframe>`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/pageGenerator.js
git commit -m "feat: render YouTube video content element in page generator"
```

---

### Task 5: Render video background in pageGenerator.js

**Files:**
- Modify: `src/services/pageGenerator.js`

The technique: when `bgVideo` is set, add `position: relative; overflow: hidden` to the outer element, inject a YouTube iframe as the first child with absolute positioning that covers the container, and wrap children in a `position: relative; z-index: 1` div.

- [ ] **Step 1: Update renderSegment to support bgVideo**

In `renderSegment`, change the `overflow: 'visible'` in `outerStyle` to be conditional:

Find:
```js
    borderRadius: `${segment.settings.borderRadius ?? 0}px`,
    overflow: 'visible'
```
Replace with:
```js
    borderRadius: `${segment.settings.borderRadius ?? 0}px`,
    overflow: segment.settings.bgVideo ? 'hidden' : 'visible',
    position: segment.settings.bgVideo ? 'relative' : undefined
```

Then update the return statement at the bottom of `renderSegment`. Find:
```js
  return `<section style="${outerStyle}" data-element-id="${segment.id}">
  <div style="${innerStyle}">
    ${children}
  </div>
</section>`;
```
Replace with:
```js
  const segmentVideoId = segment.settings.bgVideo
    ? extractYouTubeId(segment.settings.bgVideo)
    : null;
  const segmentVideoBg = segmentVideoId
    ? `<iframe src="${buildYouTubeEmbedUrl(segmentVideoId)}" style="position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100%;min-width:177.78vh;transform:translate(-50%,-50%);pointer-events:none;border:none;z-index:0" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe>`
    : '';
  const innerZIndex = segmentVideoId ? `${innerStyle}; position: relative; z-index: 1` : innerStyle;

  return `<section style="${outerStyle}" data-element-id="${segment.id}">
  ${segmentVideoBg}
  <div style="${innerZIndex}">
    ${children}
  </div>
</section>`;
```

- [ ] **Step 2: Update renderContainer to support bgVideo**

In `renderContainer`, find:
```js
  styleObj.borderRadius = `${container.settings.borderRadius ?? 0}px`;
  styleObj.overflow = 'visible';
```
Replace with:
```js
  styleObj.borderRadius = `${container.settings.borderRadius ?? 0}px`;
  styleObj.overflow = container.settings.bgVideo ? 'hidden' : 'visible';
  if (container.settings.bgVideo) styleObj.position = 'relative';
```

Then find the return statement at the bottom of `renderContainer`:
```js
  return `<div style="${style}" data-element-id="${container.id}">
    ${children}
  </div>`;
```
Replace with:
```js
  const containerVideoId = container.settings.bgVideo
    ? extractYouTubeId(container.settings.bgVideo)
    : null;
  const containerVideoBg = containerVideoId
    ? `<iframe src="${buildYouTubeEmbedUrl(containerVideoId)}" style="position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100%;min-width:177.78vh;transform:translate(-50%,-50%);pointer-events:none;border:none;z-index:0" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe>`
    : '';
  const childrenWrapped = containerVideoId
    ? `<div style="position:relative;z-index:1;display:contents">${children}</div>`
    : children;

  return `<div style="${style}" data-element-id="${container.id}">
    ${containerVideoBg}
    ${childrenWrapped}
  </div>`;
```

Note: `display:contents` on the wrapper won't interfere with the container's flex layout since its children become direct flex children of the container div.

- [ ] **Step 3: Commit**

```bash
git add src/services/pageGenerator.js
git commit -m "feat: render YouTube video background for segments and containers"
```

---

### Task 6: Add VIDEO settings UI in ContentSettings.jsx

**Files:**
- Modify: `src/components/SettingsPanel/ContentSettings.jsx`

- [ ] **Step 1: Add VIDEO import**

At the top of `ContentSettings.jsx`, `CONTENT_TYPES` is already imported from `../../store/pageTypes`. No change needed there.

- [ ] **Step 2: Add VIDEO section in the JSX**

After the Image section (after the closing `})}` of `{content.type === CONTENT_TYPES.IMAGE && (...)}`), add:

```jsx
{/* ── Video ── */}
{content.type === CONTENT_TYPES.VIDEO && (
  <div style={{ marginBottom: '16px' }}>
    <label style={labelStyle}>YouTube URL</label>
    <input
      type="text"
      value={content.settings.customOverrides.src || ''}
      onChange={(e) => handleCustomUpdate('src', e.target.value)}
      placeholder="https://www.youtube.com/watch?v=..."
      style={inputStyle}
    />
    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
      Paste a YouTube video URL
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsPanel/ContentSettings.jsx
git commit -m "feat: add YouTube video content element settings UI"
```

---

### Task 7: Add video background UI to SegmentSettings.jsx

**Files:**
- Modify: `src/components/SettingsPanel/SegmentSettings.jsx`

- [ ] **Step 1: Add background video input**

In `SegmentSettings.jsx`, after the background image section (the `<div>` containing `Background Image URL` label, after line ~153), add:

```jsx
<div style={{ marginBottom: '12px' }}>
  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Video URL</label>
  <input
    type="text"
    value={segment.settings.bgVideo || ''}
    onChange={(e) => handleUpdate('bgVideo', e.target.value || null)}
    placeholder="https://www.youtube.com/watch?v=..."
    style={{
      width: '100%',
      padding: '6px',
      backgroundColor: '#374151',
      color: '#f3f4f6',
      border: '1px solid #4b5563',
      borderRadius: '4px',
      fontSize: '12px',
      boxSizing: 'border-box'
    }}
  />
  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
    Plays muted in background. Paste a YouTube URL.
  </div>
</div>
```

Place this block right after the existing "Background Image URL" `<div>` block (after its closing `</div>`, before the conditional `{segment.settings.bgImage && (...)}` block).

- [ ] **Step 2: Commit**

```bash
git add src/components/SettingsPanel/SegmentSettings.jsx
git commit -m "feat: add background video URL input to segment settings"
```

---

### Task 8: Add video background UI to ContainerSettings.jsx

**Files:**
- Modify: `src/components/SettingsPanel/ContainerSettings.jsx`

- [ ] **Step 1: Read ContainerSettings.jsx to find the right location**

Read the file to find where the background image URL input is rendered (look for `bgImage` label), then add the video URL input immediately after it using the same pattern as Task 7.

- [ ] **Step 2: Add background video input**

Add this block after the existing "Background Image URL" `<div>`:

```jsx
<div style={{ marginBottom: '12px' }}>
  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Background Video URL</label>
  <input
    type="text"
    value={container.settings.bgVideo || ''}
    onChange={(e) => handleUpdate('bgVideo', e.target.value || null)}
    placeholder="https://www.youtube.com/watch?v=..."
    style={{
      width: '100%',
      padding: '6px',
      backgroundColor: '#374151',
      color: '#f3f4f6',
      border: '1px solid #4b5563',
      borderRadius: '4px',
      fontSize: '12px',
      boxSizing: 'border-box'
    }}
  />
  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
    Plays muted in background. Paste a YouTube URL.
  </div>
</div>
```

Note: in ContainerSettings.jsx the element variable is named `container` (not `segment`), so use `container.settings.bgVideo`.

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsPanel/ContainerSettings.jsx
git commit -m "feat: add background video URL input to container settings"
```

---

### Task 9: Add video icon to TreeNode.jsx

**Files:**
- Modify: `src/components/StructureTree/TreeNode.jsx`

- [ ] **Step 1: Add video icon to getIcon map**

In `TreeNode.jsx`, find:
```js
    const icons = {
      segment: '📦',
      container: '📋',
      text: '📝',
      image: '🖼️',
      button: '🔘',
      card: '🃏'
    };
```
Replace with:
```js
    const icons = {
      segment: '📦',
      container: '📋',
      text: '📝',
      image: '🖼️',
      button: '🔘',
      card: '🃏',
      video: '▶️'
    };
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StructureTree/TreeNode.jsx
git commit -m "feat: add video icon to structure tree node"
```
