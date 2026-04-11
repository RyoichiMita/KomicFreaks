import useEditorStore from '../../stores/editorStore';
import {
  Upload,
  Sparkles,
  Film,
  RotateCcw,
} from 'lucide-react';
import { getSavedProjectInfo } from '../../services/projectPersistence';

export default function WelcomeScreen() {
  const { setActiveTab, loadSavedProject } = useEditorStore();
  const savedInfo = getSavedProjectInfo();

  const handleResume = () => {
    loadSavedProject();
    setActiveTab('editor');
  };

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

      <div className="welcome-actions" style={{ justifyContent: 'center', gap: 'var(--space-lg)' }}>
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
          <div className="welcome-card-title" style={{ fontSize: '1rem' }}>New Project</div>
          <div className="welcome-card-desc">
            Start fresh — import clips and create something awesome
          </div>
        </div>

        {savedInfo && (
          <div
            className="welcome-card welcome-card-hero"
            onClick={handleResume}
            style={{ borderColor: 'rgba(124, 58, 237, 0.4)' }}
          >
            <div
              className="welcome-card-icon"
              style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white', width: '56px', height: '56px' }}
            >
              <RotateCcw size={28} />
            </div>
            <div className="welcome-card-title" style={{ fontSize: '1rem' }}>Resume Project</div>
            <div className="welcome-card-desc">
              {savedInfo.projectName} — {savedInfo.clipCount} clip{savedInfo.clipCount !== 1 ? 's' : ''}
            </div>
            <div style={{
              fontSize: '0.625rem',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-xs)',
            }}>
              Last saved: {savedInfo.savedAtFormatted}
            </div>
          </div>
        )}
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
