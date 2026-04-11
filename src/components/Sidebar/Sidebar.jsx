import { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Film,
  FileAudio,
  Image,
  Trash2,
  Plus,
  FolderOpen,
} from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { formatFileSize, formatDuration } from '../../utils/helpers';

export default function Sidebar() {
  const {
    mediaFiles,
    addMediaFile,
    removeMediaFile,
    updateMediaDuration,
    addClipToTrack,
    setActiveTab,
  } = useEditorStore();

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (
        file.type.startsWith('video/') ||
        file.type.startsWith('audio/') ||
        file.type.startsWith('image/')
      ) {
        const mediaItem = addMediaFile(file);

        // Auto-detect duration for video/audio files
        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
          const el = document.createElement(
            file.type.startsWith('video/') ? 'video' : 'audio'
          );
          el.preload = 'metadata';
          el.onloadedmetadata = () => {
            updateMediaDuration(mediaItem.id, el.duration);
            URL.revokeObjectURL(el.src);
          };
          el.src = URL.createObjectURL(file);
        }
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) return Film;
    if (type.startsWith('audio/')) return FileAudio;
    if (type.startsWith('image/')) return Image;
    return Film;
  };

  const handleAddToTimeline = (item) => {
    let trackId = 'video';
    let clipType = 'video';

    if (item.type.startsWith('audio/')) {
      trackId = 'audio';
      clipType = 'audio';
    } else if (item.type.startsWith('image/')) {
      trackId = 'video';
      clipType = 'video';
    }

    addClipToTrack(trackId, {
      name: item.name,
      type: clipType,
      url: item.url,
      file: item.file,
      duration: item.duration || 5,
      offset: 0,
    });

    setActiveTab('editor');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <FolderOpen size={14} />
          Media
        </div>
        <button
          className="btn-icon tooltip"
          data-tooltip="Import files"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="sidebar-content">
        {/* Drop zone */}
        <div
          className={`drop-zone ${isDragging ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-icon">
            <Upload size={22} />
          </div>
          <div className="drop-zone-text">Import Media</div>
          <div className="drop-zone-hint">
            Drop files here or click to browse
            <br />
            MP4, MOV, MP3, WAV, JPG, PNG
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Media list */}
        {mediaFiles.length > 0 && (
          <div className="sidebar-section" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="sidebar-section-title">
              Library ({mediaFiles.length})
            </div>

            {mediaFiles.map((item) => {
              const FileIcon = getFileIcon(item.type);

              return (
                <div
                  key={item.id}
                  className="media-item"
                  onClick={() => handleAddToTimeline(item)}
                  title="Click to add to timeline"
                >
                  <div className="media-thumb">
                    {item.type.startsWith('video/') ? (
                      <video src={item.url} muted />
                    ) : item.type.startsWith('image/') ? (
                      <img src={item.url} alt={item.name} />
                    ) : (
                      <div className="media-thumb-icon">
                        <FileIcon size={18} />
                      </div>
                    )}
                  </div>
                  <div className="media-info">
                    <div className="media-name">{item.name}</div>
                    <div className="media-meta">
                      {formatFileSize(item.size)}
                      {item.duration > 0 &&
                        ` • ${formatDuration(item.duration)}`}
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    style={{ width: '24px', height: '24px', flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMediaFile(item.id);
                    }}
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
