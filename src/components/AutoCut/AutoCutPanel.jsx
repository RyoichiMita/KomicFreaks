import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Scissors,
  Sparkles,
  Play,
  Pause,
  X,
  Zap,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';
import { analyzeAudio } from '../../services/autocut';
import { formatDuration } from '../../utils/helpers';
import useEditorStore from '../../stores/editorStore';

const PRESETS = [
  {
    id: 'tight',
    name: 'Tight Cuts',
    desc: 'Remove all pauses — fast-paced energy',
    icon: '⚡',
    settings: { silenceThreshold: 0.02, minSilenceDuration: 0.25, padding: 0.03 },
  },
  {
    id: 'natural',
    name: 'Natural Flow',
    desc: 'Keep short breaths — feels organic',
    icon: '🎤',
    settings: { silenceThreshold: 0.015, minSilenceDuration: 0.5, padding: 0.08 },
  },
  {
    id: 'chill',
    name: 'Chill Review',
    desc: 'Only remove long dead air',
    icon: '😎',
    settings: { silenceThreshold: 0.01, minSilenceDuration: 1.0, padding: 0.12 },
  },
];

export default function AutoCutModal({ onClose, videoClip }) {
  const { replaceTrackClips, showNotification } = useEditorStore();

  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('natural');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSettings, setCustomSettings] = useState(PRESETS[1].settings);
  const [playingSegment, setPlayingSegment] = useState(null);
  const [expandedView, setExpandedView] = useState(false);

  const videoRef = useRef(null);
  const playTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, []);

  // Auto-analyze on mount
  useEffect(() => {
    if (videoClip?.file || videoClip?.url) {
      handleAnalyze();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getFileForAnalysis = useCallback(async () => {
    // If we have the original File object, use it
    if (videoClip.file) return videoClip.file;

    // Otherwise fetch from blob URL
    if (videoClip.url) {
      const response = await fetch(videoClip.url);
      const blob = await response.blob();
      return new File([blob], videoClip.name || 'video.mp4', { type: 'video/mp4' });
    }

    throw new Error('No video file available');
  }, [videoClip]);

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setProgress(0);
    setResult(null);

    try {
      const file = await getFileForAnalysis();
      const preset = PRESETS.find((p) => p.id === selectedPreset);
      const settings = showAdvanced ? customSettings : preset?.settings || PRESETS[1].settings;

      const analysisResult = await analyzeAudio(file, settings, (p) => setProgress(p));
      setResult(analysisResult);
    } catch (err) {
      console.error('Analysis failed:', err);
      showNotification('Analysis failed — make sure the video has audio', 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [getFileForAnalysis, selectedPreset, showAdvanced, customSettings, showNotification]);

  const toggleSegment = useCallback((segId) => {
    if (!result) return;
    setResult((prev) => ({
      ...prev,
      segments: prev.segments.map((s) =>
        s.id === segId ? { ...s, keep: !s.keep } : s
      ),
    }));
  }, [result]);

  const playSegment = useCallback((segment) => {
    if (!videoRef.current || !videoClip?.url) return;

    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);

    videoRef.current.currentTime = segment.start;
    videoRef.current.play();
    setPlayingSegment(segment.id);

    const dur = (segment.end - segment.start) * 1000;
    playTimeoutRef.current = setTimeout(() => {
      videoRef.current?.pause();
      setPlayingSegment(null);
    }, dur);
  }, [videoClip]);

  const handleApply = useCallback(() => {
    if (!result) return;

    const keptSegments = result.segments.filter((s) => s.keep);
    if (keptSegments.length === 0) {
      showNotification('No segments selected to keep!', 'error');
      return;
    }

    // Build new clips from kept segments
    const newClips = keptSegments.map((seg, i) => ({
      name: `${videoClip.name || 'Clip'} #${i + 1}`,
      type: 'video',
      url: videoClip.url,
      file: videoClip.file,
      duration: seg.duration,
      offset: 0,
      trimStart: seg.start,
      trimEnd: seg.end,
    }));

    // Calculate running offset
    let runningOffset = 0;
    for (const clip of newClips) {
      clip.offset = runningOffset;
      runningOffset += clip.duration;
    }

    // Calculate stats inline
    const totalKept = keptSegments.reduce((sum, s) => sum + s.duration, 0);
    const timeSaved = result.duration - totalKept;

    replaceTrackClips('video', newClips);
    showNotification(
      `Auto-cut complete: ${keptSegments.length} segments, saved ${formatDuration(timeSaved)}`,
      'success'
    );
    onClose();
  }, [result, videoClip, replaceTrackClips, showNotification, onClose]);

  // Calculate live stats
  const liveStats = result
    ? (() => {
        const kept = result.segments.filter((s) => s.keep);
        const totalKept = kept.reduce((sum, s) => sum + s.duration, 0);
        return {
          outputDuration: Math.round(totalKept * 10) / 10,
          timeSaved: Math.round((result.duration - totalKept) * 10) / 10,
          segmentCount: kept.length,
          compressionRatio: Math.round((totalKept / result.duration) * 100),
        };
      })()
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content autocut-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <div className="autocut-header-icon" style={{ width: '32px', height: '32px' }}>
              <Scissors size={16} />
            </div>
            AI Auto-Cut
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body autocut-modal-body">
          {/* Left: Settings + Controls */}
          <div className="autocut-modal-left">
            {/* File info */}
            <div className="autocut-file-info">
              <div className="autocut-file-thumb">
                <video src={videoClip?.url} ref={videoRef} muted />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="autocut-file-name">{videoClip?.name || 'Video'}</div>
                <div className="autocut-file-meta">
                  {formatDuration(videoClip?.duration || 0)} •{' '}
                  {videoClip?.file ? `${(videoClip.file.size / (1024 * 1024)).toFixed(1)} MB` : 'On timeline'}
                </div>
              </div>
            </div>

            {/* Preset Selector */}
            <div className="autocut-section-title">Cut Style</div>
            <div className="autocut-presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`autocut-preset ${selectedPreset === preset.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setCustomSettings(preset.settings);
                  }}
                >
                  <span className="autocut-preset-icon">{preset.icon}</span>
                  <div>
                    <div className="autocut-preset-name">{preset.name}</div>
                    <div className="autocut-preset-desc">{preset.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Advanced Settings */}
            <button
              className="autocut-advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings size={12} />
              Advanced
              {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {showAdvanced && (
              <div className="autocut-advanced">
                <div className="autocut-slider-group">
                  <label className="autocut-slider-label">
                    Silence Threshold
                    <span>{(customSettings.silenceThreshold * 100).toFixed(1)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.005"
                    max="0.05"
                    step="0.001"
                    value={customSettings.silenceThreshold}
                    onChange={(e) =>
                      setCustomSettings((s) => ({
                        ...s,
                        silenceThreshold: parseFloat(e.target.value),
                      }))
                    }
                    className="autocut-slider"
                  />
                  <div className="autocut-slider-hints">
                    <span>Aggressive</span>
                    <span>Gentle</span>
                  </div>
                </div>

                <div className="autocut-slider-group">
                  <label className="autocut-slider-label">
                    Min Silence
                    <span>{customSettings.minSilenceDuration.toFixed(2)}s</span>
                  </label>
                  <input
                    type="range"
                    min="0.15"
                    max="2.0"
                    step="0.05"
                    value={customSettings.minSilenceDuration}
                    onChange={(e) =>
                      setCustomSettings((s) => ({
                        ...s,
                        minSilenceDuration: parseFloat(e.target.value),
                      }))
                    }
                    className="autocut-slider"
                  />
                  <div className="autocut-slider-hints">
                    <span>Cut all pauses</span>
                    <span>Only long gaps</span>
                  </div>
                </div>

                <div className="autocut-slider-group">
                  <label className="autocut-slider-label">
                    Padding
                    <span>{(customSettings.padding * 1000).toFixed(0)}ms</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.2"
                    step="0.01"
                    value={customSettings.padding}
                    onChange={(e) =>
                      setCustomSettings((s) => ({
                        ...s,
                        padding: parseFloat(e.target.value),
                      }))
                    }
                    className="autocut-slider"
                  />
                  <div className="autocut-slider-hints">
                    <span>Tight</span>
                    <span>Breathing room</span>
                  </div>
                </div>
              </div>
            )}

            {/* Analyze / Re-analyze */}
            {!result && (
              <button
                className="btn btn-primary autocut-analyze-btn"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <div className="spinner" />
                    Analyzing... {progress}%
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Detect Silence
                  </>
                )}
              </button>
            )}

            {analyzing && (
              <div className="autocut-progress">
                <div className="autocut-progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          {/* Right: Results */}
          {result && (
            <div className="autocut-modal-right">
              {/* Stats */}
              <div className="autocut-stats">
                <div className="autocut-stat">
                  <div className="autocut-stat-value">{liveStats.segmentCount}</div>
                  <div className="autocut-stat-label">Segments</div>
                </div>
                <div className="autocut-stat accent">
                  <div className="autocut-stat-value">-{formatDuration(liveStats.timeSaved)}</div>
                  <div className="autocut-stat-label">Time Saved</div>
                </div>
                <div className="autocut-stat">
                  <div className="autocut-stat-value">{formatDuration(liveStats.outputDuration)}</div>
                  <div className="autocut-stat-label">Final</div>
                </div>
                <div className="autocut-stat">
                  <div className="autocut-stat-value">{liveStats.compressionRatio}%</div>
                  <div className="autocut-stat-label">Kept</div>
                </div>
              </div>

              {/* Waveform */}
              <div className="autocut-waveform-container">
                <div className="autocut-section-title" style={{ marginBottom: '6px' }}>
                  Audio Waveform
                  <span style={{ marginLeft: 'auto', fontSize: '0.563rem', color: 'var(--text-muted)' }}>
                    🟣 Keep &bull; 🔴 Cut
                  </span>
                </div>
                <div className="autocut-waveform">
                  <svg
                    viewBox={`0 0 ${result.waveform.length} 100`}
                    preserveAspectRatio="none"
                    className="autocut-waveform-svg"
                  >
                    {result.silenceRegions.map((region, i) => {
                      const x1 = (region.start / result.duration) * result.waveform.length;
                      const x2 = (region.end / result.duration) * result.waveform.length;
                      return (
                        <rect
                          key={`silence-${i}`}
                          x={x1}
                          y={0}
                          width={x2 - x1}
                          height={100}
                          fill="rgba(239, 68, 68, 0.15)"
                        />
                      );
                    })}
                    {result.waveform.map((point, i) => {
                      const time = (i / result.waveform.length) * result.duration;
                      const inSilence = result.silenceRegions.some(
                        (r) => time >= r.start && time <= r.end
                      );
                      const height = Math.max(point.amplitude * 80, 1);
                      return (
                        <rect
                          key={i}
                          x={i}
                          y={50 - height / 2}
                          width={0.8}
                          height={height}
                          fill={inSilence ? 'rgba(239, 68, 68, 0.5)' : 'rgba(124, 58, 237, 0.8)'}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Segments */}
              <div className="autocut-section-title">
                <span>
                  Segments ({result.segments.filter((s) => s.keep).length}/{result.segments.length})
                </span>
                <button
                  className="btn-icon"
                  style={{ width: '22px', height: '22px', marginLeft: 'auto' }}
                  onClick={() => setExpandedView(!expandedView)}
                >
                  {expandedView ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              </div>

              <div className={`autocut-segments ${expandedView ? 'expanded' : ''}`}>
                {result.segments.map((seg, i) => (
                  <div
                    key={seg.id}
                    className={`autocut-segment ${seg.keep ? 'keep' : 'remove'} ${
                      playingSegment === seg.id ? 'playing' : ''
                    }`}
                  >
                    <button
                      className="autocut-segment-toggle"
                      onClick={() => toggleSegment(seg.id)}
                      title={seg.keep ? 'Click to remove' : 'Click to keep'}
                    >
                      {seg.keep ? (
                        <Eye size={12} style={{ color: 'var(--accent-success)' }} />
                      ) : (
                        <EyeOff size={12} style={{ color: 'var(--accent-danger)' }} />
                      )}
                    </button>
                    <span className="autocut-segment-num">#{i + 1}</span>
                    <span className="autocut-segment-time">
                      {formatDuration(seg.start)} — {formatDuration(seg.end)}
                    </span>
                    <span className="autocut-segment-dur">{seg.duration.toFixed(1)}s</span>
                    <button
                      className="btn-icon"
                      style={{ width: '22px', height: '22px' }}
                      onClick={() => playSegment(seg)}
                    >
                      {playingSegment === seg.id ? <Pause size={10} /> : <Play size={10} />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="autocut-actions">
                <button className="btn btn-secondary" onClick={handleAnalyze}>
                  <RotateCcw size={14} />
                  Re-analyze
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleApply}
                  disabled={liveStats.segmentCount === 0}
                >
                  <Zap size={14} />
                  Apply Cuts to Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
