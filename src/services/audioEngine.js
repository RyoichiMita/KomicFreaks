/**
 * AudioEngine — manages playback of all non-video audio tracks
 * (music, narration, SFX) in sync with the video timeline.
 *
 * Each audio clip gets an HTMLAudioElement that is started/stopped/seeked
 * in sync with the video playback. Track volume and mute states from the
 * store are applied in real-time.
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
   * Reuses existing elements if the URL hasn't changed.
   */
  _getOrCreateAudio(clip) {
    const existing = this.audioElements.get(clip.id);
    if (existing && existing._srcUrl === clip.url) {
      return existing;
    }

    // Cleanup old element if URL changed
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
   * Sync all audio tracks to the current timeline position.
   * Called once when playback starts and on seek.
   */
  syncToTime(tracks, currentTime) {
    // Get all audio-type tracks (audio, narration, sfx)
    const audioTracks = tracks.filter((t) => t.type !== 'video');

    // Collect all active clip IDs to know which to keep
    const activeClipIds = new Set();

    for (const track of audioTracks) {
      for (const clip of track.clips) {
        activeClipIds.add(clip.id);

        if (!clip.url) continue;

        const clipStart = clip.offset || 0;
        const clipEnd = clipStart + (clip.duration || 0);
        const audio = this._getOrCreateAudio(clip);
        if (!audio) continue;

        // Apply track volume and mute
        audio.volume = track.muted ? 0 : track.volume;

        // Is this clip currently active (timeline position falls within it)?
        if (currentTime >= clipStart && currentTime < clipEnd) {
          const localTime = currentTime - clipStart;

          // For looping clips, wrap around
          if (clip.loop && audio.duration > 0) {
            audio.currentTime = localTime % audio.duration;
          } else {
            // Only seek if significantly different
            if (Math.abs(audio.currentTime - localTime) > 0.3) {
              audio.currentTime = Math.min(localTime, audio.duration || localTime);
            }
          }

          if (this.isRunning && audio.paused) {
            audio.play().catch(() => {});
          }
        } else {
          // Clip is not active — pause it
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
   * Start playback. Begins the animation frame loop that keeps
   * audio clips in sync with the video timeline.
   */
  start(getState) {
    this.isRunning = true;
    const state = getState();
    this.syncToTime(state.tracks, state.currentTime);

    // Tick loop: re-sync audio clips as the timeline progresses
    const tick = () => {
      if (!this.isRunning) return;

      const state = getState();
      const audioTracks = state.tracks.filter((t) => t.type !== 'video');

      for (const track of audioTracks) {
        for (const clip of track.clips) {
          if (!clip.url) continue;

          const clipStart = clip.offset || 0;
          const clipEnd = clipStart + (clip.duration || 0);
          const audio = this.audioElements.get(clip.id);
          if (!audio) continue;

          // Update volume in real-time (user may adjust mid-playback)
          audio.volume = track.muted ? 0 : track.volume;

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
   * Update a specific track's volume (called when user drags a slider).
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
