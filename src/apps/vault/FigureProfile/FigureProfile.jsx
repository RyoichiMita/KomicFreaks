import { useState } from 'react';
import {
  ArrowLeft,
  ShoppingCart,
  Trophy,
  Swords,
  Check,
  Calendar,
  Tag,
  Cpu,
  Package,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  X,
  Star,
} from 'lucide-react';
import useVaultStore from '../../../stores/vaultStore';
import FigureImage from '../FigureImage';
import LoreCard from './LoreCard';

const CONDITION_OPTIONS = [
  { value: 'misb', label: 'MISB (Mint in Sealed Box)' },
  { value: 'mint_open', label: 'Mint (Opened)' },
  { value: 'displayed', label: 'Displayed' },
  { value: 'loose', label: 'Loose' },
  { value: 'no_box', label: 'No Box' },
  { value: 'box_damage', label: 'Box Damage' },
];

const BOX_CONDITION_OPTIONS = [
  { value: 'mint', label: 'Mint' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'damaged', label: 'Damaged' },
];

const BADGE_OPTIONS = [
  { value: 'owned', label: 'Owned', icon: '✅', color: 'var(--accent-success)' },
  { value: 'quest', label: 'Quest', icon: '🗡️', color: 'var(--accent-tertiary)' },
  { value: 'grail', label: 'Grail', icon: '🏆', color: 'var(--accent-warning)' },
];

const RELEASE_TYPE_COLORS = {
  general: 'var(--accent-success)',
  premium_bandai: 'var(--accent-primary)',
  event_exclusive: 'var(--accent-secondary)',
  store_exclusive: 'var(--accent-tertiary)',
  best_selection: 'var(--accent-warning)',
  premium_color: '#c084fc',
};

const RELEASE_TYPE_LABELS = {
  general: 'General Release',
  premium_bandai: 'Premium Bandai',
  event_exclusive: 'Event Exclusive',
  store_exclusive: 'Store Exclusive',
  best_selection: 'Best Selection',
  premium_color: 'Premium Color Edition',
};

export default function FigureProfile() {
  const {
    activeFigureId,
    figures,
    goBack,
    isInCollection,
    getCollectionEntry,
    addToCollection,
    removeFromCollection,
    updateCollectionItem,
    showNotification,
  } = useVaultStore();

  const figure = figures.find(f => f.id === activeFigureId);
  const inCollection = isInCollection(activeFigureId);
  const collectionEntry = getCollectionEntry(activeFigureId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);

  // Form state
  const [formCondition, setFormCondition] = useState('misb');
  const [formBoxCondition, setFormBoxCondition] = useState('mint');
  const [formShipperBox, setFormShipperBox] = useState(false);
  const [formPrice, setFormPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formBadge, setFormBadge] = useState('owned');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formDisplayStatus, setFormDisplayStatus] = useState('display');
  const [formStorageLocation, setFormStorageLocation] = useState('');

  if (!figure) return null;

  const handleAdd = async () => {
    await addToCollection({
      figureId: figure.id,
      condition: formCondition,
      boxCondition: formBoxCondition,
      hasShipperBox: formShipperBox,
      purchasePrice: parseFloat(formPrice) || 0,
      currency: formCurrency,
      dateAcquired: formDate,
      notes: formNotes,
      badge: formBadge,
      quantity: formQuantity,
      displayStatus: formDisplayStatus,
      storageLocation: formStorageLocation,
    });
    setShowAddForm(false);
    showNotification(`${figure.name} added to vault! ${BADGE_OPTIONS.find(b => b.value === formBadge)?.icon}`, 'success');
  };

  const handleRemove = async () => {
    await removeFromCollection(figure.id);
    showNotification(`${figure.name} removed from vault`, 'info');
  };

  const handleBadgeChange = async (badge) => {
    await updateCollectionItem(figure.id, { badge });
    showNotification(`Badge updated to ${BADGE_OPTIONS.find(b => b.value === badge)?.icon} ${badge}`, 'success');
  };

  return (
    <div className="vault-figure-profile">
      {/* Header */}
      <div className="vault-view-header">
        <button className="vault-back-btn" onClick={goBack}>
          <ArrowLeft size={18} />
        </button>
        <div className="vault-view-header-info">
          <h1 className="vault-view-title vault-view-title-sm">{figure.name}</h1>
          <span className="vault-view-count">{figure.line}</span>
        </div>
      </div>

      <div className="vault-figure-profile-content">
        {/* Gallery */}
        <div className="vault-gallery">
          <div className="vault-gallery-main">
            <FigureImage
              figure={{ ...figure, imageUrl: figure.galleryUrls?.[activeGalleryIdx] || figure.imageUrl }}
              className="vault-gallery-img"
            />
            {inCollection && collectionEntry && (
              <div className={`vault-profile-badge vault-badge-${collectionEntry.badge}`}>
                {BADGE_OPTIONS.find(b => b.value === collectionEntry.badge)?.icon}
                {collectionEntry.badge}
              </div>
            )}
          </div>
          {figure.galleryUrls?.length > 1 && (
            <div className="vault-gallery-thumbs">
              {figure.galleryUrls.map((url, i) => (
                <FigureImage
                  key={i}
                  figure={{ ...figure, imageUrl: url }}
                  className={`vault-gallery-thumb ${i === activeGalleryIdx ? 'active' : ''}`}
                  onClick={() => setActiveGalleryIdx(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="vault-figure-details">
          {/* Release type badge */}
          <div
            className="vault-detail-release-badge"
            style={{ background: RELEASE_TYPE_COLORS[figure.releaseType] }}
          >
            {RELEASE_TYPE_LABELS[figure.releaseType]}
          </div>

          {/* Specs grid */}
          <div className="vault-specs-grid">
            <div className="vault-spec">
              <Tag size={14} />
              <div>
                <div className="vault-spec-label">MSRP</div>
                <div className="vault-spec-value">${figure.msrpUsd} / ¥{figure.msrp}</div>
              </div>
            </div>
            <div className="vault-spec">
              <Calendar size={14} />
              <div>
                <div className="vault-spec-label">Release Date</div>
                <div className="vault-spec-value">
                  {new Date(figure.releaseDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="vault-spec">
              <Cpu size={14} />
              <div>
                <div className="vault-spec-label">Body Spec</div>
                <div className="vault-spec-value">{figure.bodySpec} Joint System</div>
              </div>
            </div>
            <div className="vault-spec">
              <Star size={14} />
              <div>
                <div className="vault-spec-label">Story Arc</div>
                <div className="vault-spec-value">{figure.arc}</div>
              </div>
            </div>
          </div>

          {/* Accessories */}
          <div className="vault-detail-section">
            <div
              className="vault-detail-section-header"
              onClick={() => {}}
            >
              <h3><Package size={16} /> Accessories</h3>
            </div>
            <ul className="vault-accessory-list">
              {figure.accessories.map((acc, i) => (
                <li key={i} className="vault-accessory-item">
                  <Check size={12} />
                  <span>{acc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Authenticity */}
          {figure.authenticity && (
            <div className="vault-detail-section">
              <div
                className="vault-detail-section-header vault-detail-section-toggle"
                onClick={() => setShowAuth(!showAuth)}
              >
                <h3><ShieldCheck size={16} /> Authenticity Guide</h3>
                {showAuth ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {showAuth && (
                <div className="vault-auth-details">
                  <div className="vault-auth-item">
                    <span className="vault-auth-label">Sticker</span>
                    <span>{figure.authenticity.stickerType}</span>
                  </div>
                  <div className="vault-auth-item">
                    <span className="vault-auth-label">Box</span>
                    <span>{figure.authenticity.boxTips}</span>
                  </div>
                  <div className="vault-auth-item">
                    <span className="vault-auth-label">Joints</span>
                    <span>{figure.authenticity.jointColor}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Lore Card */}
          <LoreCard figure={figure} />

          {/* Buy Link */}
          {figure.amazonUrl && (
            <a
              href={figure.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vault-buy-link"
            >
              <ShoppingCart size={16} />
              Buy on Amazon
              <ExternalLink size={12} />
            </a>
          )}

          {/* Collection Actions */}
          <div className="vault-collection-actions">
            {inCollection ? (
              <>
                {/* Badge Switcher */}
                <div className="vault-badge-switcher">
                  {BADGE_OPTIONS.map(b => (
                    <button
                      key={b.value}
                      className={`vault-badge-btn ${collectionEntry?.badge === b.value ? 'active' : ''}`}
                      onClick={() => handleBadgeChange(b.value)}
                      style={{ '--badge-color': b.color }}
                    >
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>
                <button className="vault-remove-btn" onClick={handleRemove}>
                  <X size={14} />
                  Remove from Vault
                </button>
              </>
            ) : (
              <button className="vault-add-btn" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus size={18} />
                Add to Vault
              </button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && !inCollection && (
            <div className="vault-add-form">
              <h3 className="vault-add-form-title">Add to Your Vault</h3>

              {/* Badge Selection */}
              <div className="vault-form-group">
                <label className="vault-form-label">Badge</label>
                <div className="vault-badge-switcher">
                  {BADGE_OPTIONS.map(b => (
                    <button
                      key={b.value}
                      className={`vault-badge-btn ${formBadge === b.value ? 'active' : ''}`}
                      onClick={() => setFormBadge(b.value)}
                      style={{ '--badge-color': b.color }}
                    >
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="vault-form-group">
                <label className="vault-form-label">Condition</label>
                <select
                  className="vault-form-select"
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                >
                  {CONDITION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Box Condition */}
              <div className="vault-form-group">
                <label className="vault-form-label">Box Condition</label>
                <select
                  className="vault-form-select"
                  value={formBoxCondition}
                  onChange={(e) => setFormBoxCondition(e.target.value)}
                >
                  {BOX_CONDITION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Shipper Box */}
              <div className="vault-form-group vault-form-checkbox-group">
                <input
                  type="checkbox"
                  id="shipperBox"
                  checked={formShipperBox}
                  onChange={(e) => setFormShipperBox(e.target.checked)}
                />
                <label htmlFor="shipperBox">Has Brown Shipper Box</label>
              </div>

              {/* Purchase Price */}
              <div className="vault-form-row">
                <div className="vault-form-group" style={{ flex: 2 }}>
                  <label className="vault-form-label">Purchase Price</label>
                  <input
                    type="number"
                    className="vault-form-input"
                    placeholder="0.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>
                <div className="vault-form-group" style={{ flex: 1 }}>
                  <label className="vault-form-label">Currency</label>
                  <select
                    className="vault-form-select"
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="vault-form-group">
                <label className="vault-form-label">Date Acquired</label>
                <input
                  type="date"
                  className="vault-form-input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="vault-form-group">
                <label className="vault-form-label">Notes (missing parts, etc.)</label>
                <textarea
                  className="vault-form-textarea"
                  placeholder="Any notes about this figure..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Quantity (Army Builder) */}
              <div className="vault-form-group">
                <label className="vault-form-label">Quantity (Army Builder)</label>
                <div className="vault-quantity-control">
                  <button
                    className="vault-qty-btn"
                    onClick={() => setFormQuantity(Math.max(1, formQuantity - 1))}
                  >−</button>
                  <span className="vault-qty-value">{formQuantity}</span>
                  <button
                    className="vault-qty-btn"
                    onClick={() => setFormQuantity(formQuantity + 1)}
                  >+</button>
                </div>
              </div>

              {/* Display Status */}
              <div className="vault-form-group">
                <label className="vault-form-label">Display Status</label>
                <div className="vault-display-status-picker">
                  {[
                    { value: 'display', label: '📍 On Display', color: 'var(--accent-success)' },
                    { value: 'storage', label: '📦 In Storage', color: 'var(--accent-tertiary)' },
                    { value: 'for_sale', label: '💰 For Sale', color: 'var(--accent-warning)' },
                  ].map(s => (
                    <button
                      key={s.value}
                      className={`vault-status-btn ${formDisplayStatus === s.value ? 'active' : ''}`}
                      onClick={() => setFormDisplayStatus(s.value)}
                      style={{ '--status-color': s.color }}
                    >{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Storage Location */}
              {formDisplayStatus === 'storage' && (
                <div className="vault-form-group">
                  <label className="vault-form-label">Storage Location</label>
                  <input
                    type="text"
                    className="vault-form-input"
                    placeholder="e.g. Shelf B3, Bin 12, Closet Top..."
                    value={formStorageLocation}
                    onChange={(e) => setFormStorageLocation(e.target.value)}
                  />
                </div>
              )}

              <div className="vault-form-actions">
                <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Plus size={14} />
                  Add to Vault
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
