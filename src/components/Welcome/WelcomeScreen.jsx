import useEditorStore from '../../stores/editorStore';
import {
  Upload,
  Mic,
  Volume2,
  Image,
  Layout,
  Sparkles,
} from 'lucide-react';

export default function WelcomeScreen() {
  const { setActiveTab } = useEditorStore();

  const cards = [
    {
      icon: <Upload size={24} />,
      title: 'Import & Edit',
      desc: 'Drag in your clips and start editing',
      tab: 'editor',
      gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    },
    {
      icon: <Mic size={24} />,
      title: 'AI Narration',
      desc: 'Generate voiceovers with AI',
      tab: 'narration',
      gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    },
    {
      icon: <Volume2 size={24} />,
      title: 'Sound Effects',
      desc: 'Anime reactions & SFX',
      tab: 'sounds',
      gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    },
    {
      icon: <Image size={24} />,
      title: 'Thumbnails',
      desc: 'Create YouTube thumbnails',
      tab: 'thumbnail',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    },
    {
      icon: <Layout size={24} />,
      title: 'Templates',
      desc: 'One-click video structures',
      tab: 'templates',
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    },
  ];

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

      <div className="welcome-actions">
        {cards.map((card) => (
          <div
            key={card.tab}
            className="welcome-card"
            onClick={() => setActiveTab(card.tab)}
          >
            <div
              className="welcome-card-icon"
              style={{ background: card.gradient, color: 'white' }}
            >
              {card.icon}
            </div>
            <div className="welcome-card-title">{card.title}</div>
            <div className="welcome-card-desc">{card.desc}</div>
          </div>
        ))}
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
