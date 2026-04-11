import useEditorStore from '../../stores/editorStore';
import {
  Upload,
  Sparkles,
  Film,
} from 'lucide-react';

export default function WelcomeScreen() {
  const { setActiveTab } = useEditorStore();

  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <img
          src="/logo.png"
          alt="Komic Freaks"
          className="welcome-logo-img"
        />
        <h1 className="welcome-title">
          <span className="glow-text">Komic Freaks</span>{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Studio</span>
        </h1>
        <p className="welcome-subtitle">
          AI-powered video editing for anime action figure reviews.
          Create stunning content with one click. 🔥
        </p>
      </div>

      <div className="welcome-actions" style={{ justifyContent: 'center' }}>
        <div
          className="welcome-card welcome-card-hero"
          onClick={() => setActiveTab('editor')}
        >
          <div
            className="welcome-card-icon"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white', width: '56px', height: '56px' }}
          >
            <Film size={28} />
          </div>
          <div className="welcome-card-title" style={{ fontSize: '1rem' }}>Open Editor</div>
          <div className="welcome-card-desc">
            Import your clips, add AI narration, sound effects, and export — all in one place
          </div>
        </div>
      </div>

      <div className="welcome-features">
        <div className="welcome-feature">
          <span className="welcome-feature-icon">✂️</span>
          <span>AI Auto-Cut</span>
        </div>
        <div className="welcome-feature">
          <span className="welcome-feature-icon">🗣️</span>
          <span>AI Narration</span>
        </div>
        <div className="welcome-feature">
          <span className="welcome-feature-icon">🎭</span>
          <span>Sound Effects</span>
        </div>
        <div className="welcome-feature">
          <span className="welcome-feature-icon">🖼️</span>
          <span>Thumbnails</span>
        </div>
        <div className="welcome-feature">
          <span className="welcome-feature-icon">📐</span>
          <span>Templates</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        marginTop: 'var(--space-xl)',
      }}>
        <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
        Powered by ElevenLabs AI & FFmpeg
      </div>
    </div>
  );
}
