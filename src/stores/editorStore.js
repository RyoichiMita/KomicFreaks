import { create } from 'zustand';

// Generate unique IDs
let idCounter = 0;
const generateId = () => `clip_${Date.now()}_${++idCounter}`;

const useEditorStore = create((set, get) => ({
  // --- View State ---
  activeTab: 'welcome', // 'welcome' | 'editor' | 'narration' | 'sounds' | 'thumbnail' | 'captions' | 'templates'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // --- Project ---
  projectName: 'Untitled Project',
  setProjectName: (name) => set({ projectName: name }),

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

  // --- Timeline ---
  tracks: [
    { id: 'video', label: 'Video', type: 'video', clips: [] },
    { id: 'audio', label: 'Audio', type: 'audio', clips: [] },
    { id: 'narration', label: 'AI Narration', type: 'narration', clips: [] },
    { id: 'sfx', label: 'Sound FX', type: 'sfx', clips: [] },
  ],

  addClipToTrack: (trackId, clip) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, { ...clip, id: generateId() }] }
          : track
      ),
    }));
  },

  removeClipFromTrack: (trackId, clipId) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, clips: track.clips.filter((c) => c.id !== clipId) }
          : track
      ),
    }));
  },

  selectedClipId: null,
  setSelectedClipId: (id) => set({ selectedClipId: id }),

  // --- Playback ---
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),

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
  setIsExporting: (val) => set({ isExporting: val }),
  setExportProgress: (val) => set({ exportProgress: val }),

  // --- Active Template ---
  activeTemplate: null,
  setActiveTemplate: (template) => set({ activeTemplate: template }),
}));

export default useEditorStore;
