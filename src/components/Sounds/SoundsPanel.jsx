import { Volume2 } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

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
  const { addClipToTrack } = useEditorStore();

  const handlePlaySound = (sound) => {
    // For now, add a placeholder clip to the SFX track
    // In production, these would be actual audio files from public/sounds/
    addClipToTrack('sfx', {
      name: `${sound.emoji} ${sound.label}`,
      url: null, // Will be replaced with actual sound files
      startTime: 0,
      duration: 1.5,
      offset: 0,
      type: 'sfx',
    });
  };

  return (
    <div className="ai-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon sounds">
            <Volume2 size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">Anime Sound Library</div>
            <div className="ai-card-description">
              One-click sound effects for your videos
            </div>
          </div>
        </div>

        {SOUND_CATEGORIES.map((category) => (
          <div key={category.title} className="property-group">
            <div className="property-group-title">{category.title}</div>
            <div className="sound-grid">
              {category.sounds.map((sound) => (
                <button
                  key={sound.file}
                  className="sound-btn"
                  onClick={() => handlePlaySound(sound)}
                  title={`Add "${sound.label}" to timeline`}
                >
                  <span className="sound-emoji">{sound.emoji}</span>
                  <span className="sound-label">{sound.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
