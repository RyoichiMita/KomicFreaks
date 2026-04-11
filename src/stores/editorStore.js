import { create } from 'zustand';
import { saveProject as persistSave, loadProject, startAutoSave } from '../services/projectPersistence';
import { createHistoryManager } from '../services/history';

// Generate unique IDs
let idCounter = 0;
const generateId = () => `clip_${Date.now()}_${++idCounter}`;

// History manager instance (lives outside the store)
const history = createHistoryManager();

const useEditorStore = create((set, get) => ({
  // --- View State ---
  activeTab: 'welcome', // 'welcome' | 'editor' | 'narration' | 'sounds' | 'thumbnail' | 'captions' | 'templates'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // --- Project ---
  projectName: 'Untitled Project',
  setProjectName: (name) => set({ projectName: name }),
  lastSavedAt: null,

  // --- Media Library ---
  mediaFiles: [],
  addMediaFile: (file) => {
    const mediaItem = {
      id: generateId(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      url: URL.createObjectURL(file),
      duration: 0,
      addedAt: Date.now(),
    };
    set((state) => ({ mediaFiles: [...state.mediaFiles, mediaItem] }));
    return mediaItem;
  },
  removeMediaFile: (id) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.filter((f) => f.id !== id),
    })),
  updateMediaDuration: (id, duration) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.map((f) =>
        f.id === id ? { ...f, duration } : f
      ),
    })),

  // --- Timeline ---
  tracks: [
    { id: 'video', label: 'Video', type: 'video', clips: [], muted: false, volume: 1 },
    { id: 'audio', label: 'Audio', type: 'audio', clips: [], muted: false, volume: 1 },
    { id: 'narration', label: 'AI Narration', type: 'narration', clips: [], muted: false, volume: 1 },
    { id: 'sfx', label: 'Sound FX', type: 'sfx', clips: [], muted: false, volume: 0.8 },
  ],

  addClipToTrack: (trackId, clip) => {
    const state = get();
    history.push(state.tracks);
    const track = state.tracks.find((t) => t.id === trackId);

    // Auto-calculate offset: place after last clip on this track
    let offset = clip.offset || 0;
    if (track && track.clips.length > 0 && offset === 0) {
      const lastClip = track.clips[track.clips.length - 1];
      offset = (lastClip.offset || 0) + (lastClip.duration || 5);
    }

    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              clips: [
                ...track.clips,
                { ...clip, id: generateId(), offset },
              ],
            }
          : track
      ),
    }));
  },

  removeClipFromTrack: (trackId, clipId) => {
    history.push(get().tracks);
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, clips: track.clips.filter((c) => c.id !== clipId) }
          : track
      ),
    }));
  },

  updateClipOnTrack: (trackId, clipId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              clips: track.clips.map((c) =>
                c.id === clipId ? { ...c, ...updates } : c
              ),
            }
          : track
      ),
    }));
  },

  moveClip: (fromTrackId, toTrackId, clipId, newOffset) => {
    const state = get();
    history.push(state.tracks);
    const fromTrack = state.tracks.find((t) => t.id === fromTrackId);
    const clip = fromTrack?.clips.find((c) => c.id === clipId);

    if (!clip) return;

    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id === fromTrackId && fromTrackId !== toTrackId) {
          return { ...track, clips: track.clips.filter((c) => c.id !== clipId) };
        }
        if (track.id === toTrackId) {
          if (fromTrackId === toTrackId) {
            return {
              ...track,
              clips: track.clips.map((c) =>
                c.id === clipId ? { ...c, offset: Math.max(0, newOffset) } : c
              ),
            };
          }
          return {
            ...track,
            clips: [...track.clips, { ...clip, offset: Math.max(0, newOffset) }],
          };
        }
        return track;
      }),
    }));
  },

  toggleTrackMute: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      ),
    }));
  },

  setTrackVolume: (trackId, volume) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, volume } : track
      ),
    }));
  },

  clearAllTracks: () => {
    history.push(get().tracks);
    set((state) => ({
      tracks: state.tracks.map((track) => ({ ...track, clips: [] })),
      selectedClipId: null,
    }));
  },

  replaceTrackClips: (trackId, newClips) => {
    history.push(get().tracks);
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              clips: newClips.map((clip, i) => ({
                ...clip,
                id: generateId(),
              })),
            }
          : track
      ),
    }));
  },

  selectedClipId: null,
  setSelectedClipId: (id) => set({ selectedClipId: id }),

  // Get selected clip details
  getSelectedClip: () => {
    const state = get();
    if (!state.selectedClipId) return null;
    for (const track of state.tracks) {
      const clip = track.clips.find((c) => c.id === state.selectedClipId);
      if (clip) return { clip, trackId: track.id, trackType: track.type };
    }
    return null;
  },

  // --- Playback ---
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  // Compute total timeline duration from all clips
  getTotalDuration: () => {
    const state = get();
    let maxEnd = 0;
    state.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const end = (clip.offset || 0) + (clip.duration || 0);
        if (end > maxEnd) maxEnd = end;
      });
    });
    return maxEnd || 30;
  },

  // --- Zoom ---
  zoomLevel: 1,
  setZoomLevel: (level) => set({ zoomLevel: level }),

  // --- Narration ---
  narrationScript: '',
  setNarrationScript: (script) => set({ narrationScript: script }),
  selectedVoice: 'narrator',
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  isGeneratingNarration: false,
  setIsGeneratingNarration: (val) => set({ isGeneratingNarration: val }),

  // --- Export ---
  isExporting: false,
  exportProgress: 0,
  exportStatus: '',
  setIsExporting: (val) => set({ isExporting: val }),
  setExportProgress: (val) => set({ exportProgress: val }),
  setExportStatus: (val) => set({ exportStatus: val }),

  // --- FFmpeg ---
  ffmpegLoaded: false,
  ffmpegLoading: false,
  setFFmpegLoaded: (val) => set({ ffmpegLoaded: val }),
  setFFmpegLoading: (val) => set({ ffmpegLoading: val }),

  // --- Undo/Redo ---
  undo: () => {
    const prev = history.undo(get().tracks);
    if (prev) {
      set({ tracks: prev });
      get().showNotification('Undo', 'info');
    }
  },

  redo: () => {
    const next = history.redo(get().tracks);
    if (next) {
      set({ tracks: next });
      get().showNotification('Redo', 'info');
    }
  },

  canUndo: () => history.canUndo(),
  canRedo: () => history.canRedo(),

  // --- Active Template ---
  activeTemplate: null,
  setActiveTemplate: (template) => set({ activeTemplate: template }),

  // --- Project Persistence ---
  saveProject: () => {
    const state = get();
    const result = persistSave(state);
    if (result.success) {
      set({ lastSavedAt: result.savedAt });
    }
    return result;
  },

  loadSavedProject: () => {
    const saved = loadProject();
    if (!saved) return false;

    set({
      projectName: saved.projectName || 'Untitled Project',
      tracks: saved.tracks.map((savedTrack) => {
        const defaultTrack = get().tracks.find((t) => t.id === savedTrack.id);
        return {
          ...defaultTrack,
          ...savedTrack,
          // Clips from saved state won't have url/file — mark them as needing re-import
          clips: savedTrack.clips.map((clip) => ({
            ...clip,
            needsReimport: !clip.url,
          })),
        };
      }),
      zoomLevel: saved.zoomLevel || 1,
      narrationScript: saved.narrationScript || '',
      selectedVoice: saved.selectedVoice || 'narrator',
      activeTemplate: saved.activeTemplate || null,
      lastSavedAt: saved.savedAt,
    });
    return true;
  },

  initAutoSave: () => {
    return startAutoSave(get);
  },

  // --- Snackbar / Notifications ---
  notification: null,
  showNotification: (message, type = 'info') => {
    const id = Date.now();
    set({ notification: { message, type, id } });
    setTimeout(() => {
      set((state) => {
        if (state.notification?.id === id) {
          return { notification: null };
        }
        return {};
      });
    }, 3000);
  },
}));

export default useEditorStore;
