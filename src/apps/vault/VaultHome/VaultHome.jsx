import {
  Search,
  Archive,
  Trophy,
  Swords,
  Calendar,
  ChevronRight,
  BarChart3,
  Package,
} from 'lucide-react';
import useVaultStore from '../../../stores/vaultStore';

// Franchise metadata for the grid
const FRANCHISE_META = {
  'Dragon Ball': {
    icon: '🐉',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    description: 'Dragon Ball Z, Super, GT & DAIMA',
  },
  'Naruto': {
    icon: '🍥',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    description: 'Naruto Shippuden & Boruto',
  },
  'One Piece': {
    icon: '🏴‍☠️',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    description: 'Straw Hat Pirates & more',
  },
  'Marvel': {
    icon: '🦸',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #3b82f6 100%)',
    description: 'Avengers, Spider-Man & X-Men',
  },
  'Star Wars': {
    icon: '⚔️',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #fbbf24 100%)',
    description: 'Original Trilogy & Prequel',
  },
};

export default function VaultHome() {
  const {
    figures,
    collection,
    searchQuery,
    setSearchQuery,
    setVaultView,
    openFranchise,
    openFigure,
    getCollectionCount,
    getCollectionValue,
    getGrailCount,
    getQuestCount,
    seriesDefinitions,
    getSeriesCompletion,
  } = useVaultStore();

  // Get franchise counts
  const franchiseCounts = {};
  figures.forEach(f => {
    franchiseCounts[f.franchise] = (franchiseCounts[f.franchise] || 0) + 1;
  });
  const franchises = Object.keys(franchiseCounts);

  // Search results (live)
  const searchResults = searchQuery.length > 1
    ? figures.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.line.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  // Recent additions (coming soon / pre-orders)
  const upcoming = figures
    .filter(f => f.status === 'pre_order' || f.status === 'announced')
    .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))
    .slice(0, 4);

  // Latest releases
  const latest = figures
    .filter(f => f.status === 'released')
    .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
    .slice(0, 6);

  return (
    <div className="vault-home">
      {/* Hero Stats */}
      <div className="vault-hero-stats">
        <div className="vault-stat-card vault-stat-collection">
          <div className="vault-stat-icon">
            <Archive size={20} />
          </div>
          <div className="vault-stat-info">
            <div className="vault-stat-value">{getCollectionCount()}</div>
            <div className="vault-stat-label">In Vault</div>
          </div>
        </div>
        <div className="vault-stat-card vault-stat-value-card">
          <div className="vault-stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="vault-stat-info">
            <div className="vault-stat-value">${getCollectionValue().toFixed(0)}</div>
            <div className="vault-stat-label">Est. Value</div>
          </div>
        </div>
        <div className="vault-stat-card vault-stat-grails">
          <div className="vault-stat-icon">
            <Trophy size={20} />
          </div>
          <div className="vault-stat-info">
            <div className="vault-stat-value">{getGrailCount()}</div>
            <div className="vault-stat-label">Grails</div>
          </div>
        </div>
        <div className="vault-stat-card vault-stat-quests">
          <div className="vault-stat-icon">
            <Swords size={20} />
          </div>
          <div className="vault-stat-info">
            <div className="vault-stat-value">{getQuestCount()}</div>
            <div className="vault-stat-label">Quests</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="vault-search-section">
        <div className="vault-search-bar">
          <Search size={18} />
          <input
            type="text"
            className="vault-search-input"
            placeholder="Search S.H. Figuarts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="vault-search-results">
            {searchResults.map(fig => (
              <div
                key={fig.id}
                className="vault-search-result"
                onClick={() => { setSearchQuery(''); openFigure(fig.id); }}
              >
                <img
                  src={fig.imageUrl}
                  alt={fig.name}
                  className="vault-search-result-img"
                  onError={(e) => { e.target.src = '/logo.png'; }}
                />
                <div className="vault-search-result-info">
                  <div className="vault-search-result-name">{fig.name}</div>
                  <div className="vault-search-result-line">{fig.line} • {fig.arc}</div>
                </div>
                <ChevronRight size={14} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="vault-quick-actions">
        <button className="vault-quick-btn" onClick={() => setVaultView('myVault')}>
          <Archive size={18} />
          <span>My Vault</span>
        </button>
        <button className="vault-quick-btn" onClick={() => setVaultView('series')}>
          <Package size={18} />
          <span>Series Tracker</span>
        </button>
        <button className="vault-quick-btn" onClick={() => setVaultView('calendar')}>
          <Calendar size={18} />
          <span>Releases</span>
        </button>
      </div>

      {/* Franchises Grid */}
      <div className="vault-section">
        <div className="vault-section-header">
          <h2 className="vault-section-title">Browse by Franchise</h2>
        </div>
        <div className="vault-franchise-grid">
          {franchises.map((franchise, i) => {
            const meta = FRANCHISE_META[franchise] || {
              icon: '📦',
              gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)',
              description: franchise,
            };
            const count = franchiseCounts[franchise];
            const ownedCount = collection.filter(c => {
              const fig = figures.find(f => f.id === c.figureId);
              return fig && fig.franchise === franchise;
            }).length;

            return (
              <div
                key={franchise}
                className="vault-franchise-card"
                onClick={() => openFranchise(franchise)}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="vault-franchise-bg" style={{ background: meta.gradient }} />
                <div className="vault-franchise-content">
                  <span className="vault-franchise-icon">{meta.icon}</span>
                  <h3 className="vault-franchise-name">{franchise}</h3>
                  <p className="vault-franchise-desc">{meta.description}</p>
                  <div className="vault-franchise-meta">
                    <span>{count} figures</span>
                    {ownedCount > 0 && (
                      <span className="vault-franchise-owned">✅ {ownedCount} owned</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="vault-franchise-arrow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest Releases */}
      {latest.length > 0 && (
        <div className="vault-section">
          <div className="vault-section-header">
            <h2 className="vault-section-title">Latest Releases</h2>
          </div>
          <div className="vault-figure-scroll">
            {latest.map(fig => (
              <div
                key={fig.id}
                className="vault-figure-card-mini"
                onClick={() => openFigure(fig.id)}
              >
                <div className="vault-figure-card-mini-img-wrap">
                  <img
                    src={fig.imageUrl}
                    alt={fig.name}
                    className="vault-figure-card-mini-img"
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                  {collection.some(c => c.figureId === fig.id) && (
                    <div className="vault-figure-owned-badge">✅</div>
                  )}
                </div>
                <div className="vault-figure-card-mini-name">{fig.name}</div>
                <div className="vault-figure-card-mini-price">${fig.msrpUsd}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
