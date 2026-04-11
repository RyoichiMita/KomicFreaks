import { useState } from 'react';
import { Type, Plus, Trash2, AlignCenter, AlignLeft, AlignRight, ChevronUp, ChevronDown } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const CAPTION_PRESETS = [
  {
    id: 'default',
    name: 'Standard',
    style: { fontSize: '24px', color: '#ffffff', bg: 'rgba(0,0,0,0.7)', fontWeight: '400', fontStyle: 'normal' },
  },
  {
    id: 'bold',
    name: 'Bold Impact',
    style: { fontSize: '32px', color: '#ffffff', bg: 'rgba(0,0,0,0.85)', fontWeight: '700', fontStyle: 'normal' },
  },
  {
    id: 'anime',
    name: 'Anime Pop',
    style: { fontSize: '28px', color: '#ff6b9d', bg: 'rgba(20,10,30,0.9)', fontWeight: '700', fontStyle: 'italic' },
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    style: { fontSize: '20px', color: '#e0e0e0', bg: 'transparent', fontWeight: '300', fontStyle: 'normal' },
  },
  {
    id: 'hype',
    name: 'HYPE MODE',
    style: { fontSize: '36px', color: '#fbbf24', bg: 'rgba(0,0,0,0.8)', fontWeight: '900', fontStyle: 'normal' },
  },
  {
    id: 'narrate',
    name: 'Narrator',
    style: { fontSize: '22px', color: '#a78bfa', bg: 'rgba(15,10,25,0.85)', fontWeight: '400', fontStyle: 'italic' },
  },
];

export default function CaptionsPanel() {
  const {
    tracks,
    addClipToTrack,
    updateClipOnTrack,
    removeClipFromTrack,
    showNotification,
    currentTime,
  } = useEditorStore();

  const [newText, setNewText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [captionDuration, setCaptionDuration] = useState(3);
  const [alignment, setAlignment] = useState('center');
  const [position, setPosition] = useState('bottom'); // 'top' | 'center' | 'bottom'
  const [editingCaption, setEditingCaption] = useState(null);

  const captionsTrack = tracks.find((t) => t.id === 'captions');
  const captions = captionsTrack?.clips || [];

  const handleAddCaption = () => {
    if (!newText.trim()) return;

    const preset = CAPTION_PRESETS.find((p) => p.id === selectedPreset);

    addClipToTrack('captions', {
      name: `📝 "${newText.substring(0, 20)}…"`,
      text: newText,
      type: 'caption',
      offset: currentTime,
      duration: captionDuration,
      style: { ...preset.style },
      alignment,
      position,
      presetId: selectedPreset,
    });

    showNotification('Caption added to timeline', 'success');
    setNewText('');
  };

  const handleUpdateCaption = (clipId, updates) => {
    updateClipOnTrack('captions', clipId, updates);
  };

  const handleDeleteCaption = (clipId) => {
    removeClipFromTrack('captions', clipId);
    setEditingCaption(null);
    showNotification('Caption removed', 'info');
  };

  return (
    <div className="ai-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon captions">
            <Type size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">Captions & Text</div>
            <div className="ai-card-description">Add subtitles and text overlays</div>
          </div>
        </div>

        {/* Style Presets */}
        <div className="property-group">
          <div className="property-group-title">Style Preset</div>
          <div className="caption-presets">
            {CAPTION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`caption-preset-btn ${selectedPreset === preset.id ? 'selected' : ''}`}
                onClick={() => setSelectedPreset(preset.id)}
                style={{
                  fontWeight: preset.style.fontWeight,
                  fontStyle: preset.style.fontStyle,
                  color: preset.style.color,
                  background: preset.style.bg || 'var(--bg-deep)',
                  fontSize: '0.625rem',
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Caption Text */}
        <div className="property-group">
          <div className="property-group-title">Caption Text</div>
          <textarea
            className="script-textarea"
            placeholder="Type caption text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={2}
            style={{ minHeight: '50px' }}
          />
        </div>

        {/* Position & Alignment */}
        <div className="property-group">
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div style={{ flex: 1 }}>
              <div className="property-group-title">Position</div>
              <div className="caption-position-group">
                {['top', 'center', 'bottom'].map((pos) => (
                  <button
                    key={pos}
                    className={`caption-pos-btn ${position === pos ? 'selected' : ''}`}
                    onClick={() => setPosition(pos)}
                  >
                    {pos === 'top' && <ChevronUp size={12} />}
                    {pos === 'center' && '⊙'}
                    {pos === 'bottom' && <ChevronDown size={12} />}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="property-group-title">Align</div>
              <div className="caption-position-group">
                {[
                  { val: 'left', icon: AlignLeft },
                  { val: 'center', icon: AlignCenter },
                  { val: 'right', icon: AlignRight },
                ].map(({ val, icon: Icon }) => (
                  <button
                    key={val}
                    className={`caption-pos-btn ${alignment === val ? 'selected' : ''}`}
                    onClick={() => setAlignment(val)}
                  >
                    <Icon size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="property-group">
          <div className="property-group-title">Duration: {captionDuration}s</div>
          <input
            type="range"
            className="track-volume-slider"
            style={{ width: '100%' }}
            min="0.5"
            max="15"
            step="0.5"
            value={captionDuration}
            onChange={(e) => setCaptionDuration(parseFloat(e.target.value))}
          />
        </div>

        {/* Add Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleAddCaption}
          disabled={!newText.trim()}
        >
          <Plus size={14} />
          Add Caption at {Math.floor(currentTime)}s
        </button>

        {/* Existing Captions List */}
        {captions.length > 0 && (
          <div className="property-group" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="property-group-title">
              Captions on Timeline ({captions.length})
            </div>
            <div className="caption-list">
              {captions
                .slice()
                .sort((a, b) => (a.offset || 0) - (b.offset || 0))
                .map((caption) => (
                  <div key={caption.id} className="caption-item">
                    <div className="caption-item-text">
                      {editingCaption === caption.id ? (
                        <input
                          className="input"
                          style={{ height: '24px', fontSize: '0.688rem' }}
                          value={caption.text || ''}
                          onChange={(e) =>
                            handleUpdateCaption(caption.id, {
                              text: e.target.value,
                              name: `📝 "${e.target.value.substring(0, 20)}…"`,
                            })
                          }
                          onBlur={() => setEditingCaption(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingCaption(null)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => setEditingCaption(caption.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          "{caption.text?.substring(0, 30)}"
                        </span>
                      )}
                    </div>
                    <span className="caption-item-time">
                      {Math.floor(caption.offset || 0)}s – {Math.floor((caption.offset || 0) + (caption.duration || 0))}s
                    </span>
                    <button
                      className="btn-icon"
                      style={{ width: '18px', height: '18px', flexShrink: 0 }}
                      onClick={() => handleDeleteCaption(caption.id)}
                    >
                      <Trash2 size={10} style={{ color: 'var(--accent-danger)' }} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
