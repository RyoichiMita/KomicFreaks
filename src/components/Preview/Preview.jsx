import { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
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
    activeTab,
  } = useEditorStore();

  // Get the first video clip for preview
  const videoTrack = tracks.find((t) => t.id === 'video');
  const firstVideoClip = videoTrack?.clips[0];

  useEffect(() => {
    if (videoRef.current && firstVideoClip) {
      videoRef.current.src = firstVideoClip.url;
      videoRef.current.onloadedmetadata = () => {
        setDuration(videoRef.current.duration);
      };
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 5
      );
    }
  };

  const hasVideo = videoTrack?.clips.length > 0;

  return (
    <div className="preview-panel">
      {hasVideo ? (
        <>
          <div className="preview-viewport">
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div className="preview-controls">
            <span className="timecode">{formatTime(currentTime)}</span>

            <div className="playback-controls">
              <button className="btn-icon" onClick={handleSkipBack}>
                <SkipBack size={16} />
              </button>
              <button className="play-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
              </button>
              <button className="btn-icon" onClick={handleSkipForward}>
                <SkipForward size={16} />
              </button>
            </div>

            <span className="timecode">{formatTime(duration)}</span>

            <button className="btn-icon">
              <Volume2 size={16} />
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
