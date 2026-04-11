import { useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { formatTime } from '../../utils/helpers';

export default function Preview() {
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastClipIdRef = useRef(null);
  const {
    tracks,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    setCurrentTime,
    setDuration,
    pause,
    volume,
    getTotalDuration,
  } = useEditorStore();

  // Get ordered video clips
  const videoTrack = tracks.find((t) => t.id === 'video');
  const videoClips = videoTrack?.clips
    ?.slice()
    .sort((a, b) => (a.offset || 0) - (b.offset || 0)) || [];
  const hasVideo = videoClips.some((c) => c.url);

  // Find which clip the current timeline time falls in
  const findActiveClip = useCallback(
    (time) => {
      for (const clip of videoClips) {
        const start = clip.offset || 0;
        const end = start + (clip.duration || 0);
        if (time >= start && time < end) {
          return clip;
        }
      }
      return null;
    },
    [videoClips]
  );

  // Map timeline time → source video time
  const getSourceTime = useCallback(
    (clip, timelineTime) => {
      const clipStart = clip.offset || 0;
      const localTime = timelineTime - clipStart;

      // If clip has trimStart, offset into the source
      if (clip.trimStart != null) {
        return clip.trimStart + localTime;
      }
      return localTime;
    },
    []
  );

  // Set video source from first available clip
  useEffect(() => {
    const firstClip = videoClips.find((c) => c.url);
    if (videoRef.current && firstClip) {
      if (videoRef.current.src !== firstClip.url) {
        videoRef.current.src = firstClip.url;
        videoRef.current.onloadedmetadata = () => {
          // Use total timeline duration, not the video file duration
          const totalDur = getTotalDuration();
          setDuration(totalDur);
        };
      }
    }
  }, [videoClips, setDuration, getTotalDuration]);

  // Update total duration when clips change
  useEffect(() => {
    if (hasVideo) {
      const totalDur = getTotalDuration();
      if (totalDur > 0) setDuration(totalDur);
    }
  }, [videoClips.length, hasVideo, getTotalDuration, setDuration]);

  // Play/pause with segment awareness
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      const activeClip = findActiveClip(currentTime);
      if (activeClip) {
        const sourceTime = getSourceTime(activeClip, currentTime);
        video.currentTime = sourceTime;
        lastClipIdRef.current = activeClip.id;
        video.play().catch(() => {});
      }

      // Use requestAnimationFrame to track playback across segments
      const tick = () => {
        if (!video || video.paused) return;

        const state = useEditorStore.getState();
        const ct = state.currentTime;
        const activeClip = findActiveClip(ct);

        if (activeClip) {
          const clipEnd = (activeClip.offset || 0) + (activeClip.duration || 0);
          const sourceEnd = activeClip.trimEnd != null ? activeClip.trimEnd : (activeClip.duration || 0);

          // Check if we've reached the end of this segment in source time
          if (video.currentTime >= sourceEnd - 0.05) {
            // Move to next segment
            const nextClip = findActiveClip(clipEnd + 0.01);
            if (nextClip) {
              const nextSourceTime = getSourceTime(nextClip, clipEnd);
              video.currentTime = nextSourceTime;
              lastClipIdRef.current = nextClip.id;
              setCurrentTime(clipEnd);
            } else {
              // End of all clips
              video.pause();
              useEditorStore.getState().pause();
              return;
            }
          } else {
            // Update timeline time based on how far we are in this clip
            const clipStart = activeClip.offset || 0;
            const trimStart = activeClip.trimStart || 0;
            const localSourceTime = video.currentTime - trimStart;
            const newTimelineTime = clipStart + localSourceTime;
            setCurrentTime(newTimelineTime);
          }
        } else {
          // Between clips or past end
          video.pause();
          useEditorStore.getState().pause();
          return;
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      video.pause();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Seek when currentTime changes externally (keyboard/click)
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      const activeClip = findActiveClip(currentTime);
      if (activeClip) {
        const sourceTime = getSourceTime(activeClip, currentTime);
        const diff = Math.abs(videoRef.current.currentTime - sourceTime);
        if (diff > 0.3) {
          videoRef.current.currentTime = sourceTime;
        }
      }
    }
  }, [currentTime, isPlaying, findActiveClip, getSourceTime]);

  const handleEnded = () => {
    pause();
    setCurrentTime(0);
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 5);
    setCurrentTime(newTime);
    const activeClip = findActiveClip(newTime);
    if (videoRef.current && activeClip) {
      videoRef.current.currentTime = getSourceTime(activeClip, newTime);
    }
  };

  const handleSkipForward = () => {
    const totalDur = getTotalDuration();
    const newTime = Math.min(totalDur, currentTime + 5);
    setCurrentTime(newTime);
    const activeClip = findActiveClip(newTime);
    if (videoRef.current && activeClip) {
      videoRef.current.currentTime = getSourceTime(activeClip, newTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen?.() ||
        videoRef.current.webkitRequestFullscreen?.();
    }
  };

  // Progress bar — use getTotalDuration for the total
  const totalDur = getTotalDuration();
  const progress = totalDur > 0 ? (currentTime / totalDur) * 100 : 0;

  const handleProgressClick = (e) => {
    if (!videoRef.current || !totalDur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * totalDur;
    setCurrentTime(newTime);

    const activeClip = findActiveClip(newTime);
    if (activeClip) {
      videoRef.current.currentTime = getSourceTime(activeClip, newTime);
    }
  };

  return (
    <div className="preview-panel">
      {hasVideo ? (
        <>
          <div className="preview-viewport">
            <video
              ref={videoRef}
              onEnded={handleEnded}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Progress scrubber */}
          <div className="preview-progress" onClick={handleProgressClick}>
            <div className="preview-progress-fill" style={{ width: `${progress}%` }} />
            <div className="preview-progress-thumb" style={{ left: `${progress}%` }} />
          </div>

          <div className="preview-controls">
            <span className="timecode">{formatTime(currentTime)}</span>

            <div className="playback-controls">
              <button className="btn-icon tooltip" data-tooltip="Back 5s (J)" onClick={handleSkipBack}>
                <SkipBack size={16} />
              </button>
              <button className="play-btn" onClick={togglePlay}>
                {isPlaying ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} style={{ marginLeft: 2 }} />
                )}
              </button>
              <button className="btn-icon tooltip" data-tooltip="Forward 5s (L)" onClick={handleSkipForward}>
                <SkipForward size={16} />
              </button>
            </div>

            <span className="timecode">{formatTime(totalDur)}</span>

            <button className="btn-icon tooltip" data-tooltip="Fullscreen" onClick={handleFullscreen}>
              <Maximize size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="preview-empty">
          <div className="preview-empty-icon">
            <Play size={32} style={{ color: 'var(--accent-primary-light)' }} />
          </div>
          <div className="preview-empty-title">No Video Loaded</div>
          <div className="preview-empty-subtitle">
            Import media from the sidebar and add clips to the timeline to start editing
          </div>
        </div>
      )}
    </div>
  );
}
