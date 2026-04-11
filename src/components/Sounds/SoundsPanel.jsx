import { useState } from 'react';
import { Volume2, Play, Plus, Search } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { playSFX, getSFXDuration, getSFXBlobUrl } from '../../services/soundEffects';

const SOUND_CATEGORIES = [
  {
    title: 'Reactions',
    sounds: [
      { emoji: '😱', label: 'NANI?!', file: 'nani' },
      { emoji: '🤩', label: 'SUGOI!', file: 'sugoi' },
      { emoji: '😤', label: 'YARE YARE', file: 'yare-yare' },
      { emoji: '🔥', label: 'FIRE!', file: 'fire' },
      { emoji: '💀', label: 'Shocked', file: 'shocked' },
      { emoji: '😏', label: 'Heh', file: 'heh' },
    ],
  },
  {
    title: 'Impact SFX',
    sounds: [
      { emoji: '💥', label: 'Explosion', file: 'explosion' },
      { emoji: '⚡', label: 'Electric', file: 'electric' },
      { emoji: '🌊', label: 'Whoosh', file: 'whoosh' },
      { emoji: '✨', label: 'Sparkle', file: 'sparkle' },
      { emoji: '💪', label: 'Power Up', file: 'powerup' },
      { emoji: '🥊', label: 'Punch', file: 'punch' },
    ],
  },
  {
    title: 'Transitions',
    sounds: [
      { emoji: '🔔', label: 'Ding', file: 'ding' },
      { emoji: '🎵', label: 'Jingle', file: 'jingle' },
      { emoji: '📢', label: 'Announce', file: 'announce' },
      { emoji: '🎯', label: 'Hit', file: 'hit' },
      { emoji: '⭐', label: 'Star', file: 'star' },
      { emoji: '🎬', label: 'Action!', file: 'action' },
    ],
  },
  {
    title: 'Anime Vibes',
    sounds: [
      { emoji: '🏴‍☠️', label: 'Pirates!', file: 'pirates' },
      { emoji: '⚔️', label: 'Sword', file: 'sword' },
      { emoji: '🐉', label: 'Dragon', file: 'dragon' },
      { emoji: '🥋', label: 'Dojo', file: 'dojo' },
      { emoji: '🌸', label: 'Sakura', file: 'sakura' },
      { emoji: '👊', label: 'Ora Ora', file: 'ora-ora' },
    ],
  },
];

export default function SoundsPanel() {
  const { addClipToTrack, showNotification } = useEditorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState(null);

  const handlePreview = (sound) => {
    setPlayingId(sound.file);
    playSFX(sound.file);
    setTimeout(() => setPlayingId(null), 800);
  };

  const handleAddToTimeline = (sound) => {
    const duration = getSFXDuration(sound.file);
    const blobUrl = getSFXBlobUrl(sound.file);

    addClipToTrack('sfx', {
      name: `${sound.emoji} ${sound.label}`,
      url: blobUrl,
      startTime: 0,
      duration: duration,
      offset: 0,
      type: 'sfx',
      sfxId: sound.file,
    });
    showNotification(`Added "${sound.label}" to timeline`, 'success');
  };

  // Filter sounds by search
  const filteredCategories = SOUND_CATEGORIES.map((cat) => ({
    ...cat,
    sounds: cat.sounds.filter(
      (s) =>
        s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.file.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.sounds.length > 0);

  return (
    <div className="ai-panel sounds-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon sounds">
            <Volume2 size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">Anime Sound Library</div>
            <div className="ai-card-description">
              Click to preview, + to add to timeline
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          position: 'relative',
          marginBottom: 'var(--space-md)',
        }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search sounds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.75rem' }}
          />
        </div>

        {filteredCategories.map((category) => (
          <div key={category.title} className="property-group">
            <div className="property-group-title">{category.title}</div>
            <div className="sound-grid">
              {category.sounds.map((sound) => {
                const isPlaying = playingId === sound.file;
                return (
                  <div
                    key={sound.file}
                    className={`sound-btn ${isPlaying ? 'playing' : ''}`}
                  >
                    <button
                      className="sound-preview-btn"
                      onClick={() => handlePreview(sound)}
                      title={`Preview "${sound.label}"`}
                    >
                      <span className="sound-emoji">{sound.emoji}</span>
                      <span className="sound-label">{sound.label}</span>
                    </button>
                    <button
                      className="sound-add-btn"
                      onClick={() => handleAddToTimeline(sound)}
                      title={`Add "${sound.label}" to SFX track`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-xl)',
            color: 'var(--text-muted)',
            fontSize: '0.813rem',
          }}>
            No sounds match "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
