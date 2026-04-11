import { useState, useRef, useEffect } from 'react';
import { Image, Download, Camera, Sparkles, RotateCcw } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const THUMBNAIL_PRESETS = [
  {
    id: 'hype',
    name: 'HYPE Review',
    bgGradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    textColor: '#fff',
    borderColor: '#f59e0b',
    fontSize: 64,
    overlayColor: 'rgba(0, 0, 0, 0.45)',
  },
  {
    id: 'clean',
    name: 'Clean Minimal',
    bgGradient: 'linear-gradient(135deg, #0f172a, #1e293b)',
    textColor: '#f0f0ff',
    borderColor: '#06b6d4',
    fontSize: 56,
    overlayColor: 'rgba(0, 0, 0, 0.55)',
  },
  {
    id: 'fire',
    name: 'On Fire 🔥',
    bgGradient: 'linear-gradient(135deg, #dc2626, #f97316)',
    textColor: '#fff',
    borderColor: '#fbbf24',
    fontSize: 72,
    overlayColor: 'rgba(0, 0, 0, 0.4)',
  },
  {
    id: 'onepiece',
    name: 'One Piece',
    bgGradient: 'linear-gradient(135deg, #1a1a2e, #c2185b)',
    textColor: '#ffd700',
    borderColor: '#c2185b',
    fontSize: 60,
    overlayColor: 'rgba(0, 0, 0, 0.5)',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    bgGradient: 'linear-gradient(135deg, #0a0a20, #1a0a30)',
    textColor: '#00ff88',
    borderColor: '#00ff88',
    fontSize: 58,
    overlayColor: 'rgba(0, 10, 20, 0.6)',
  },
  {
    id: 'retro',
    name: 'Retro Manga',
    bgGradient: 'linear-gradient(135deg, #f5f0e8, #e8d5b7)',
    textColor: '#1a1a2e',
    borderColor: '#e74c3c',
    fontSize: 62,
    overlayColor: 'rgba(245, 240, 232, 0.5)',
  },
];

const STICKERS = ['🔥', '⭐', '💯', '🏆', '💀', '👑', '⚡', '❗', '🆕', '💎', '🎯', '💪'];

const QUICK_TITLES = [
  'BEST FIGURE EVER?!',
  'MUST HAVE GRAIL!',
  'UNBOXING GONE WRONG',
  'TOP 10 FIGURES',
  'MOST EXPENSIVE HAUL',
  'RARE FIND!',
];

export default function ThumbnailPanel() {
  const canvasRef = useRef(null);
  const { tracks, currentTime, showNotification } = useEditorStore();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('KOMIC FREAKS');
  const [selectedPreset, setSelectedPreset] = useState(THUMBNAIL_PRESETS[0]);
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [bgImage, setBgImage] = useState(null);
  const [capturedFrame, setCapturedFrame] = useState(null);

  useEffect(() => {
    renderThumbnail();
  }, [title, subtitle, selectedPreset, selectedStickers, bgImage, capturedFrame]);

  const renderThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;

    // Background
    if (capturedFrame || bgImage) {
      const img = capturedFrame || bgImage;
      // Cover-fit the image
      const imgRatio = img.width / img.height;
      const canvasRatio = 1280 / 720;
      let sw, sh, sx, sy;
      if (imgRatio > canvasRatio) {
        sh = img.height;
        sw = sh * canvasRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / canvasRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1280, 720);

      // Overlay
      ctx.fillStyle = selectedPreset.overlayColor || 'rgba(0, 0, 0, 0.45)';
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

    // Border frame with glow
    ctx.shadowColor = selectedPreset.borderColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = selectedPreset.borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1240, 680);
    ctx.shadowBlur = 0;

    // Inner line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, 1220, 660);

    // Title text
    if (title) {
      ctx.font = `900 ${selectedPreset.fontSize}px 'Outfit', Impact, sans-serif`;
      ctx.fillStyle = selectedPreset.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text shadow/stroke
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';

      const lines = wrapText(ctx, title.toUpperCase(), 1100);
      const lineHeight = selectedPreset.fontSize * 1.2;
      const startY = 330 - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        ctx.strokeText(line, 640, y);
        ctx.fillText(line, 640, y);
      });
    }

    // Subtitle with background pill
    if (subtitle) {
      ctx.font = "700 28px 'Space Grotesk', sans-serif";
      const subtitleText = subtitle.toUpperCase();
      const textWidth = ctx.measureText(subtitleText).width;

      // Background pill
      ctx.fillStyle = selectedPreset.borderColor;
      const pillX = 640 - textWidth / 2 - 16;
      const pillW = textWidth + 32;
      ctx.beginPath();
      ctx.roundRect(pillX, 640, pillW, 40, 6);
      ctx.fill();

      // Subtitle text
      ctx.fillStyle = selectedPreset.id === 'retro' ? '#fff' : '#000';
      ctx.textAlign = 'center';
      ctx.fillText(subtitleText, 640, 662);
    }

    // Stickers with shadow
    selectedStickers.forEach((sticker, i) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.font = '64px sans-serif';
      // Arrange stickers in top-right corner
      const x = 1180 - i * 75;
      const y = 80;
      ctx.fillText(sticker, x, y);
      ctx.restore();
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

  // Capture frame from the video preview
  const handleCaptureFrame = () => {
    const videoEl = document.querySelector('.preview-viewport video');
    if (!videoEl || !videoEl.src) {
      showNotification('Import a video first to capture a frame', 'warning');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoEl.videoWidth || 1280;
    tempCanvas.height = videoEl.videoHeight || 720;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(videoEl, 0, 0);

    const img = new window.Image();
    img.onload = () => {
      setCapturedFrame(img);
      showNotification('Frame captured from video!', 'success');
    };
    img.src = tempCanvas.toDataURL();
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new window.Image();
    img.onload = () => {
      setBgImage(img);
      setCapturedFrame(null);
    };
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
    showNotification('Thumbnail downloaded!', 'success');
  };

  const handleReset = () => {
    setTitle('');
    setSubtitle('KOMIC FREAKS');
    setSelectedPreset(THUMBNAIL_PRESETS[0]);
    setSelectedStickers([]);
    setBgImage(null);
    setCapturedFrame(null);
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

        {/* Canvas Preview */}
        <div style={{ marginBottom: 'var(--space-md)', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <div className="thumbnail-actions">
            <button
              className="btn-icon tooltip"
              data-tooltip="Capture from video"
              onClick={handleCaptureFrame}
              style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '28px', height: '28px' }}
            >
              <Camera size={14} />
            </button>
            <button
              className="btn-icon tooltip"
              data-tooltip="Reset"
              onClick={handleReset}
              style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '28px', height: '28px' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Quick Titles */}
        <div className="property-group">
          <div className="property-group-title">Quick Titles</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-sm)' }}>
            {QUICK_TITLES.map((t) => (
              <button
                key={t}
                className="caption-preset-btn"
                style={{ fontSize: '0.563rem', padding: '3px 6px', color: 'var(--text-secondary)', background: 'var(--bg-deep)' }}
                onClick={() => setTitle(t)}
              >
                {t}
              </button>
            ))}
          </div>
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
          <div className="thumbnail-presets-grid">
            {THUMBNAIL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`thumbnail-preset-card ${selectedPreset.id === preset.id ? 'selected' : ''}`}
                onClick={() => setSelectedPreset(preset)}
                style={{ background: preset.bgGradient }}
              >
                <span style={{ color: preset.textColor, fontSize: '0.563rem', fontWeight: 700 }}>
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Background Image */}
        <div className="property-group">
          <div className="property-group-title">Background Image</div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <label
              className="btn btn-secondary"
              style={{ fontSize: '0.688rem', cursor: 'pointer', flex: 1, justifyContent: 'center' }}
            >
              <Image size={12} />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.688rem', flex: 1, justifyContent: 'center' }}
              onClick={handleCaptureFrame}
            >
              <Camera size={12} />
              Capture Frame
            </button>
          </div>
          {(bgImage || capturedFrame) && (
            <div style={{ marginTop: 'var(--space-xs)', fontSize: '0.625rem', color: 'var(--accent-success)' }}>
              ✓ {capturedFrame ? 'Video frame captured' : 'Custom image loaded'}
            </div>
          )}
        </div>

        {/* Stickers */}
        <div className="property-group">
          <div className="property-group-title">Stickers</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                className={`sticker-btn ${selectedStickers.includes(emoji) ? 'selected' : ''}`}
                onClick={() => toggleSticker(emoji)}
              >
                {emoji}
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
