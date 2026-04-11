import { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { formatTime } from '../../utils/helpers';

export default function Preview() {
  const videoRef = useRef(null);
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
  } = useEditorStore();

  // Get the first video clip for preview
  const videoTrack = tracks.find((t) => t.id === 'video');
  const firstVideoClip = videoTrack?.clips.find((c) => c.url);

  useEffect(() => {
    if (videoRef.current && firstVideoClip) {
      if (videoRef.current.src !== firstVideoClip.url) {
        videoRef.current.src = firstVideoClip.url;
        videoRef.current.onloadedmetadata = () => {
          setDuration(videoRef.current.duration);
        };
      }
    }
  }, [firstVideoClip, setDuration]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Seek when currentTime changes externally (keyboard/click)
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      const diff = Math.abs(videoRef.current.currentTime - currentTime);
      if (diff > 0.5) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    pause();
    setCurrentTime(0);
  };

  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration || 0,
        videoRef.current.currentTime + 5
      );
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen?.() ||
        videoRef.current.webkitRequestFullscreen?.();
    }
  };

  // Progress bar
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const hasVideo = videoTrack?.clips.some((c) => c.url);

  return (
    <div className="preview-panel">
      {hasVideo ? (
        <>
          <div className="preview-viewport">
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
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

            <span className="timecode">{formatTime(duration)}</span>

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
