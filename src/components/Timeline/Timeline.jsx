import { useState, useRef, useCallback } from 'react';
import {
  Film,
  Headphones,
  Mic,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Scissors,
  Trash2,
  Volume2,
  Volume1,
  VolumeX,
  Undo2,
  Redo2,
  Type,
} from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { formatDuration } from '../../utils/helpers';
import AutoCutModal from '../AutoCut/AutoCutPanel';
import { TRANSITION_TYPES } from '../../services/transitionEngine';

const trackIcons = {
  video: Film,
  audio: Headphones,
  narration: Mic,
  sfx: Sparkles,
  captions: Type,
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
    updateClipOnTrack,
    moveClip,
    toggleTrackMute,
    setTrackVolume,
    setCurrentTime,
    getTotalDuration,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore();

  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  const [showAutoCut, setShowAutoCut] = useState(false);
  const [transitionPicker, setTransitionPicker] = useState(null); // { clipId, trackId }
  const timelineBodyRef = useRef(null);

  const hasClips = tracks.some((t) => t.clips.length > 0);
  const totalDuration = getTotalDuration();
  const pixelsPerSecond = 40 * zoomLevel;
  const timelineWidth = Math.max(totalDuration * pixelsPerSecond + 200, 800);
  const trackLabelWidth = 120;

  // Find the first video clip for Auto-Cut
  const videoTrack = tracks.find((t) => t.id === 'video');
  const firstVideoClip = videoTrack?.clips?.[0] || null;

  // --- Drag handlers ---
  const handleClipMouseDown = useCallback(
    (e, clip, trackId) => {
      e.stopPropagation();
      setSelectedClipId(clip.id);

      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;

      setDragState({
        clipId: clip.id,
        trackId,
        startX: e.clientX,
        initialOffset: clip.offset || 0,
        grabOffsetX: offsetX,
      });

      const handleMouseMove = (moveE) => {
        const deltaX = moveE.clientX - e.clientX;
        const deltaTime = deltaX / pixelsPerSecond;
        const newOffset = Math.max(0, (clip.offset || 0) + deltaTime);
        moveClip(trackId, trackId, clip.id, newOffset);
      };

      const handleMouseUp = () => {
        setDragState(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [pixelsPerSecond, setSelectedClipId, moveClip]
  );

  // --- Resize handlers ---
  const handleResizeMouseDown = useCallback(
    (e, clip, trackId, edge) => {
      e.stopPropagation();
      e.preventDefault();

      const handleMouseMove = (moveE) => {
        const deltaX = moveE.clientX - e.clientX;
        const deltaTime = deltaX / pixelsPerSecond;

        if (edge === 'right') {
          const newDuration = Math.max(0.5, (clip.duration || 5) + deltaTime);
          updateClipOnTrack(trackId, clip.id, { duration: newDuration });
        } else if (edge === 'left') {
          const newOffset = Math.max(0, (clip.offset || 0) + deltaTime);
          const durationDelta = newOffset - (clip.offset || 0);
          const newDuration = Math.max(0.5, (clip.duration || 5) - durationDelta);
          updateClipOnTrack(trackId, clip.id, {
            offset: newOffset,
            duration: newDuration,
          });
        }
      };

      const handleMouseUp = () => {
        setResizeState(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      setResizeState({ clipId: clip.id, edge });
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [pixelsPerSecond, updateClipOnTrack]
  );

  // --- Click on timeline to seek ---
  const handleTimelineClick = useCallback(
    (e) => {
      if (!timelineBodyRef.current) return;
      const rect = timelineBodyRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineBodyRef.current.scrollLeft - trackLabelWidth;
      const time = Math.max(0, x / pixelsPerSecond);
      setCurrentTime(time);
    },
    [pixelsPerSecond, setCurrentTime]
  );

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
  for (let i = 0; i <= totalDuration + 10; i += interval) {
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
              {/* Auto-Cut Button */}
              {firstVideoClip && (
                <button
                  className="btn-autocut tooltip"
                  data-tooltip="AI Auto-Cut — remove silence"
                  onClick={() => setShowAutoCut(true)}
                >
                  <Scissors size={13} />
                  <span>Auto-Cut</span>
                  <span className="badge badge-ai" style={{ fontSize: '0.563rem', padding: '1px 4px' }}>AI</span>
                </button>
              )}
              <button
                className="btn-icon tooltip"
                data-tooltip="Undo (⌘Z)"
                onClick={undo}
                disabled={!canUndo()}
              >
                <Undo2 size={14} />
              </button>
              <button
                className="btn-icon tooltip"
                data-tooltip="Redo (⌘⇧Z)"
                onClick={redo}
                disabled={!canRedo()}
              >
                <Redo2 size={14} />
              </button>
              <button
                className="btn-icon tooltip"
                data-tooltip="Delete selected (Del)"
                onClick={handleDeleteClip}
                style={
                  selectedClipId
                    ? { color: 'var(--accent-danger)' }
                    : {}
                }
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
        <div className="timeline-header-right">
          <span style={{ fontSize: '0.688rem', color: 'var(--text-muted)', marginRight: 'var(--space-sm)' }}>
            {formatDuration(totalDuration)}
          </span>
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

      <div
        className="timeline-body"
        ref={timelineBodyRef}
      >
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
            <div
              className="timeline-ruler"
              style={{ width: `${timelineWidth}px` }}
              onClick={handleTimelineClick}
            >
              {rulerMarks.map((time) => (
                <div key={time}>
                  <span
                    className="ruler-mark"
                    style={{ left: `${trackLabelWidth + time * pixelsPerSecond}px` }}
                  >
                    {formatDuration(time)}
                  </span>
                  <div
                    className="ruler-tick major"
                    style={{ left: `${trackLabelWidth + time * pixelsPerSecond}px` }}
                  />
                </div>
              ))}
            </div>

            {/* Tracks */}
            <div
              className="timeline-tracks"
              style={{ width: `${timelineWidth}px` }}
              onClick={handleTimelineClick}
            >
              {/* Playhead */}
              <div
                className="playhead"
                style={{
                  left: `${trackLabelWidth + currentTime * pixelsPerSecond}px`,
                }}
              />

              {tracks.map((track) => {
                const IconComponent = trackIcons[track.type] || Film;
                return (
                  <div key={track.id} className="timeline-track">
                    <div className="track-label">
                      <div className={`track-label-icon ${track.type}`}>
                        <IconComponent size={12} />
                      </div>
                      <span className="track-label-name">
                        {track.label}
                      </span>
                      <div className="track-volume-control">
                        <input
                          type="range"
                          className="track-volume-slider"
                          min="0"
                          max="1"
                          step="0.05"
                          value={track.muted ? 0 : track.volume}
                          onChange={(e) => {
                            e.stopPropagation();
                            const vol = parseFloat(e.target.value);
                            setTrackVolume(track.id, vol);
                            if (vol > 0 && track.muted) toggleTrackMute(track.id);
                          }}
                          title={`Volume: ${Math.round((track.muted ? 0 : track.volume) * 100)}%`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <button
                        className="btn-icon"
                        style={{ width: '20px', height: '20px', flexShrink: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTrackMute(track.id);
                        }}
                        title={track.muted ? 'Unmute' : 'Mute'}
                      >
                        {track.muted ? (
                          <VolumeX size={10} style={{ color: 'var(--accent-danger)' }} />
                        ) : track.volume < 0.5 ? (
                          <Volume1 size={10} />
                        ) : (
                          <Volume2 size={10} />
                        )}
                      </button>
                    </div>
                    <div className="track-content">
                      {track.clips
                        .slice()
                        .sort((a, b) => (a.offset || 0) - (b.offset || 0))
                        .map((clip, clipIdx, sortedClips) => {
                        const left = (clip.offset || 0) * pixelsPerSecond;
                        const width = Math.max(
                          (clip.duration || 5) * pixelsPerSecond,
                          30
                        );
                        const isSelected = selectedClipId === clip.id;
                        const isDragging = dragState?.clipId === clip.id;
                        const isResizing = resizeState?.clipId === clip.id;
                        const isVideoTrack = track.type === 'video';
                        const hasTransition = clip.transition && clip.transition.type !== 'none';
                        const transType = TRANSITION_TYPES.find(
                          (t) => t.id === (clip.transition?.type || 'none')
                        );

                        return (
                          <div
                            key={clip.id}
                            className={`track-clip ${clip.type}-clip ${
                              isSelected ? 'selected' : ''
                            } ${isDragging ? 'dragging' : ''}`}
                            style={{
                              left: `${left}px`,
                              width: `${width}px`,
                              cursor: isDragging ? 'grabbing' : 'grab',
                              opacity: isDragging ? 0.85 : 1,
                              zIndex: isSelected ? 5 : 1,
                            }}
                            onMouseDown={(e) =>
                              handleClipMouseDown(e, clip, track.id)
                            }
                          >
                            {/* Left resize handle */}
                            <div
                              className="clip-resize-handle clip-resize-left"
                              onMouseDown={(e) =>
                                handleResizeMouseDown(e, clip, track.id, 'left')
                              }
                            />

                            {/* Transition badge (video clips only, not first clip) */}
                            {isVideoTrack && clipIdx > 0 && (
                              <button
                                className={`clip-transition-badge ${hasTransition ? 'active' : ''}`}
                                title={hasTransition ? `Transition: ${transType?.name}` : 'Add transition'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTransitionPicker(
                                    transitionPicker?.clipId === clip.id
                                      ? null
                                      : { clipId: clip.id, trackId: track.id }
                                  );
                                }}
                              >
                                {hasTransition ? transType?.icon : '✦'}
                              </button>
                            )}

                            {/* Transition Picker Popup */}
                            {transitionPicker?.clipId === clip.id && (
                              <div
                                className="transition-picker"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="transition-picker-title">Transition</div>
                                <div className="transition-picker-grid">
                                  {TRANSITION_TYPES.map((t) => (
                                    <button
                                      key={t.id}
                                      className={`transition-option ${
                                        (clip.transition?.type || 'none') === t.id ? 'selected' : ''
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateClipOnTrack(track.id, clip.id, {
                                          transition: {
                                            type: t.id,
                                            duration: clip.transition?.duration || 0.5,
                                          },
                                        });
                                        setTransitionPicker(null);
                                      }}
                                    >
                                      <span className="transition-option-icon">{t.icon}</span>
                                      <span className="transition-option-name">{t.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Clip label */}
                            <span className="clip-label">
                              {clip.name}
                            </span>

                            {/* Duration badge */}
                            {width > 60 && (
                              <span className="clip-duration">
                                {formatDuration(clip.duration || 0)}
                              </span>
                            )}

                            {/* Right resize handle */}
                            <div
                              className="clip-resize-handle clip-resize-right"
                              onMouseDown={(e) =>
                                handleResizeMouseDown(e, clip, track.id, 'right')
                              }
                            />
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

      {/* Auto-Cut Modal */}
      {showAutoCut && firstVideoClip && (
        <AutoCutModal
          videoClip={firstVideoClip}
          onClose={() => setShowAutoCut(false)}
        />
      )}
    </div>
  );
}
