import {
  ArrowLeft,
  Archive,
  Trophy,
  Swords,
  Check,
  BarChart3,
  Filter,
} from 'lucide-react';
import { useState } from 'react';
import useVaultStore from '../../../stores/vaultStore';
import FigureImage from '../FigureImage';

export default function MyVault() {
  const {
    collection,
    figures,
    goBack,
    openFigure,
    getCollectionCount,
    getCollectionValue,
    getGrailCount,
    getQuestCount,
    setVaultView,
  } = useVaultStore();

  const [filterBadge, setFilterBadge] = useState('all'); // 'all' | 'owned' | 'quest' | 'grail'

  const filteredCollection = filterBadge === 'all'
    ? collection
    : collection.filter(c => c.badge === filterBadge);

  // Get figure details for each collection entry
  const collectionFigures = filteredCollection
    .map(entry => ({
      ...entry,
      figure: figures.find(f => f.id === entry.figureId),
    }))
    .filter(e => e.figure)
    .sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div className="vault-my-vault">
      {/* Header */}
      <div className="vault-view-header">
        <button className="vault-back-btn" onClick={goBack}>
          <ArrowLeft size={18} />
        </button>
        <div className="vault-view-header-info">
          <h1 className="vault-view-title">My Vault</h1>
          <span className="vault-view-count">{getCollectionCount()} figures</span>
        </div>
      </div>

      {/* Stats */}
      <div className="vault-my-vault-stats">
        <div className="vault-mini-stat">
          <BarChart3 size={14} />
          <span>${getCollectionValue().toFixed(0)}</span>
        </div>
        <div className="vault-mini-stat vault-mini-stat-grail">
          <Trophy size={14} />
          <span>{getGrailCount()} Grails</span>
        </div>
        <div className="vault-mini-stat vault-mini-stat-quest">
          <Swords size={14} />
          <span>{getQuestCount()} Quests</span>
        </div>
      </div>

      {/* Badge Filter */}
      <div className="vault-badge-filter">
        <button
          className={`vault-badge-filter-btn ${filterBadge === 'all' ? 'active' : ''}`}
          onClick={() => setFilterBadge('all')}
        >
          All ({collection.length})
        </button>
        <button
          className={`vault-badge-filter-btn ${filterBadge === 'owned' ? 'active' : ''}`}
          onClick={() => setFilterBadge('owned')}
        >
          ✅ Owned
        </button>
        <button
          className={`vault-badge-filter-btn ${filterBadge === 'quest' ? 'active' : ''}`}
          onClick={() => setFilterBadge('quest')}
        >
          🗡️ Quest
        </button>
        <button
          className={`vault-badge-filter-btn ${filterBadge === 'grail' ? 'active' : ''}`}
          onClick={() => setFilterBadge('grail')}
        >
          🏆 Grail
        </button>
      </div>

      {/* Collection Grid */}
      {collectionFigures.length === 0 ? (
        <div className="vault-empty-state">
          <Archive size={48} />
          <h3>Your vault is empty</h3>
          <p>Browse the catalog and add figures to start building your digital shelf</p>
          <button className="btn btn-primary" onClick={goBack}>
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="vault-figure-grid">
          {collectionFigures.map(({ figure, badge, condition, purchasePrice, currency }, i) => (
            <div
              key={figure.id}
              className="vault-figure-card vault-figure-card-owned"
              onClick={() => openFigure(figure.id)}
              style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}
            >
              <div className="vault-figure-card-img-wrap">
                <FigureImage
                  figure={figure}
                  className="vault-figure-card-img"
                />
                <div className={`vault-badge-indicator vault-badge-${badge}`}>
                  {badge === 'grail' ? '🏆' : badge === 'quest' ? '🗡️' : '✅'}
                </div>
              </div>
              <div className="vault-figure-card-info">
                <div className="vault-figure-card-name">{figure.name}</div>
                <div className="vault-figure-card-meta">
                  <span className="vault-condition-tag">{condition?.toUpperCase()}</span>
                  {purchasePrice > 0 && (
                    <span>{currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : currency === 'EUR' ? '€' : '$'}{purchasePrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
