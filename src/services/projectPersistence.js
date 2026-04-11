/**
 * Project Persistence — localStorage + IndexedDB save/load for project state
 * 
 * localStorage: project metadata, track layout, volumes, clip positions
 * IndexedDB: media file blobs (videos, audio, images)
 * 
 * Together they enable full project resume with media re-hydration.
 */

import { storeMediaBlob, getAllMediaBlobs, clearAllMediaBlobs } from './indexedDB';

const STORAGE_KEY = 'komic-freaks-project';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Serialize project state for localStorage.
 * Strips out non-serializable properties (File, blob URLs).
 * Now includes caption styles, transitions, and blob keys.
 */
export function serializeProject(state) {
  return {
    version: 2,
    savedAt: Date.now(),
    projectName: state.projectName,
    tracks: state.tracks.map((track) => ({
      id: track.id,
      label: track.label,
      type: track.type,
      muted: track.muted,
      volume: track.volume,
      clips: track.clips.map((clip) => ({
        id: clip.id,
        name: clip.name,
        type: clip.type,
        duration: clip.duration,
        offset: clip.offset,
        trimStart: clip.trimStart,
        trimEnd: clip.trimEnd,
        originalFileName: clip.originalFileName || clip.name,
        // Caption-specific data
        text: clip.text,
        style: clip.style,
        position: clip.position,
        alignment: clip.alignment,
        presetId: clip.presetId,
        // Transition data
        transition: clip.transition,
        // IndexedDB blob reference key
        blobKey: clip.blobKey || clip.id,
        // Flag: does this clip have a persisted blob?
        hasBlobData: !!clip.url,
      })),
    })),
    zoomLevel: state.zoomLevel,
    activeTemplate: state.activeTemplate,
    narrationScript: state.narrationScript,
    selectedVoice: state.selectedVoice,
  };
}

/**
 * Save project to localStorage
 */
export function saveProject(state) {
  try {
    const data = serializeProject(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true, savedAt: data.savedAt };
  } catch (err) {
    console.error('Failed to save project:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save media blobs to IndexedDB for all clips that have URLs.
 * Called during manual save operations.
 */
export async function saveMediaBlobs(tracks) {
  let savedCount = 0;

  for (const track of tracks) {
    for (const clip of track.clips) {
      if (clip.url && clip.type !== 'caption') {
        try {
          const response = await fetch(clip.url);
          const blob = await response.blob();
          const key = clip.blobKey || clip.id;
          await storeMediaBlob(key, blob, clip.originalFileName || clip.name, blob.type);
          savedCount++;
        } catch (err) {
          console.warn(`Failed to persist blob for clip: ${clip.name}`, err);
        }
      }
    }
  }

  return savedCount;
}

/**
 * Load project from localStorage
 */
export function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || (data.version !== 1 && data.version !== 2)) return null;

    return data;
  } catch (err) {
    console.error('Failed to load project:', err);
    return null;
  }
}

/**
 * Restore media blobs from IndexedDB and re-create blob URLs on clips.
 * Returns tracks with blob URLs restored.
 */
export async function restoreMediaBlobs(tracks) {
  try {
    const blobs = await getAllMediaBlobs();
    const blobMap = new Map(blobs.map((b) => [b.id, b]));

    return tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.type === 'caption') return clip; // captions don't have blobs

        const key = clip.blobKey || clip.id;
        const stored = blobMap.get(key);

        if (stored) {
          return {
            ...clip,
            url: URL.createObjectURL(stored.blob),
            file: new File([stored.blob], stored.name, { type: stored.type }),
          };
        }

        return clip; // No blob found — clip will show as missing
      }),
    }));
  } catch (err) {
    console.error('Failed to restore media blobs:', err);
    return tracks;
  }
}

/**
 * Clear saved project (localStorage + IndexedDB)
 */
export async function clearSavedProject() {
  localStorage.removeItem(STORAGE_KEY);
  await clearAllMediaBlobs();
}

/**
 * Check if there's a saved project
 */
export function hasSavedProject() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get saved project metadata without full parse
 */
export function getSavedProjectInfo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    const clipCount = data.tracks?.reduce((sum, t) => sum + (t.clips?.length || 0), 0) || 0;
    const savedDate = new Date(data.savedAt);

    return {
      projectName: data.projectName,
      savedAt: data.savedAt,
      savedAtFormatted: savedDate.toLocaleString(),
      clipCount,
      version: data.version || 1,
    };
  } catch {
    return null;
  }
}

/**
 * Start auto-save interval. Returns cleanup function.
 */
export function startAutoSave(getState) {
  const timer = setInterval(() => {
    const state = getState();
    // Only auto-save if there are clips on the timeline
    const hasClips = state.tracks.some((t) => t.clips.length > 0);
    if (hasClips) {
      saveProject(state);
    }
  }, AUTO_SAVE_INTERVAL);

  return () => clearInterval(timer);
}
