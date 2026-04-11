import { useState, useRef, useEffect } from 'react';
import { Image, Download, Type, Sparkles } from 'lucide-react';

const THUMBNAIL_PRESETS = [
  {
    id: 'hype',
    name: 'HYPE Review',
    bgGradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    textColor: '#fff',
    borderColor: '#f59e0b',
    fontSize: 64,
  },
  {
    id: 'clean',
    name: 'Clean Minimal',
    bgGradient: 'linear-gradient(135deg, #0f172a, #1e293b)',
    textColor: '#f0f0ff',
    borderColor: '#06b6d4',
    fontSize: 56,
  },
  {
    id: 'fire',
    name: 'On Fire 🔥',
    bgGradient: 'linear-gradient(135deg, #dc2626, #f97316)',
    textColor: '#fff',
    borderColor: '#fbbf24',
    fontSize: 72,
  },
  {
    id: 'onepiece',
    name: 'One Piece',
    bgGradient: 'linear-gradient(135deg, #1a1a2e, #c2185b)',
    textColor: '#ffd700',
    borderColor: '#c2185b',
    fontSize: 60,
  },
];

const STICKERS = ['🔥', '⭐', '💯', '🏆', '💀', '👑', '⚡', '❗', '🆕', '💎'];

export default function ThumbnailPanel() {
  const canvasRef = useRef(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('KOMIC FREAKS');
  const [selectedPreset, setSelectedPreset] = useState(THUMBNAIL_PRESETS[0]);
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [bgImage, setBgImage] = useState(null);

  useEffect(() => {
    renderThumbnail();
  }, [title, subtitle, selectedPreset, selectedStickers, bgImage]);

  const renderThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;

    // Background
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, 1280, 720);
      // Dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 1280, 720);
    } else {
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
      const colors = selectedPreset.bgGradient.match(/#[a-f0-9]{6}/gi) || ['#7c3aed', '#ec4899'];
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1] || colors[0]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1280, 720);
    }

    // Border frame
    ctx.strokeStyle = selectedPreset.borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1240, 680);

    // Title text
    if (title) {
      ctx.font = `900 ${selectedPreset.fontSize}px 'Outfit', Impact, sans-serif`;
      ctx.fillStyle = selectedPreset.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text shadow / stroke
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';

      const lines = wrapText(ctx, title.toUpperCase(), 1100);
      const lineHeight = selectedPreset.fontSize * 1.2;
      const startY = 360 - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        ctx.strokeText(line, 640, y);
        ctx.fillText(line, 640, y);
      });
    }

    // Subtitle
    if (subtitle) {
      ctx.font = "700 28px 'Space Grotesk', sans-serif";
      ctx.fillStyle = selectedPreset.borderColor;
      ctx.textAlign = 'center';
      ctx.fillText(subtitle.toUpperCase(), 640, 660);
    }

    // Stickers
    selectedStickers.forEach((sticker, i) => {
      ctx.font = '64px sans-serif';
      ctx.fillText(sticker, 80 + i * 80, 80);
    });
  };

  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const width = ctx.measureText(currentLine + ' ' + words[i]).width;
      if (width < maxWidth) {
        currentLine += ' ' + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new window.Image();
    img.onload = () => setBgImage(img);
    img.src = URL.createObjectURL(file);
  };

  const toggleSticker = (emoji) => {
    setSelectedStickers((prev) =>
      prev.includes(emoji) ? prev.filter((s) => s !== emoji) : [...prev, emoji]
    );
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${title || 'thumbnail'}_komic_freaks.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="ai-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon thumbnail">
            <Image size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">Thumbnail Generator</div>
            <div className="ai-card-description">
              Create YouTube-ready thumbnails in seconds
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 'var(--space-md)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Title Input */}
        <div className="property-group">
          <div className="property-group-title">Title</div>
          <input
            className="input"
            placeholder="e.g. GEAR 5 LUFFY - BEST FIGURE EVER?!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Subtitle */}
        <div className="property-group">
          <div className="property-group-title">Subtitle</div>
          <input
            className="input"
            placeholder="e.g. KOMIC FREAKS"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        {/* Style Presets */}
        <div className="property-group">
          <div className="property-group-title">Style</div>
          <div className="voice-grid">
            {THUMBNAIL_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`voice-option ${selectedPreset.id === preset.id ? 'selected' : ''}`}
                onClick={() => setSelectedPreset(preset)}
                style={{ background: preset.bgGradient, border: selectedPreset.id === preset.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)' }}
              >
                <div className="voice-name" style={{ color: preset.textColor }}>{preset.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Image */}
        <div className="property-group">
          <div className="property-group-title">Background Image (optional)</div>
          <input
            type="file"
            accept="image/*"
            onChange={handleBgUpload}
            style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}
          />
        </div>

        {/* Stickers */}
        <div className="property-group">
          <div className="property-group-title">Stickers</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                className="sound-btn"
                style={{
                  width: '40px',
                  height: '40px',
                  padding: '4px',
                  background: selectedStickers.includes(emoji)
                    ? 'rgba(124, 58, 237, 0.2)'
                    : 'var(--bg-deep)',
                  borderColor: selectedStickers.includes(emoji)
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                }}
                onClick={() => toggleSticker(emoji)}
              >
                <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Download */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleDownload}
        >
          <Download size={16} />
          Download Thumbnail (1280×720)
        </button>
      </div>
    </div>
  );
}
