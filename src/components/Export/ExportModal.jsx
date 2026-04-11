import { useState, useCallback, useMemo } from 'react';
import { Download, X, Loader, CheckCircle, AlertCircle, Volume2, Music, Mic, Sparkles } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { getFFmpeg, exportMultiTrack } from '../../services/ffmpeg';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ExportModal({ onClose }) {
  const {
    tracks,
    projectName,
    isExporting,
    exportProgress,
    exportStatus,
    setIsExporting,
    setExportProgress,
    setExportStatus,
    showNotification,
  } = useEditorStore();

  const [exportedUrl, setExportedUrl] = useState(null);
  const [exportedSize, setExportedSize] = useState(0);
  const [error, setError] = useState(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [loadingFFmpeg, setLoadingFFmpeg] = useState(false);

  const videoClips = tracks.find((t) => t.id === 'video')?.clips || [];
  const audioClips = tracks.find((t) => t.id === 'audio')?.clips || [];
  const narrationClips = tracks.find((t) => t.id === 'narration')?.clips || [];
  const sfxClips = tracks.find((t) => t.id === 'sfx')?.clips || [];

  const hasContent = videoClips.length > 0;
  const totalClips = videoClips.length + audioClips.length + narrationClips.length + sfxClips.length;

  // Summary of what will be exported
  const trackSummary = useMemo(() => {
    const items = [];
    if (videoClips.length > 0) items.push({ icon: '🎬', label: 'Video', count: videoClips.length });
    if (audioClips.length > 0) items.push({ icon: '🎵', label: 'Music', count: audioClips.length });
    if (narrationClips.length > 0) items.push({ icon: '🎙️', label: 'Narration', count: narrationClips.length });
    if (sfxClips.length > 0) items.push({ icon: '✨', label: 'SFX', count: sfxClips.length });
    return items;
  }, [videoClips.length, audioClips.length, narrationClips.length, sfxClips.length]);

  const handleLoadFFmpeg = useCallback(async () => {
    setLoadingFFmpeg(true);
    setError(null);
    try {
      await getFFmpeg();
      setFfmpegReady(true);
    } catch (err) {
      setError('Failed to load FFmpeg. Please try again.');
      console.error(err);
    } finally {
      setLoadingFFmpeg(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!hasContent) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Starting export...');
    setError(null);

    try {
      const result = await exportMultiTrack(
        tracks,
        projectName,
        (progress) => setExportProgress(progress),
        (status) => setExportStatus(status)
      );

      setExportedUrl(result.url);
      setExportedSize(result.size);
      setExportStatus('Export complete! 🎉');
      setExportProgress(100);
      showNotification('Video exported successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Export failed. Please try again.');
      setExportStatus('');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, [hasContent, tracks, projectName, setIsExporting, setExportProgress, setExportStatus, showNotification]);

  const handleDownload = () => {
    if (!exportedUrl) return;
    const link = document.createElement('a');
    link.href = exportedUrl;
    link.download = `${projectName.replace(/\s+/g, '_')}_KomicFreaks.mp4`;
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Download size={20} />
            Export Video
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Export Settings */}
          <div className="export-settings">
            <div className="property-group">
              <div className="property-group-title">Output Settings</div>
              <div className="property-row">
                <span className="property-label">Format</span>
                <span className="property-value">MP4 (H.264)</span>
              </div>
              <div className="property-row">
                <span className="property-label">Quality</span>
                <span className="property-value">YouTube HD (CRF 18)</span>
              </div>
              <div className="property-row">
                <span className="property-label">Audio</span>
                <span className="property-value">AAC 192kbps</span>
              </div>
              <div className="property-row">
                <span className="property-label">Frame Rate</span>
                <span className="property-value">30 fps</span>
              </div>
            </div>

            {/* Track Summary */}
            <div className="property-group">
              <div className="property-group-title">Tracks to Export</div>
              {trackSummary.length > 0 ? (
                <div className="export-track-summary">
                  {trackSummary.map((item) => (
                    <div key={item.label} className="export-track-badge">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="export-track-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.813rem' }}>
                  No clips on timeline
                </div>
              )}
            </div>

            {/* Muted track warning */}
            {tracks.some((t) => t.muted && t.clips.length > 0) && (
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'rgba(250, 204, 21, 0.1)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#fbbf24',
                fontSize: '0.75rem',
                marginBottom: 'var(--space-md)',
              }}>
                ⚠️ Some tracks are muted and will be excluded from the export.
              </div>
            )}
          </div>

          {/* FFmpeg Load Step */}
          {!ffmpegReady && !isExporting && (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.875rem' }}>
                The video encoder needs to be loaded first (~2MB download).
                <br />This only happens once per session.
              </p>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={handleLoadFFmpeg}
                disabled={loadingFFmpeg}
              >
                {loadingFFmpeg ? (
                  <>
                    <div className="spinner" />
                    Loading Encoder...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Load Video Encoder
                  </>
                )}
              </button>
            </div>
          )}

          {/* Progress */}
          {(isExporting || exportedUrl) && (
            <div className="export-progress-section">
              <div className="export-progress-bar-bg">
                <div
                  className="export-progress-bar"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="export-progress-info">
                <span>{exportStatus}</span>
                <span>{exportProgress}%</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="export-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Success */}
          {exportedUrl && (
            <div className="export-success">
              <CheckCircle size={20} style={{ color: 'var(--accent-success)' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Video Ready!</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  File size: {formatBytes(exportedSize)} • {totalClips} clip{totalClips !== 1 ? 's' : ''} merged
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {exportedUrl ? (
            <button className="btn btn-primary" onClick={handleDownload}>
              <Download size={14} />
              Download MP4
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={!ffmpegReady || isExporting || !hasContent}
            >
              {isExporting ? (
                <>
                  <div className="spinner" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Export for YouTube
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
