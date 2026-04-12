import { useState } from 'react';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  X,
} from 'lucide-react';
import useVaultStore from '../../../stores/vaultStore';
import FigureImage from '../FigureImage';

const RELEASE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'general', label: 'General Release' },
  { value: 'premium_bandai', label: 'Premium Bandai' },
  { value: 'event_exclusive', label: 'Event Exclusive' },
  { value: 'store_exclusive', label: 'Store Exclusive' },
  { value: 'best_selection', label: 'Best Selection' },
  { value: 'premium_color', label: 'Premium Color' },
];

const SORT_OPTIONS = [
  { value: 'franchise', label: 'Default' },
  { value: 'releaseDate', label: 'Release Date' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price', label: 'Price' },
];

const RELEASE_TYPE_LABELS = {
  general: 'General',
  premium_bandai: 'P-Bandai',
  event_exclusive: 'Event',
  store_exclusive: 'Store',
  best_selection: 'Best Sel.',
  premium_color: 'Premium',
};

export default function FranchiseView() {
  const {
    activeFranchise,
    getFilteredFigures,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterReleaseType,
    setFilterReleaseType,
    filterArc,
    setFilterArc,
    getUniqueArcs,
    goBack,
    openFigure,
    collection,
  } = useVaultStore();

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const figures = getFilteredFigures();
  const arcs = getUniqueArcs();

  const handleClearFilters = () => {
    setFilterReleaseType('all');
    setFilterArc('all');
    setSearchQuery('');
  };

  const hasActiveFilters = filterReleaseType !== 'all' || filterArc !== 'all' || searchQuery;

  return (
    <div className="vault-franchise-view">
      {/* Header */}
      <div className="vault-view-header">
        <button className="vault-back-btn" onClick={goBack}>
          <ArrowLeft size={18} />
        </button>
        <div className="vault-view-header-info">
          <h1 className="vault-view-title">{activeFranchise}</h1>
          <span className="vault-view-count">{figures.length} figures</span>
        </div>
        <div className="vault-view-header-actions">
          <button
            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="vault-filter-bar">
        <div className="vault-search-bar vault-search-bar-sm">
          <Search size={16} />
          <input
            type="text"
            className="vault-search-input"
            placeholder="Search figures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="vault-search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <button
          className={`vault-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} />
          {hasActiveFilters && <span className="vault-filter-dot" />}
        </button>

        <div className="vault-sort-select-wrap">
          <select
            className="vault-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="vault-sort-chevron" />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="vault-filter-panel">
          <div className="vault-filter-group">
            <label className="vault-filter-label">Release Type</label>
            <div className="vault-filter-chips">
              {RELEASE_TYPES.map(rt => (
                <button
                  key={rt.value}
                  className={`vault-filter-chip ${filterReleaseType === rt.value ? 'active' : ''}`}
                  onClick={() => setFilterReleaseType(rt.value)}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="vault-filter-group">
            <label className="vault-filter-label">Story Arc</label>
            <div className="vault-filter-chips">
              <button
                className={`vault-filter-chip ${filterArc === 'all' ? 'active' : ''}`}
                onClick={() => setFilterArc('all')}
              >
                All Arcs
              </button>
              {arcs.map(arc => (
                <button
                  key={arc}
                  className={`vault-filter-chip ${filterArc === arc ? 'active' : ''}`}
                  onClick={() => setFilterArc(arc)}
                >
                  {arc}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button className="vault-clear-filters" onClick={handleClearFilters}>
              <X size={14} />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Figure Grid / List */}
      {figures.length === 0 ? (
        <div className="vault-empty-state">
          <Search size={48} />
          <p>No figures found matching your filters</p>
          <button className="btn btn-secondary" onClick={handleClearFilters}>Clear Filters</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="vault-figure-grid">
          {figures.map((fig, i) => {
            const owned = collection.some(c => c.figureId === fig.id);
            const entry = collection.find(c => c.figureId === fig.id);
            return (
              <div
                key={fig.id}
                className={`vault-figure-card ${owned ? 'vault-figure-card-owned' : 'vault-figure-card-unowned'}`}
                onClick={() => openFigure(fig.id)}
                style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}
              >
                <div className="vault-figure-card-img-wrap">
                  <FigureImage
                    figure={fig}
                    className="vault-figure-card-img"
                  />
                  {owned && entry && (
                    <div className={`vault-badge-indicator vault-badge-${entry.badge}`}>
                      {entry.badge === 'grail' ? '🏆' : entry.badge === 'quest' ? '🗡️' : '✅'}
                    </div>
                  )}
                  {/* Army Builder quantity badge */}
                  {owned && entry && (entry.quantity || 1) > 1 && (
                    <div className="vault-quantity-badge">x{entry.quantity}</div>
                  )}
                  {/* Display status indicator */}
                  {owned && entry && entry.displayStatus && entry.displayStatus !== 'display' && (
                    <div className={`vault-status-indicator vault-status-${entry.displayStatus}`}>
                      {entry.displayStatus === 'storage' ? '📦' : '💰'}
                    </div>
                  )}
                  {fig.releaseType !== 'general' && (
                    <div className="vault-release-type-tag">
                      {RELEASE_TYPE_LABELS[fig.releaseType] || fig.releaseType}
                    </div>
                  )}
                </div>
                <div className="vault-figure-card-info">
                  <div className="vault-figure-card-name">{fig.name}</div>
                  <div className="vault-figure-card-meta">
                    <span>{fig.arc}</span>
                    <span>${fig.msrpUsd}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="vault-figure-list">
          {figures.map((fig, i) => {
            const owned = collection.some(c => c.figureId === fig.id);
            const entry = collection.find(c => c.figureId === fig.id);
            return (
              <div
                key={fig.id}
                className={`vault-figure-list-item ${owned ? 'vault-figure-list-item-owned' : ''}`}
                onClick={() => openFigure(fig.id)}
              >
                <FigureImage
                  figure={fig}
                  className="vault-figure-list-img"
                />
                <div className="vault-figure-list-info">
                  <div className="vault-figure-list-name">{fig.name}</div>
                  <div className="vault-figure-list-meta">
                    {fig.line} • {fig.arc} • {fig.bodySpec} body
                  </div>
                </div>
                <div className="vault-figure-list-right">
                  <div className="vault-figure-list-price">${fig.msrpUsd}</div>
                  {owned && entry && (
                    <span className="vault-figure-list-badge">
                      {entry.badge === 'grail' ? '🏆' : entry.badge === 'quest' ? '🗡️' : '✅'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
