import { useState } from 'react';

// Character name → gradient mapping for nice placeholders
const CHARACTER_GRADIENTS = {
  // Dragon Ball
  'goku': 'linear-gradient(135deg, #f59e0b, #ef4444)',
  'vegeta': 'linear-gradient(135deg, #3b82f6, #1e3a5f)',
  'broly': 'linear-gradient(135deg, #22c55e, #15803d)',
  'frieza': 'linear-gradient(135deg, #a855f7, #7c3aed)',
  'cell': 'linear-gradient(135deg, #22c55e, #064e3b)',
  'buu': 'linear-gradient(135deg, #ec4899, #f472b6)',
  'gohan': 'linear-gradient(135deg, #eab308, #a855f7)',
  'piccolo': 'linear-gradient(135deg, #16a34a, #059669)',
  'trunks': 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'krillin': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'android': 'linear-gradient(135deg, #6366f1, #3b82f6)',
  'jiren': 'linear-gradient(135deg, #dc2626, #991b1b)',
  'ginyu': 'linear-gradient(135deg, #7c3aed, #5b21b6)',
  'recoome': 'linear-gradient(135deg, #ea580c, #f97316)',
  'burter': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  'jeice': 'linear-gradient(135deg, #dc2626, #ef4444)',
  'guldo': 'linear-gradient(135deg, #65a30d, #4d7c0f)',
  'zarbon': 'linear-gradient(135deg, #0d9488, #0891b2)',
  'dodoria': 'linear-gradient(135deg, #e879f9, #d946ef)',
  'nappa': 'linear-gradient(135deg, #78350f, #92400e)',
  'majin': 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  'vegito': 'linear-gradient(135deg, #3b82f6, #f59e0b)',
  // One Piece
  'luffy': 'linear-gradient(135deg, #dc2626, #f59e0b)',
  'zoro': 'linear-gradient(135deg, #16a34a, #064e3b)',
  'sanji': 'linear-gradient(135deg, #f59e0b, #eab308)',
  'nami': 'linear-gradient(135deg, #f97316, #fbbf24)',
  'usopp': 'linear-gradient(135deg, #92400e, #a16207)',
  'chopper': 'linear-gradient(135deg, #ec4899, #f472b6)',
  'robin': 'linear-gradient(135deg, #7c3aed, #4c1d95)',
  'franky': 'linear-gradient(135deg, #2563eb, #0ea5e9)',
  'brook': 'linear-gradient(135deg, #1e1b4b, #7c3aed)',
  'ace': 'linear-gradient(135deg, #ef4444, #f97316)',
  'sabo': 'linear-gradient(135deg, #2563eb, #3b82f6)',
  'shanks': 'linear-gradient(135deg, #dc2626, #7f1d1d)',
  'law': 'linear-gradient(135deg, #fbbf24, #1e1b4b)',
  'kid': 'linear-gradient(135deg, #dc2626, #7c2d12)',
  'yamato': 'linear-gradient(135deg, #06b6d4, #0891b2)',
  'kaido': 'linear-gradient(135deg, #581c87, #312e81)',
  'mihawk': 'linear-gradient(135deg, #1e1b4b, #6d28d9)',
  'blackbeard': 'linear-gradient(135deg, #1c1917, #57534e)',
  'teach': 'linear-gradient(135deg, #1c1917, #57534e)',
  'marco': 'linear-gradient(135deg, #0ea5e9, #fbbf24)',
  'crocodile': 'linear-gradient(135deg, #a16207, #78350f)',
  'hancock': 'linear-gradient(135deg, #dc2626, #ec4899)',
  'boa': 'linear-gradient(135deg, #dc2626, #ec4899)',
  'bonney': 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'kizaru': 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  'borsalino': 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  'gear': 'linear-gradient(135deg, #dc2626, #f59e0b)',
  'nico': 'linear-gradient(135deg, #7c3aed, #4c1d95)',
  'default': 'linear-gradient(135deg, #6b7280, #4b5563)',
};

function getGradient(name) {
  const lower = name.toLowerCase();
  for (const [key, gradient] of Object.entries(CHARACTER_GRADIENTS)) {
    if (lower.includes(key)) return gradient;
  }
  return CHARACTER_GRADIENTS.default;
}

function getInitials(name) {
  // Get meaningful initials from figure name
  const words = name.replace(/[(\[\])/]/g, '').split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function FigureImage({ figure, className, style, ...props }) {
  const [failed, setFailed] = useState(false);
  const hasImage = figure.imageUrl && !figure.imageUrl.includes('shfiguarts.com');

  if (!hasImage || failed) {
    return (
      <div
        className={`vault-figure-placeholder ${className || ''}`}
        style={{
          background: getGradient(figure.name),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          textAlign: 'center',
          padding: '8px',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
        {...props}
      >
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          opacity: 0.3,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.05em',
        }}>
          {getInitials(figure.name)}
        </div>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          lineHeight: 1.3,
          zIndex: 1,
          maxWidth: '90%',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}>
          {figure.name}
        </div>
        <div style={{
          fontSize: '0.55rem',
          opacity: 0.7,
          marginTop: '4px',
          zIndex: 1,
        }}>
          S.H. Figuarts
        </div>
      </div>
    );
  }

  return (
    <img
      src={figure.imageUrl}
      alt={figure.name}
      className={className}
      style={style}
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      loading="lazy"
      {...props}
    />
  );
}
