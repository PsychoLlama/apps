# Recorder Vision

A free, open-source, client-side web application for screen recording. Built for Windows users who lack a trusted native screen recorder, but usable on any platform with modern browser support.

**Tech Stack:** SolidStart, Vanilla Extract, TypeScript

**Key Principles:**

- Entirely client-side; no server, no accounts, no tracking
- Zero installation; runs in browser with native Web APIs

## Requirements

### P0 — Launch Blockers

#### Recording

- [ ] Record a single source (screen, window, or browser tab) via browser's native `getDisplayMedia` picker
- [ ] Display visual in-browser indicator showing active recording state with elapsed time (format: `HH:MM:SS`)
- [ ] Pause and resume recording
- [ ] Stop recording and auto-save to IndexedDB
- [ ] Output format: WebM (native MediaRecorder output)

#### Library

- [ ] View list of past recordings showing: name, creation date, duration, file size
- [ ] Delete individual recordings
- [ ] Download recording as `.webm` file

#### Error Handling

- [ ] Display clear error state when user denies screen capture permission
- [ ] Display clear error state when IndexedDB storage quota is exceeded
- [ ] Best-effort recovery; do not sacrifice UX for edge-case handling

---

### P1 — Near-Term

#### Audio

- [ ] Capture audio from shared source (tab/window/screen audio) where browser supports
- [ ] Toggle to enable/disable source audio capture

#### Library Enhancements

- [ ] Generate and display thumbnail preview for each recording
- [ ] In-app video playback for recordings
- [ ] Rename recordings
- [ ] Display storage information: total used, available capacity, size per recording

---

### P2 — Future

#### Audio

- [ ] Microphone capture (separate track, or alongside source audio)
- [ ] Audio source selection UI when multiple inputs available

#### Webcam

- [ ] Record webcam as separate artifact within the same recording session
- [ ] Group webcam and screen recordings together by session
- [ ] Download each artifact independently

#### Library Enhancements

- [ ] Search/filter recordings by name
- [ ] Bulk delete (select multiple, delete all)

#### Export

- [ ] MP4 conversion via ffmpeg.wasm (optional download format)

---

## Information Architecture

### Route

Single route: `/studio`. Recording is a UI state, not a separate page — a recording URL has no meaning to someone who didn't start the session.

### States

#### Idle

Default state. The full recording library is displayed below the start button.

**Layout:**

- Large, prominent "Start Recording" button (primary action)
- Storage usage summary (P1; e.g., "2.3 GB used of 5 GB available")
- Full recording library below:
  - Grid or list of all saved recordings
  - Each item shows: thumbnail (P1; placeholder until implemented), name (editable in P1), creation date/time, duration, file size
  - Actions per item: Play (P1), Rename (P1), Download, Delete
  - Search/filter (P2), Bulk select and delete (P2)

#### Recording Active

Minimal UI replaces the idle view. Focus on status and controls.

**Layout:**

- Recording indicator: pulsing red dot + "Recording" label
- Elapsed time display: `HH:MM:SS`, updates every second
- Pause/Resume button (toggle)
- Stop button (ends recording, triggers save)
- No live preview of captured content (browser handles source selection)

**Sub-states:**

- Recording: pulsing indicator, timer running, Pause enabled
- Paused: static indicator, timer paused, Resume enabled, Stop enabled

---

## Visual Design

See [Design System](../design-system.md).

---

## Technical Architecture

### State Management

Use Solid's reactive primitives (`createSignal`, `createStore`) for state management. No external state library needed.

**State tracked:**

- Current recording status (idle, recording, paused) and elapsed time
- Active `MediaRecorder` instance (while recording)
- Recording metadata list (synced with IndexedDB; blobs loaded on demand)
- Storage quota info (P1)

### Data Model

```typescript
interface Recording {
  id: string; // UUID
  name: string; // User-editable, default: "Recording YYYY-MM-DD HH.MM"
  createdAt: number; // epoch ms — Date objects don't round-trip reliably
  duration: number; // seconds
  size: number; // bytes
  mimeType: string; // e.g., "video/webm"
  sessionId?: string; // P2: Groups webcam + screen recordings
}
```

### IndexedDB Schema

**Database name:** `recorder-db`

Blobs are stored separately from metadata so that listing recordings doesn't load video data into memory.

**Object stores:**

- `recordings` — metadata (key path: `id`)
  - Index: `createdAt` (for sorting)
  - Index: `sessionId` (for P2 grouping)
- `blobs` — video data (key path: `id`, matches recording id)
- `thumbnails` — thumbnail images (key path: `id`, matches recording id; P1)

Search (P2) is client-side filtering over the metadata list — IndexedDB indexes don't support substring matching, and the metadata set is small enough to filter in memory.

### Recording Flow

```
User clicks "Start Recording"
    ↓
Call navigator.mediaDevices.getDisplayMedia(constraints)
    ↓
Browser shows native picker (screen/window/tab)
    ↓
On success: Create MediaRecorder, start recording, update state
On failure: Display permission error, return to idle state
    ↓
User clicks "Pause" → MediaRecorder.pause(), update state
User clicks "Resume" → MediaRecorder.resume(), update state
    ↓
User clicks "Stop"
    ↓
MediaRecorder.stop() fires 'dataavailable' event
    ↓
Collect chunks into Blob
    ↓
Generate metadata (duration, size, timestamp)
    ↓
Save to IndexedDB
    ↓
Update recordings list, return to idle state
```

### MediaRecorder Configuration

```typescript
const constraints: DisplayMediaStreamOptions = {
  video: true,
  audio: false, // P1: enable source audio capture
};
```

Select the best supported mimeType via `MediaRecorder.isTypeSupported()`, preferring `video/webm;codecs=vp9`, falling back to VP8, then generic WebM.

### Thumbnail Generation (P1)

```typescript
const generateThumbnail = async (blob: Blob): Promise<Blob> => {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(blob);
  await video.play();
  video.pause();
  video.currentTime = 1; // Capture frame at 1 second

  const canvas = document.createElement('canvas');
  canvas.width = 320; // Thumbnail width
  canvas.height = 180; // 16:9 aspect ratio
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.7);
  });
};
```

### Storage Quota Detection

```typescript
const getStorageInfo = async (): Promise<{
  used: number;
  available: number;
}> => {
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  }
  return { used: 0, available: 0 }; // Fallback: unknown
};
```

---

## Component Structure

```
src/
├── apps/studio/
│   ├── recording/
│   │   ├── StartButton.tsx           # Primary CTA to begin recording
│   │   ├── RecordingControls.tsx     # Pause/Resume/Stop buttons
│   │   ├── RecordingIndicator.tsx    # Pulsing dot + "Recording" + timer
│   │   ├── Timer.tsx                 # HH:MM:SS elapsed time display
│   │   └── useRecording.ts          # Recording logic and state
│   ├── library/
│   │   ├── RecordingList.tsx         # Grid/list of recordings
│   │   ├── RecordingCard.tsx         # Individual recording item
│   │   ├── RecordingPlayer.tsx       # P1: In-app video playback
│   │   ├── StorageInfo.tsx           # Storage usage display
│   │   ├── SearchBar.tsx             # P2: Search/filter input
│   │   ├── useStorage.ts            # IndexedDB operations
│   │   └── useStorageQuota.ts       # Storage quota detection
│   ├── common/
│   │   ├── ErrorBanner.tsx           # Error state display
│   │   └── ConfirmDialog.tsx         # Delete confirmation modal
│   └── layout/
│       └── AppHeader.tsx             # Minimal header/navigation
└── routes/
    └── studio.tsx                    # Single route; idle and recording are UI states
```

---

## Browser Compatibility

Use feature detection — never branch on browser name. If a capability is missing, degrade gracefully.

| Feature                      | Detection                                | Fallback                            |
| ---------------------------- | ---------------------------------------- | ----------------------------------- |
| `getDisplayMedia`            | `navigator.mediaDevices.getDisplayMedia` | Show "Browser not supported"        |
| System audio capture         | Attempt with `audio: true`, catch        | Disable audio toggle, show tooltip  |
| `MediaRecorder` VP9          | `MediaRecorder.isTypeSupported()`        | Fall back to VP8, then generic WebM |
| `navigator.storage.estimate` | `navigator.storage?.estimate`            | Show "Unknown" for storage          |
| IndexedDB                    | `globalThis.indexedDB`                   | Show "Browser not supported"        |

---

## Error States

### Permission Denied

**Trigger:** User clicks cancel on browser's screen picker, or denies permission.

**Display:**

- Return to idle state
- Show dismissible error banner: "Screen capture permission was denied. Click 'Start Recording' to try again."

### Storage Quota Exceeded

**Trigger:** IndexedDB write fails due to quota.

**Display:**

- If during save: Show error banner: "Storage is full. Delete some recordings to free up space."
- Show current storage usage prominently
- Do not lose the recording if possible; offer direct download as fallback

### MediaRecorder Error

**Trigger:** MediaRecorder fires 'error' event during recording.

**Display:**

- Stop recording gracefully
- Attempt to save any captured chunks
- Show error banner: "Recording encountered an error and was stopped."

### Browser Not Supported

**Trigger:** Required APIs not available.

**Display:**

- Replace entire app UI with message: "Your browser doesn't support screen recording. Please try updating your browser or switching to one that supports the required APIs."

---

## Accessibility

- All interactive elements must be keyboard accessible
- Use appropriate ARIA labels for recording state ("Recording in progress", "Recording paused")
- Focus management: return focus to Start button after recording completes
- Respect `prefers-reduced-motion`: disable pulsing animation, use static indicator
- Color is not the only indicator of state; include text labels and icons
- Minimum contrast ratios per WCAG 2.1 AA

---

## Implementation Phases

### Phase 1: Minimal Viable Recorder

Implement all P0 requirements.

**Milestone:** User can record screen, view list of recordings, download, and delete.

**Deliverables:**

1. SolidStart project setup with Vanilla Extract design tokens
2. `/studio` page with Start Recording button and recording library
3. Recording flow with getDisplayMedia
4. Recording state with timer and stop button (pause can be Phase 1 or early Phase 2)
5. IndexedDB storage for recordings
6. Library integrated into `/studio` with list, download, delete
7. Basic error handling (permission denied, storage full)

### Phase 2: Usability Polish

Implement all P1 requirements.

**Milestone:** Recording is pleasant to use repeatedly. Users can preview, rename, and manage storage.

**Deliverables:**

1. Pause/resume functionality (if not in Phase 1)
2. Source audio capture toggle
3. Thumbnail generation
4. In-app video playback
5. Rename recordings
6. Storage usage display with per-recording sizes

### Phase 3: Power Features

Implement P2 requirements based on user feedback.

**Deliverables:**

1. Microphone capture
2. Webcam recording (separate artifact)
3. Search/filter recordings
4. Bulk delete
5. MP4 export (ffmpeg.wasm integration)

---

## File Naming Conventions

- Components: PascalCase (`RecordingCard.tsx`)
- Hooks: camelCase with `use` prefix (`useRecording.ts`)
- Routes: kebab-case (`record.tsx`)
- Utilities: camelCase (`formatDuration.ts`)

## Code Style

- TypeScript strict mode
- Solid functional components
- ESLint + Prettier for formatting
- Explicit typing; avoid `any`

---

## Open Decisions (Defer to Implementation)

1. **Library view format:** Grid vs. list vs. user toggle. Start with grid; revisit if recordings list grows unwieldy.

2. **Thumbnail timing:** Generate on save (blocking but immediate) vs. lazy on first view. Recommend: generate on save for simplicity.

3. **Default recording name:** Use timestamp format: `Recording YYYY-MM-DD HH.MM.SS`

4. **Timer behavior when paused:** Timer pauses (shows recording duration, not wall-clock time).
