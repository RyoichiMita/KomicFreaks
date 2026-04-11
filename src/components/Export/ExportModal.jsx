import { useState, useCallback } from 'react';
import { Download, X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { getFFmpeg, exportForYouTube, concatenateVideos } from '../../services/ffmpeg';

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
  } = useEditorStore();

  const [exportedUrl, setExportedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [loadingFFmpeg, setLoadingFFmpeg] = useState(false);

  const videoClips = tracks.find((t) => t.id === 'video')?.clips || [];
  const hasContent = videoClips.length > 0;

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
    setExportStatus('Preparing video...');
    setError(null);

    try {
      // Get video clips that have actual URLs
      const clipsWithUrls = videoClips
        .filter((c) => c.url)
        .sort((a, b) => (a.offset || 0) - (b.offset || 0));

      if (clipsWithUrls.length === 0) {
        throw new Error('No video clips with media to export. Add some video files first!');
      }

      let result;

      if (clipsWithUrls.length === 1) {
        setExportStatus('Exporting video for YouTube...');
        result = await exportForYouTube(clipsWithUrls[0].url, (progress) => {
          setExportProgress(progress);
        });
      } else {
        setExportStatus(`Merging ${clipsWithUrls.length} clips...`);
        result = await concatenateVideos(clipsWithUrls, (progress) => {
          setExportProgress(progress);
        });
      }

      setExportedUrl(result.url);
      setExportStatus('Export complete! 🎉');
      setExportProgress(100);
    } catch (err) {
      setError(err.message || 'Export failed. Please try again.');
      setExportStatus('');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, [hasContent, videoClips, setIsExporting, setExportProgress, setExportStatus]);

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
              <div className="property-row">
                <span className="property-label">Video Clips</span>
                <span className="property-value">{videoClips.length}</span>
              </div>
            </div>
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
                  Your video has been exported and is ready to download.
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
