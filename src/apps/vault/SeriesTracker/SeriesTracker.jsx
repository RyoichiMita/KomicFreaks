import {
  ArrowLeft,
  Package,
  ChevronRight,
  Check,
  Swords,
} from 'lucide-react';
import useVaultStore from '../../../stores/vaultStore';
import FigureImage from '../FigureImage';

export default function SeriesTracker() {
  const {
    seriesDefinitions,
    figures,
    goBack,
    getSeriesCompletion,
    openFigure,
    activeSeriesId,
    setActiveSeriesId,
    setVaultView,
    addToCollection,
    showNotification,
  } = useVaultStore();

  // If viewing a specific series
  if (activeSeriesId) {
    const series = seriesDefinitions.find(s => s.id === activeSeriesId);
    if (!series) return null;
    const completion = getSeriesCompletion(activeSeriesId);

    return (
      <div className="vault-series-detail">
        <div className="vault-view-header">
          <button className="vault-back-btn" onClick={() => setActiveSeriesId(null)}>
            <ArrowLeft size={18} />
          </button>
          <div className="vault-view-header-info">
            <h1 className="vault-view-title">{series.icon} {series.name}</h1>
            <span className="vault-view-count">{completion.owned}/{completion.total} collected</span>
          </div>
        </div>

        {/* Big progress ring */}
        <div className="vault-series-progress-hero">
          <div className="vault-series-ring" style={{
            '--progress': completion.percentage,
            '--ring-color': completion.percentage === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
          }}>
            <div className="vault-series-ring-inner">
              <span className="vault-series-ring-pct">{completion.percentage}%</span>
              <span className="vault-series-ring-label">Complete</span>
            </div>
          </div>
          {completion.percentage === 100 && (
            <div className="vault-series-complete-banner">
              🎉 Series Complete! You are a true collector!
            </div>
          )}
        </div>

        {/* Figures in set */}
        <div className="vault-series-figures">
          {series.requiredFigureIds.map(fid => {
            const fig = figures.find(f => f.id === fid);
            if (!fig) return null;
            const owned = completion.missing.indexOf(fid) === -1;

            return (
              <div
                key={fid}
                className={`vault-series-figure-item ${owned ? 'vault-series-figure-owned' : 'vault-series-figure-missing'}`}
                onClick={() => openFigure(fid)}
              >
                <FigureImage
                  figure={fig}
                  className="vault-series-figure-img"
                />
                <div className="vault-series-figure-info">
                  <div className="vault-series-figure-name">{fig.name}</div>
                  <div className="vault-series-figure-meta">${fig.msrpUsd}</div>
                </div>
                <div className="vault-series-figure-status">
                  {owned ? (
                    <div className="vault-series-check"><Check size={16} /></div>
                  ) : (
                    <button
                      className="vault-series-quest-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCollection({ figureId: fid, badge: 'quest' });
                        showNotification(`${fig.name} added as Quest 🗡️`, 'success');
                      }}
                    >
                      <Swords size={12} />
                      Quest
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Series list
  return (
    <div className="vault-series-list">
      <div className="vault-view-header">
        <button className="vault-back-btn" onClick={goBack}>
          <ArrowLeft size={18} />
        </button>
        <div className="vault-view-header-info">
          <h1 className="vault-view-title">Series Tracker</h1>
          <span className="vault-view-count">{seriesDefinitions.length} sets</span>
        </div>
      </div>

      <div className="vault-series-grid">
        {seriesDefinitions.map((series, i) => {
          const completion = getSeriesCompletion(series.id);
          return (
            <div
              key={series.id}
              className="vault-series-card"
              onClick={() => setActiveSeriesId(series.id)}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="vault-series-card-top">
                <span className="vault-series-card-icon">{series.icon}</span>
                <div className="vault-series-card-info">
                  <h3 className="vault-series-card-name">{series.name}</h3>
                  <p className="vault-series-card-desc">{series.description}</p>
                </div>
                <ChevronRight size={16} className="vault-series-card-arrow" />
              </div>
              <div className="vault-series-progress-bar-wrap">
                <div className="vault-series-progress-bar">
                  <div
                    className="vault-series-progress-fill"
                    style={{
                      width: `${completion.percentage}%`,
                      background: completion.percentage === 100
                        ? 'var(--accent-success)'
                        : 'var(--gradient-primary)',
                    }}
                  />
                </div>
                <span className="vault-series-progress-text">
                  {completion.owned}/{completion.total}
                  {completion.percentage === 100 && ' ✅'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
