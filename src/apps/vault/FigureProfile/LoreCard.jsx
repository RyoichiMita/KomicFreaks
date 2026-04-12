import { useState, useEffect } from 'react';
import {
  Sparkles,
  Scroll,
  Swords,
  Zap,
  Trophy,
  Quote,
  Star,
  Loader,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { generateLoreCard, isLoreCached, isAIConfigured } from '../../../services/aiService';

/**
 * AI Figure Lore Card — A collapsible, AI-generated character encyclopedia
 * card that appears inside the FigureProfile view.
 */
export default function LoreCard({ figure }) {
  const [lore, setLore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [isCached, setIsCached] = useState(false);

  const aiConfigured = isAIConfigured();

  useEffect(() => {
    // Check if we already have a cached result for this figure
    setIsCached(isLoreCached(figure.id));
    // Reset state when figure changes
    setLore(null);
    setError(null);
    setStatus('');
    setLoading(false);
  }, [figure.id]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setLore(null);

    try {
      const result = await generateLoreCard(figure, setStatus);
      setLore(result);
      setIsCached(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleRegenerate = async () => {
    // Clear cache for this figure and regenerate
    try {
      const key = `kf_ai_cache_lore_${figure.id}`;
      localStorage.removeItem(key);
      setIsCached(false);
    } catch {
      // ignore
    }
    await handleGenerate();
  };

  // Not generated yet — show trigger button
  if (!lore && !loading && !error) {
    return (
      <div className="vault-lore-trigger">
        <button
          className="vault-lore-trigger-btn"
          onClick={handleGenerate}
          disabled={!aiConfigured}
          title={!aiConfigured ? 'Set VITE_OPENAI_API_KEY in .env to enable AI' : ''}
        >
          <Sparkles size={18} />
          <div className="vault-lore-trigger-text">
            <span className="vault-lore-trigger-title">
              {isCached ? 'View Fighter Dossier' : 'Unleash Fighter Dossier'}
            </span>
            <span className="vault-lore-trigger-sub">
              {!aiConfigured
                ? 'OpenAI API key required'
                : isCached
                ? 'Cached — loads instantly ⚡'
                : 'Powers, saga history & battle intel'}
            </span>
          </div>
          {isCached && <span className="vault-lore-cached-badge">Cached</span>}
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="vault-lore-card vault-lore-card-loading">
        <div className="vault-lore-loading-content">
          <Loader size={24} className="vault-lore-spinner" />
          <span className="vault-lore-loading-status">{status || 'Generating lore...'}</span>
        </div>
        <div className="vault-lore-loading-bar">
          <div className="vault-lore-loading-bar-fill" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="vault-lore-card vault-lore-card-error">
        <div className="vault-lore-error-content">
          <AlertCircle size={20} />
          <div>
            <p className="vault-lore-error-msg">{error}</p>
            <button className="vault-lore-retry-btn" onClick={handleGenerate}>
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lore card populated
  if (!lore) return null;

  return (
    <div className="vault-lore-card">
      {/* Header */}
      <div
        className="vault-lore-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="vault-lore-header-left">
          <Sparkles size={16} className="vault-lore-icon" />
          <h3 className="vault-lore-title">Fighter Dossier</h3>
          <span className="vault-lore-ai-badge">GPT</span>
        </div>
        <div className="vault-lore-header-right">
          <button
            className="vault-lore-regen-btn"
            onClick={(e) => { e.stopPropagation(); handleRegenerate(); }}
            title="Regenerate lore"
          >
            <RefreshCw size={12} />
          </button>
          <button
            className="vault-lore-close-btn"
            onClick={(e) => { e.stopPropagation(); setLore(null); }}
            title="Close lore card"
          >
            <X size={14} />
          </button>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="vault-lore-body">
          {/* Identity Row */}
          <div className="vault-lore-identity">
            <h2 className="vault-lore-char-name">{lore.characterName}</h2>
            {lore.alias && (
              <span className="vault-lore-alias">"{lore.alias}"</span>
            )}
            <div className="vault-lore-meta-tags">
              {lore.race && (
                <span className="vault-lore-meta-tag vault-lore-tag-race">
                  {lore.race}
                </span>
              )}
              {lore.firstAppearance && (
                <span className="vault-lore-meta-tag vault-lore-tag-debut">
                  {lore.firstAppearance}
                </span>
              )}
            </div>
          </div>

          {/* Power Level */}
          {lore.powerLevel && (
            <div className="vault-lore-power">
              <div className="vault-lore-power-header">
                <Zap size={14} />
                <span>Power Level</span>
              </div>
              <div className="vault-lore-power-value">{lore.powerLevel}</div>
            </div>
          )}

          {/* Signature Moves */}
          {lore.signature_moves?.length > 0 && (
            <div className="vault-lore-section">
              <div className="vault-lore-section-header">
                <Swords size={14} />
                <span>Signature Moves</span>
              </div>
              <div className="vault-lore-moves">
                {lore.signature_moves.map((move, i) => (
                  <span key={i} className="vault-lore-move-tag">{move}</span>
                ))}
              </div>
            </div>
          )}

          {/* Lore / Backstory */}
          {lore.lore && (
            <div className="vault-lore-section">
              <div className="vault-lore-section-header">
                <Scroll size={14} />
                <span>Character Lore</span>
              </div>
              <p className="vault-lore-text">{lore.lore}</p>
            </div>
          )}

          {/* Rivalries */}
          {lore.rivalries?.length > 0 && (
            <div className="vault-lore-section">
              <div className="vault-lore-section-header">
                <Trophy size={14} />
                <span>Key Rivalries</span>
              </div>
              <div className="vault-lore-rivals">
                {lore.rivalries.map((rival, i) => (
                  <span key={i} className="vault-lore-rival-tag">{rival}</span>
                ))}
              </div>
            </div>
          )}

          {/* Fun Facts */}
          {lore.funFacts?.length > 0 && (
            <div className="vault-lore-section">
              <div className="vault-lore-section-header">
                <Star size={14} />
                <span>Fun Facts</span>
              </div>
              <ul className="vault-lore-facts">
                {lore.funFacts.map((fact, i) => (
                  <li key={i} className="vault-lore-fact">{fact}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Iconic Quote */}
          {lore.quote && (
            <div className="vault-lore-quote">
              <Quote size={16} className="vault-lore-quote-icon" />
              <blockquote>{lore.quote}</blockquote>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
