import {
  Film,
  Archive,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Star,
} from 'lucide-react';

export default function HubScreen({ onNavigate }) {
  const apps = [
    {
      id: 'studio',
      title: 'Studio',
      subtitle: 'AI-Powered Video Editor',
      description: 'Create stunning anime figure review videos with AI narration, auto-cut, and one-click export.',
      icon: Film,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      features: ['AI Auto-Cut', 'AI Narration', 'SFX Library', 'One-Click Export'],
      badge: 'LIVE',
      badgeColor: 'var(--accent-success)',
    },
    {
      id: 'vault',
      title: 'SHF Vault',
      subtitle: 'Collection Manager',
      description: 'The ultimate S.H. Figuarts digital vault. Catalog, track, and complete your collection.',
      icon: Archive,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      features: ['Full Catalog', 'Badge System', 'Series Tracker', 'Release Calendar'],
      badge: 'NEW',
      badgeColor: 'var(--accent-secondary)',
    },
  ];

  return (
    <div className="hub-screen">
      {/* Hero */}
      <div className="hub-hero">
        <div className="hub-hero-glow" />
        <img src="/logo.png" alt="Komic Freaks" className="hub-logo-img" />
        <h1 className="hub-title">
          <span className="glow-text">Komic Freaks</span>
        </h1>
        <p className="hub-subtitle">
          Your all-in-one platform for the action figure community
        </p>

        {/* Stats row */}
        <div className="hub-stats">
          <div className="hub-stat">
            <TrendingUp size={14} />
            <span>2 Apps</span>
          </div>
          <div className="hub-stat">
            <Star size={14} />
            <span>80+ SHF Figures</span>
          </div>
          <div className="hub-stat">
            <Sparkles size={14} />
            <span>AI Powered</span>
          </div>
        </div>
      </div>

      {/* App Cards */}
      <div className="hub-apps">
        {apps.map((app, i) => {
          const Icon = app.icon;
          return (
            <div
              key={app.id}
              className="hub-app-card"
              onClick={() => onNavigate(app.id)}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="hub-app-card-header">
                <div className="hub-app-icon" style={{ background: app.gradient }}>
                  <Icon size={28} color="white" />
                </div>
                <div className="hub-app-badge" style={{ background: app.badgeColor }}>
                  {app.badge}
                </div>
              </div>

              <h2 className="hub-app-title">{app.title}</h2>
              <p className="hub-app-subtitle">{app.subtitle}</p>
              <p className="hub-app-desc">{app.description}</p>

              <div className="hub-app-features">
                {app.features.map((f, j) => (
                  <span key={j} className="hub-app-feature-tag">{f}</span>
                ))}
              </div>

              <div className="hub-app-cta">
                <span>Open {app.title}</span>
                <ArrowRight size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="hub-footer">
        <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
        <span>Powered by AI • Built for Collectors</span>
      </div>
    </div>
  );
}
