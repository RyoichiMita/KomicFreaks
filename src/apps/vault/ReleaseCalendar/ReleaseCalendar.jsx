import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import useVaultStore from '../../../stores/vaultStore';

function getCountdown(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, mins };
}

export default function ReleaseCalendar() {
  const { figures, goBack, openFigure } = useVaultStore();
  const [, setTick] = useState(0);

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sort all figures by release date
  const upcoming = figures
    .filter(f => f.status === 'pre_order' || f.status === 'announced')
    .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

  const recent = figures
    .filter(f => f.status === 'released')
    .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
    .slice(0, 12);

  return (
    <div className="vault-calendar">
      <div className="vault-view-header">
        <button className="vault-back-btn" onClick={goBack}>
          <ArrowLeft size={18} />
        </button>
        <div className="vault-view-header-info">
          <h1 className="vault-view-title">Release Calendar</h1>
          <span className="vault-view-count">{upcoming.length} upcoming</span>
        </div>
      </div>

      {/* Upcoming with Countdowns */}
      {upcoming.length > 0 && (
        <div className="vault-section">
          <h2 className="vault-section-title">
            <Clock size={18} /> Coming Soon
          </h2>
          <div className="vault-calendar-list">
            {upcoming.map(fig => {
              const countdown = getCountdown(fig.releaseDate);
              return (
                <div
                  key={fig.id}
                  className="vault-calendar-item vault-calendar-item-upcoming"
                  onClick={() => openFigure(fig.id)}
                >
                  <img
                    src={fig.imageUrl}
                    alt={fig.name}
                    className="vault-calendar-img"
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                  <div className="vault-calendar-info">
                    <div className="vault-calendar-name">{fig.name}</div>
                    <div className="vault-calendar-line">{fig.line}</div>
                    <div className="vault-calendar-date">
                      <Calendar size={12} />
                      {new Date(fig.releaseDate).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                  {countdown && (
                    <div className="vault-countdown">
                      <div className="vault-countdown-unit">
                        <span className="vault-countdown-num">{countdown.days}</span>
                        <span className="vault-countdown-label">days</span>
                      </div>
                      <div className="vault-countdown-unit">
                        <span className="vault-countdown-num">{countdown.hours}</span>
                        <span className="vault-countdown-label">hrs</span>
                      </div>
                      <div className="vault-countdown-unit">
                        <span className="vault-countdown-num">{countdown.mins}</span>
                        <span className="vault-countdown-label">min</span>
                      </div>
                    </div>
                  )}
                  <div className={`vault-calendar-status vault-calendar-status-${fig.status}`}>
                    {fig.status === 'pre_order' ? 'PRE-ORDER' : 'ANNOUNCED'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Releases */}
      <div className="vault-section">
        <h2 className="vault-section-title">
          <Calendar size={18} /> Recent Releases
        </h2>
        <div className="vault-calendar-list">
          {recent.map(fig => (
            <div
              key={fig.id}
              className="vault-calendar-item"
              onClick={() => openFigure(fig.id)}
            >
              <img
                src={fig.imageUrl}
                alt={fig.name}
                className="vault-calendar-img"
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
              <div className="vault-calendar-info">
                <div className="vault-calendar-name">{fig.name}</div>
                <div className="vault-calendar-line">{fig.line}</div>
                <div className="vault-calendar-date">
                  <Calendar size={12} />
                  {new Date(fig.releaseDate).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
              <div className="vault-calendar-price">${fig.msrpUsd}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
