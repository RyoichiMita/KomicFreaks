import { useState, useRef } from 'react';
import { Volume2, Play, Plus, Search, Square, Music, Upload, Trash2 } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { playSFX, getSFXDuration, getSFXBlobUrl } from '../../services/soundEffects';
import { MUSIC_TRACKS, previewMusic, stopPreview, getMusicDuration, getMusicBlobUrl } from '../../services/musicLibrary';

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
  {
    title: 'One Piece (MyInstants)',
    sounds: [
      { emoji: '🏴‍☠️', label: 'ZEHAHAHA', file: 'zehahaha_laugh', isMp3: true },
      { emoji: '🚢', label: 'Much Higher', file: 'can-we-get-much-higher-one-piece-meme', isMp3: true },
      { emoji: '💀', label: 'Brook Laugh', file: 'one-piece-brooks-laugh-15-minutes', isMp3: true },
      { emoji: '👑', label: 'OP is REAL', file: 'the-one-piece-is-real', isMp3: true },
      { emoji: '🐌', label: 'Den Den Mushi', file: 'transponder_snail', isMp3: true },
      { emoji: '👁️', label: 'Observation Haki', file: 'observation_haki_one_piece_katakuri_sound_effect_for_editing_5356509840631764694', isMp3: true },
      { emoji: '🔊', label: 'Den Den Loud', file: 'den-den-mushi-ring-short-louder', isMp3: true },
      { emoji: '📱', label: 'OP Ringtone', file: 'one_piece_ringtone_free_ringtones_for_cell_phones', isMp3: true },
      { emoji: '🎶', label: 'OP Intro', file: 'one-piece-intro', isMp3: true },
      { emoji: '🥁', label: 'Overtaken', file: 'one-piece-ost-overtaken', isMp3: true },
    ],
  },
];

export default function SoundsPanel() {
  const { addClipToTrack, showNotification } = useEditorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState(null);
  const [previewingMusicId, setPreviewingMusicId] = useState(null);
  const [customSounds, setCustomSounds] = useState([]);
  const fileInputRef = useRef(null);
  const previewAudioRef = useRef(null);

  // --- Custom SFX Upload ---
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('audio/')) {
        showNotification(`"${file.name}" is not an audio file`, 'error');
        return;
      }

      const url = URL.createObjectURL(file);
      const audio = new Audio(url);

      audio.addEventListener('loadedmetadata', () => {
        const name = file.name.replace(/\.[^.]+$/, ''); // Remove extension
        setCustomSounds((prev) => [
          ...prev,
          {
            id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            label: name,
            emoji: '🎧',
            url,
            file,
            duration: audio.duration,
            isCustom: true,
          },
        ]);
        showNotification(`Added custom SFX: "${name}"`, 'success');
      });
    });

    // Reset input so same file can be uploaded again
    e.target.value = '';
  };

  const handlePreviewCustom = (sound) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    if (playingId === sound.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(sound.url);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    previewAudioRef.current = audio;
    setPlayingId(sound.id);
  };

  const handleAddCustomToTimeline = (sound) => {
    addClipToTrack('sfx', {
      name: `${sound.emoji} ${sound.label}`,
      url: sound.url,
      startTime: 0,
      duration: sound.duration,
      offset: 0,
      type: 'sfx',
      isCustom: true,
    });
    showNotification(`Added "${sound.label}" to SFX track`, 'success');
  };

  const removeCustomSound = (id) => {
    setCustomSounds((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePreview = (sound) => {
    setPlayingId(sound.file);
    
    if (sound.isMp3) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(`/sounds/anime/${sound.file}.mp3`);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingId(null);
      previewAudioRef.current = audio;
    } else {
      playSFX(sound.file);
      setTimeout(() => setPlayingId(null), 800);
    }
  };

  const handleAddToTimeline = (sound) => {
    if (sound.isMp3) {
      const url = `/sounds/anime/${sound.file}.mp3`;
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        addClipToTrack('sfx', {
          name: `${sound.emoji} ${sound.label}`,
          url: url,
          startTime: 0,
          duration: audio.duration,
          offset: 0,
          type: 'sfx',
          sfxId: sound.file,
        });
        showNotification(`Added "${sound.label}" to timeline`, 'success');
      };
    } else {
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
    }
  };

  // Filter sounds by search (include custom)
  const filteredCategories = SOUND_CATEGORIES.map((cat) => ({
    ...cat,
    sounds: cat.sounds.filter(
      (s) =>
        s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.file.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.sounds.length > 0);

  const filteredCustom = customSounds.filter((s) =>
    s.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Custom SFX Upload */}
        <div className="property-group">
          <div className="property-group-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Your Sounds</span>
            <span style={{ fontSize: '0.563rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              {customSounds.length} uploaded
            </span>
          </div>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            className="btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '10px',
              marginBottom: customSounds.length > 0 ? 'var(--space-sm)' : 0,
              border: '1px dashed var(--border-default)',
              background: 'var(--bg-deep)',
              fontSize: '0.688rem',
              gap: '6px',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            Upload Custom SFX (WAV, MP3)
          </button>

          {/* Custom Sounds List */}
          {filteredCustom.length > 0 && (
            <div className="sound-grid" style={{ marginTop: 'var(--space-xs)' }}>
              {filteredCustom.map((sound) => {
                const isPlaying = playingId === sound.id;
                return (
                  <div
                    key={sound.id}
                    className={`sound-btn ${isPlaying ? 'playing' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    <button
                      className="sound-preview-btn"
                      onClick={() => handlePreviewCustom(sound)}
                      title={`Preview "${sound.label}"`}
                    >
                      <span className="sound-emoji">{isPlaying ? '⏹️' : sound.emoji}</span>
                      <span className="sound-label" style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sound.label}
                      </span>
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <button
                        className="sound-add-btn"
                        onClick={() => handleAddCustomToTimeline(sound)}
                        title={`Add "${sound.label}" to SFX track`}
                        style={{ flex: 1 }}
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        className="sound-add-btn"
                        onClick={() => removeCustomSound(sound.id)}
                        title="Remove"
                        style={{ flex: 1, color: 'var(--accent-danger)' }}
                      >
                        <Trash2 size={8} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

        {filteredCategories.length === 0 && !searchTerm && null}
        {filteredCategories.length === 0 && searchTerm && (
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

      {/* Background Music Section */}
      {!searchTerm && (
        <div className="ai-card" style={{ marginTop: 'var(--space-md)' }}>
          <div className="ai-card-header">
            <div className="ai-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
              <Music size={20} color="white" />
            </div>
            <div>
              <div className="ai-card-title">Background Music</div>
              <div className="ai-card-description">
                Ambient loops for your videos
              </div>
            </div>
          </div>

          <div className="music-track-list">
            {MUSIC_TRACKS.map((track) => {
              const isPreviewing = previewingMusicId === track.id;
              return (
                <div key={track.id} className={`music-track-card ${isPreviewing ? 'playing' : ''}`}>
                  <button
                    className="music-preview-btn"
                    onClick={() => {
                      if (isPreviewing) {
                        stopPreview();
                        setPreviewingMusicId(null);
                      } else {
                        if (previewingMusicId) stopPreview();
                        previewMusic(track.id);
                        setPreviewingMusicId(track.id);
                      }
                    }}
                    title={isPreviewing ? 'Stop preview' : `Preview "${track.name}"`}
                  >
                    {isPreviewing ? <Square size={12} /> : <Play size={12} />}
                  </button>
                  <div className="music-info">
                    <div className="music-name">
                      <span>{track.emoji}</span> {track.name}
                    </div>
                    <div className="music-desc">{track.description}</div>
                  </div>
                  <span className="music-mood">{track.mood}</span>
                  <button
                    className="sound-add-btn"
                    onClick={() => {
                      const duration = getMusicDuration(track.id);
                      const blobUrl = getMusicBlobUrl(track.id);
                      addClipToTrack('audio', {
                        name: `${track.emoji} ${track.name}`,
                        url: blobUrl,
                        startTime: 0,
                        duration,
                        offset: 0,
                        type: 'audio',
                        musicId: track.id,
                        loop: true,
                      });
                      showNotification(`Added "${track.name}" to Audio track`, 'success');
                    }}
                    title={`Add "${track.name}" to Audio track`}
                    style={{ borderLeft: '1px solid var(--border-subtle)', height: '100%', width: '32px' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
