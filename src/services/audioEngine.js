/**
 * AudioEngine — manages playback of all non-video audio tracks
 * (music, narration, SFX) in sync with the video timeline.
 *
 * Features:
 * - Per-track volume + mute
 * - Audio Ducking: auto-lowers music/audio/sfx when narration is playing
 */

class AudioEngine {
  constructor() {
    /** @type {Map<string, HTMLAudioElement>} clipId → Audio element */
    this.audioElements = new Map();
    this.isRunning = false;
    this._rafId = null;
  }

  /**
   * Ensure an Audio element exists for a clip.
   */
  _getOrCreateAudio(clip) {
    const existing = this.audioElements.get(clip.id);
    if (existing && existing._srcUrl === clip.url) {
      return existing;
    }

    if (existing) {
      existing.pause();
      existing.src = '';
    }

    if (!clip.url) return null;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = clip.url;
    audio._srcUrl = clip.url;
    audio.loop = !!clip.loop;
    this.audioElements.set(clip.id, audio);
    return audio;
  }

  /**
   * Check if narration is playing at a given time.
   */
  _isNarrationActive(tracks, currentTime) {
    const narrationTrack = tracks.find((t) => t.type === 'narration');
    if (!narrationTrack || narrationTrack.muted || narrationTrack.clips.length === 0) {
      return false;
    }

    return narrationTrack.clips.some((clip) => {
      const start = clip.offset || 0;
      const end = start + (clip.duration || 0);
      return currentTime >= start && currentTime < end;
    });
  }

  /**
   * Get the effective volume for a track, applying ducking if active.
   */
  _getEffectiveVolume(track, duckingEnabled, duckingLevel, narrationActive) {
    if (track.muted) return 0;

    let vol = track.volume;

    // Apply ducking: lower non-narration audio tracks when narration is playing
    if (duckingEnabled && narrationActive && track.type !== 'narration' && track.type !== 'captions') {
      vol *= duckingLevel;
    }

    return vol;
  }

  /**
   * Sync all audio tracks to the current timeline position.
   */
  syncToTime(tracks, currentTime, duckingEnabled = true, duckingLevel = 0.2) {
    const audioTracks = tracks.filter((t) => t.type !== 'video');
    const activeClipIds = new Set();
    const narrationActive = this._isNarrationActive(tracks, currentTime);

    for (const track of audioTracks) {
      for (const clip of track.clips) {
        activeClipIds.add(clip.id);

        if (!clip.url) continue;

        const clipStart = clip.offset || 0;
        const clipEnd = clipStart + (clip.duration || 0);
        const audio = this._getOrCreateAudio(clip);
        if (!audio) continue;

        // Apply effective volume (with ducking)
        audio.volume = this._getEffectiveVolume(track, duckingEnabled, duckingLevel, narrationActive);

        if (currentTime >= clipStart && currentTime < clipEnd) {
          const localTime = currentTime - clipStart;

          if (clip.loop && audio.duration > 0) {
            audio.currentTime = localTime % audio.duration;
          } else {
            if (Math.abs(audio.currentTime - localTime) > 0.3) {
              audio.currentTime = Math.min(localTime, audio.duration || localTime);
            }
          }

          if (this.isRunning && audio.paused) {
            audio.play().catch(() => {});
          }
        } else {
          if (!audio.paused) {
            audio.pause();
          }
        }
      }
    }

    // Cleanup elements for clips that no longer exist
    for (const [clipId, audio] of this.audioElements) {
      if (!activeClipIds.has(clipId)) {
        audio.pause();
        audio.src = '';
        this.audioElements.delete(clipId);
      }
    }
  }

  /**
   * Start playback with animation frame sync loop.
   */
  start(getState) {
    this.isRunning = true;
    const state = getState();
    this.syncToTime(state.tracks, state.currentTime, state.duckingEnabled, state.duckingLevel);

    const tick = () => {
      if (!this.isRunning) return;

      const state = getState();
      const audioTracks = state.tracks.filter((t) => t.type !== 'video');
      const narrationActive = this._isNarrationActive(state.tracks, state.currentTime);

      for (const track of audioTracks) {
        for (const clip of track.clips) {
          if (!clip.url) continue;

          const clipStart = clip.offset || 0;
          const clipEnd = clipStart + (clip.duration || 0);
          const audio = this.audioElements.get(clip.id);
          if (!audio) continue;

          // Apply effective volume with ducking in real-time
          audio.volume = this._getEffectiveVolume(
            track, state.duckingEnabled, state.duckingLevel, narrationActive
          );

          const ct = state.currentTime;

          if (ct >= clipStart && ct < clipEnd) {
            if (audio.paused) {
              const localTime = ct - clipStart;
              if (clip.loop && audio.duration > 0) {
                audio.currentTime = localTime % audio.duration;
              } else {
                audio.currentTime = Math.min(localTime, audio.duration || localTime);
              }
              audio.play().catch(() => {});
            }
          } else {
            if (!audio.paused) {
              audio.pause();
            }
          }
        }
      }

      this._rafId = requestAnimationFrame(tick);
    };

    this._rafId = requestAnimationFrame(tick);
  }

  /**
   * Pause all audio playback.
   */
  pause() {
    this.isRunning = false;

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    for (const [, audio] of this.audioElements) {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }

  /**
   * Stop and cleanup all audio elements.
   */
  destroy() {
    this.pause();

    for (const [, audio] of this.audioElements) {
      audio.src = '';
    }
    this.audioElements.clear();
  }

  /**
   * Update a specific track's volume.
   */
  updateTrackVolume(trackId, volume, muted, tracks) {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    for (const clip of track.clips) {
      const audio = this.audioElements.get(clip.id);
      if (audio) {
        audio.volume = muted ? 0 : volume;
      }
    }
  }
}

// Singleton instance
const audioEngine = new AudioEngine();
export default audioEngine;
