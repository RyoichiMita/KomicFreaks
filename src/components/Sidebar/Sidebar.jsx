import { useRef, useCallback } from 'react';
import { Film, Upload } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { formatFileSize, formatDuration } from '../../utils/helpers';

export default function Sidebar() {
  const fileInputRef = useRef(null);
  const { mediaFiles, addMediaFile, removeMediaFile, addClipToTrack, setActiveTab } = useEditorStore();

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith('video/') || file.type.startsWith('audio/') || file.type.startsWith('image/')) {
        const mediaItem = addMediaFile(file);

        // Get duration for video/audio files
        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
          const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
          el.src = mediaItem.url;
          el.onloadedmetadata = () => {
            mediaItem.duration = el.duration;
          };
        }
      }
    });
    e.target.value = '';
  }, [addMediaFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith('video/') || file.type.startsWith('audio/') || file.type.startsWith('image/')) {
        addMediaFile(file);
      }
    });
  }, [addMediaFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleAddToTimeline = (media) => {
    const trackId = media.type.startsWith('video/') ? 'video' : 'audio';
    addClipToTrack(trackId, {
      name: media.name,
      mediaId: media.id,
      url: media.url,
      startTime: 0,
      duration: media.duration || 5,
      offset: 0,
      type: trackId,
    });
    setActiveTab('editor');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Film size={16} />
          Media
        </div>
        <button
          className="btn-icon tooltip"
          data-tooltip="Import media"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <div className="sidebar-content" onDrop={handleDrop} onDragOver={handleDragOver}>
        {mediaFiles.length === 0 ? (
          <div
            className="drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-icon">
              <Upload size={24} />
            </div>
            <div className="drop-zone-text">Import Media</div>
            <div className="drop-zone-hint">
              Drag & drop video, audio, or image files here
            </div>
          </div>
        ) : (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Imported Files</div>
              {mediaFiles.map((media) => (
                <div
                  key={media.id}
                  className="media-item"
                  onClick={() => handleAddToTimeline(media)}
                  title="Click to add to timeline"
                >
                  <div className="media-thumb">
                    {media.type.startsWith('video/') ? (
                      <video src={media.url} muted />
                    ) : (
                      <div className="media-thumb-icon">
                        <Film size={16} />
                      </div>
                    )}
                  </div>
                  <div className="media-info">
                    <div className="media-name">{media.name}</div>
                    <div className="media-meta">
                      {formatFileSize(media.size)}
                      {media.duration > 0 && ` • ${formatDuration(media.duration)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              Add More Files
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
