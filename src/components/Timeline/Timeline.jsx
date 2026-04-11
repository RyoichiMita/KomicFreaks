import { Film, Headphones, Mic, Sparkles, ZoomIn, ZoomOut, Scissors, Trash2 } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { formatDuration } from '../../utils/helpers';

const trackIcons = {
  video: Film,
  audio: Headphones,
  narration: Mic,
  sfx: Sparkles,
};

export default function Timeline() {
  const {
    tracks,
    currentTime,
    duration,
    zoomLevel,
    setZoomLevel,
    selectedClipId,
    setSelectedClipId,
    removeClipFromTrack,
  } = useEditorStore();

  const hasClips = tracks.some((t) => t.clips.length > 0);
  const totalDuration = Math.max(duration, 30); // Minimum 30s timeline
  const timelineWidth = totalDuration * 40 * zoomLevel; // pixels

  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    tracks.forEach((track) => {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip) {
        removeClipFromTrack(track.id, selectedClipId);
        setSelectedClipId(null);
      }
    });
  };

  // Generate ruler marks
  const rulerMarks = [];
  const interval = zoomLevel >= 2 ? 1 : zoomLevel >= 1 ? 2 : 5;
  for (let i = 0; i <= totalDuration; i += interval) {
    rulerMarks.push(i);
  }

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <div className="timeline-header-left">
          <div className="timeline-label">
            <Film size={14} />
            Timeline
          </div>
          {hasClips && (
            <>
              <button
                className="btn-icon tooltip"
                data-tooltip="Split clip"
                onClick={() => {}}
              >
                <Scissors size={14} />
              </button>
              <button
                className="btn-icon tooltip"
                data-tooltip="Delete selected"
                onClick={handleDeleteClip}
                style={selectedClipId ? { color: 'var(--accent-danger)' } : {}}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
        <div className="timeline-header-right">
          <div className="zoom-control">
            <button
              className="btn-icon"
              onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))}
            >
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              className="zoom-slider"
              min="0.25"
              max="4"
              step="0.25"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            />
            <button
              className="btn-icon"
              onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.25))}
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-body">
        {!hasClips ? (
          <div className="timeline-empty">
            <div className="timeline-empty-text">
              Your timeline is empty
            </div>
            <div className="timeline-empty-hint">
              Import media and click a file to add it here, or use a template to get started
            </div>
          </div>
        ) : (
          <>
            {/* Ruler */}
            <div className="timeline-ruler" style={{ width: `${timelineWidth + 116}px` }}>
              {rulerMarks.map((time) => (
                <div key={time}>
                  <span
                    className="ruler-mark"
                    style={{ left: `${100 + time * 40 * zoomLevel}px` }}
                  >
                    {formatDuration(time)}
                  </span>
                  <div
                    className="ruler-tick major"
                    style={{ left: `${100 + time * 40 * zoomLevel}px` }}
                  />
                </div>
              ))}
            </div>

            {/* Tracks */}
            <div className="timeline-tracks" style={{ width: `${timelineWidth + 116}px` }}>
              {/* Playhead */}
              <div
                className="playhead"
                style={{ left: `${100 + currentTime * 40 * zoomLevel}px` }}
              />

              {tracks.map((track) => {
                const IconComponent = trackIcons[track.type] || Film;
                return (
                  <div key={track.id} className="timeline-track">
                    <div className="track-label">
                      <div className={`track-label-icon ${track.type}`}>
                        <IconComponent size={12} />
                      </div>
                      {track.label}
                    </div>
                    <div className="track-content">
                      {track.clips.map((clip) => {
                        const left = (clip.offset || 0) * 40 * zoomLevel;
                        const width = Math.max(clip.duration * 40 * zoomLevel, 40);
                        return (
                          <div
                            key={clip.id}
                            className={`track-clip ${clip.type}-clip ${
                              selectedClipId === clip.id ? 'selected' : ''
                            }`}
                            style={{ left: `${left}px`, width: `${width}px` }}
                            onClick={() => setSelectedClipId(clip.id)}
                          >
                            {clip.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
