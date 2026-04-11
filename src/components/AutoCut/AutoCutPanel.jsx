import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Scissors,
  Upload,
  Sparkles,
  Play,
  Pause,
  Check,
  X,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';
import { analyzeAudio, generateCutList } from '../../services/autocut';
import { getFFmpeg, trimVideo } from '../../services/ffmpeg';
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

export default function AutoCutPanel() {
  const { addClipToTrack, setActiveTab } = useEditorStore();

  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('natural');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSettings, setCustomSettings] = useState(PRESETS[1].settings);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [playingSegment, setPlayingSegment] = useState(null);
  const [expandedView, setExpandedView] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const playTimeoutRef = useRef(null);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, [fileUrl]);

  const handleFileSelect = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(selected);
    setFile(selected);
    setFileUrl(url);
    setResult(null);
    e.target.value = '';
  }, [fileUrl]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped || !dropped.type.startsWith('video/')) return;

    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(dropped);
    setFile(dropped);
    setFileUrl(url);
    setResult(null);
  }, [fileUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    setAnalyzing(true);
    setProgress(0);
    setResult(null);

    try {
      const preset = PRESETS.find((p) => p.id === selectedPreset);
      const settings = showAdvanced ? customSettings : preset?.settings || PRESETS[1].settings;

      const analysisResult = await analyzeAudio(file, settings, (p) => setProgress(p));
      setResult(analysisResult);
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Failed to analyze audio. Make sure the video has an audio track.');
    } finally {
      setAnalyzing(false);
    }
  }, [file, selectedPreset, showAdvanced, customSettings]);

  const handleReanalyze = useCallback(() => {
    setResult(null);
    // Will trigger re-analysis when user clicks Analyze
  }, []);

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
    if (!videoRef.current || !fileUrl) return;

    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);

    videoRef.current.currentTime = segment.start;
    videoRef.current.play();
    setPlayingSegment(segment.id);

    const dur = (segment.end - segment.start) * 1000;
    playTimeoutRef.current = setTimeout(() => {
      videoRef.current?.pause();
      setPlayingSegment(null);
    }, dur);
  }, [fileUrl]);

  const handleExportCut = useCallback(async () => {
    if (!result || !file) return;

    const keptSegments = result.segments.filter((s) => s.keep);
    if (keptSegments.length === 0) {
      alert('No segments selected to keep!');
      return;
    }

    setExporting(true);
    setExportProgress(0);

    try {
      const ffmpeg = await getFFmpeg();
      setExportProgress(10);

      // Write input file
      const fileData = new Uint8Array(await file.arrayBuffer());
      await ffmpeg.writeFile('input.mp4', fileData);
      setExportProgress(25);

      // Build and run the FFmpeg filter_complex
      const { filterComplex, outputMaps } = generateCutList(keptSegments);

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-filter_complex', filterComplex,
        ...outputMaps,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        'output.mp4',
      ]);

      setExportProgress(85);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      setExportProgress(95);

      // Download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^.]+$/, '')}_autocut.mp4`;
      a.click();

      // Also add to timeline
      addClipToTrack('video', {
        name: `${file.name.replace(/\.[^.]+$/, '')} (Auto-Cut)`,
        type: 'video',
        url,
        duration: result.stats.outputDuration,
        offset: 0,
      });

      setExportProgress(100);
      setActiveTab('editor');

      // Cleanup FFmpeg files
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }, [result, file, addClipToTrack, setActiveTab]);

  // Calculate live stats based on toggled segments
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
    <div className="autocut-panel">
      {/* Header */}
      <div className="autocut-header">
        <div className="autocut-header-icon">
          <Scissors size={20} />
        </div>
        <div>
          <div className="autocut-title">AI Auto-Cut</div>
          <div className="autocut-subtitle">
            Remove silence and dead air automatically
          </div>
        </div>
      </div>

      {/* File Upload */}
      {!file ? (
        <div
          className="autocut-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={28} style={{ color: 'var(--accent-primary-light)' }} />
          <div className="autocut-drop-title">Drop your video here</div>
          <div className="autocut-drop-hint">or click to browse • MP4, MOV, WebM</div>
        </div>
      ) : !result ? (
        /* Pre-analysis: show file info + preset selector */
        <div className="autocut-setup">
          {/* File info */}
          <div className="autocut-file-info">
            <div className="autocut-file-thumb">
              <video src={fileUrl} ref={videoRef} muted />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="autocut-file-name">{file.name}</div>
              <div className="autocut-file-meta">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
            <button
              className="btn-icon"
              onClick={() => {
                if (fileUrl) URL.revokeObjectURL(fileUrl);
                setFile(null);
                setFileUrl(null);
              }}
              title="Remove"
            >
              <X size={16} />
            </button>
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
            Advanced Settings
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
                  Min Silence Duration
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

          {/* Analyze Button */}
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
                Detect Silence & Auto-Cut
              </>
            )}
          </button>

          {/* Progress */}
          {analyzing && (
            <div className="autocut-progress">
              <div className="autocut-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        /* Results view */
        <div className="autocut-results">
          {/* Stats Cards */}
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
              <div className="autocut-stat-label">Final Length</div>
            </div>
            <div className="autocut-stat">
              <div className="autocut-stat-value">{liveStats.compressionRatio}%</div>
              <div className="autocut-stat-label">Kept</div>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="autocut-waveform-container">
            <div className="autocut-section-title" style={{ marginBottom: '8px' }}>
              Audio Waveform
              <span style={{ float: 'right', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                🟣 Keep • 🔴 Remove
              </span>
            </div>
            <div className="autocut-waveform">
              <svg
                viewBox={`0 0 ${result.waveform.length} 100`}
                preserveAspectRatio="none"
                className="autocut-waveform-svg"
              >
                {/* Silent regions (red) */}
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

                {/* Waveform bars */}
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

          {/* Hidden video for preview */}
          <video
            ref={videoRef}
            src={fileUrl}
            style={{ display: 'none' }}
          />

          {/* Segment List */}
          <div className="autocut-section-title" style={{ marginTop: 'var(--space-lg)' }}>
            <span>
              Segments ({result.segments.filter((s) => s.keep).length}/{result.segments.length})
            </span>
            <button
              className="btn-icon"
              style={{ width: '24px', height: '24px', marginLeft: 'auto' }}
              onClick={() => setExpandedView(!expandedView)}
              title={expandedView ? 'Collapse' : 'Expand'}
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

                <span className="autocut-segment-dur">
                  {seg.duration.toFixed(1)}s
                </span>

                <button
                  className="btn-icon"
                  style={{ width: '22px', height: '22px' }}
                  onClick={() => playSegment(seg)}
                  title="Preview segment"
                >
                  {playingSegment === seg.id ? (
                    <Pause size={10} />
                  ) : (
                    <Play size={10} />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="autocut-actions">
            <button className="btn btn-secondary" onClick={handleReanalyze}>
              <RotateCcw size={14} />
              Re-analyze
            </button>

            <button
              className="btn btn-primary"
              onClick={handleExportCut}
              disabled={exporting || liveStats.segmentCount === 0}
            >
              {exporting ? (
                <>
                  <div className="spinner" />
                  Cutting... {exportProgress}%
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Auto-Cut & Export
                </>
              )}
            </button>
          </div>

          {exporting && (
            <div className="autocut-progress">
              <div className="autocut-progress-bar" style={{ width: `${exportProgress}%` }} />
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
}
