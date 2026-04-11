/**
 * Project Persistence — localStorage save/load for project state
 * 
 * Saves: project name, track layout, volumes, zoom, template
 * Does NOT save: File objects, blob URLs (must re-import media)
 */

const STORAGE_KEY = 'komic-freaks-project';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Serialize project state for storage.
 * Strips out non-serializable properties (File, blob URLs).
 */
export function serializeProject(state) {
  return {
    version: 1,
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
        // We store the original filename so user knows which media to re-import
        originalFileName: clip.originalFileName || clip.name,
        // Don't store: url, file (not serializable)
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
 * Load project from localStorage
 */
export function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;

    return data;
  } catch (err) {
    console.error('Failed to load project:', err);
    return null;
  }
}

/**
 * Clear saved project
 */
export function clearSavedProject() {
  localStorage.removeItem(STORAGE_KEY);
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
