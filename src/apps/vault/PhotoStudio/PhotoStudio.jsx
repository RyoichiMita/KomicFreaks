import { useState, useCallback, useRef } from 'react';
import {
  Image,
  Sparkles,
  Upload,
  Download,
  Trash2,
  Loader,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Palette,
  Wand2,
  Camera,
  X,
} from 'lucide-react';
import {
  SCENE_PRESETS,
  generateSceneBackground,
  reimagineFigure,
  isGeminiConfigured,
  fileToBase64,
  saveToGallery,
  loadGallery,
  deleteFromGallery,
} from '../../../services/geminiService';

/**
 * AI Photo Studio — Generate scene backgrounds and reimagine figure photos
 * using Gemini's image generation capabilities.
 */
export default function PhotoStudio({ onBack }) {
  const [mode, setMode] = useState('menu'); // 'menu' | 'scenes' | 'reimagine' | 'gallery'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedCaption, setGeneratedCaption] = useState('');

  // Scene mode state
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [figureName, setFigureName] = useState('');

  // Reimagine mode state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [reimagineStyle, setReimagineStyle] = useState('anime');
  const [reimagineName, setReimagineName] = useState('');

  // Gallery
  const [gallery, setGallery] = useState([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);

  const fileInputRef = useRef(null);
  const geminiConfigured = isGeminiConfigured();

  // --- Gallery ---
  const loadGalleryData = useCallback(async () => {
    const items = await loadGallery();
    setGallery(items.sort((a, b) => b.createdAt - a.createdAt));
    setGalleryLoaded(true);
  }, []);

  const handleOpenGallery = () => {
    setMode('gallery');
    if (!galleryLoaded) loadGalleryData();
  };

  const handleSaveToGallery = async () => {
    if (!generatedImage) return;
    const entry = {
      id: `studio_${Date.now()}`,
      imageData: generatedImage,
      caption: generatedCaption,
      figureName: figureName || reimagineName || 'Unknown',
      mode: mode === 'scenes' ? 'scene' : 'reimagine',
      createdAt: Date.now(),
    };
    await saveToGallery(entry);
    setGallery(prev => [entry, ...prev]);
  };

  const handleDeleteFromGallery = async (id) => {
    await deleteFromGallery(id);
    setGallery(prev => prev.filter(g => g.id !== id));
  };

  // --- Scene Generation ---
  const handleGenerateScene = async () => {
    const prompt = selectedPreset
      ? SCENE_PRESETS.find(p => p.id === selectedPreset)?.prompt
      : customPrompt;

    if (!prompt) return;
    if (!figureName.trim()) {
      setError('Enter the character name for context');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateSceneBackground(prompt, figureName, setStatus);
      setGeneratedImage(result.imageData);
      setGeneratedCaption(result.textResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  // --- Reimagine ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
  };

  const handleReimagine = async () => {
    if (!uploadedFile) return;
    if (!reimagineName.trim()) {
      setError('Enter the character name');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64 = await fileToBase64(uploadedFile);
      const result = await reimagineFigure(
        base64,
        uploadedFile.type,
        reimagineName,
        reimagineStyle,
        setStatus,
      );
      setGeneratedImage(result.imageData);
      setGeneratedCaption(result.textResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  // --- Download ---
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
    link.download = `komic-studio-${Date.now()}.png`;
    link.click();
  };

  // --- Reset ---
  const resetGeneration = () => {
    setGeneratedImage(null);
    setGeneratedCaption('');
    setError(null);
  };

  // --- Render ---
  return (
    <div className="studio-container">
      {/* Header */}
      <div className="studio-header">
        <button className="studio-back-btn" onClick={mode === 'menu' ? onBack : () => { setMode('menu'); resetGeneration(); }}>
          <ArrowLeft size={18} />
        </button>
        <div className="studio-header-info">
          <h2 className="studio-title">
            <Camera size={20} />
            AI Photo Studio
          </h2>
          <span className="studio-subtitle">Powered by Gemini</span>
        </div>
        <button className="studio-gallery-btn" onClick={handleOpenGallery}>
          <Image size={16} />
          Gallery {gallery.length > 0 && `(${gallery.length})`}
        </button>
      </div>

      {!geminiConfigured && (
        <div className="studio-api-warning">
          <AlertCircle size={16} />
          <span>Set <code>VITE_GEMINI_API_KEY</code> in your <code>.env</code> file to enable AI Photo Studio</span>
        </div>
      )}

      {/* Menu */}
      {mode === 'menu' && (
        <div className="studio-menu">
          <button
            className="studio-mode-card"
            onClick={() => setMode('scenes')}
            disabled={!geminiConfigured}
          >
            <div className="studio-mode-icon studio-mode-scenes">
              <Palette size={28} />
            </div>
            <h3>Scene Generator</h3>
            <p>Generate anime backgrounds for your figures. Choose from preset locations or describe your own.</p>
          </button>

          <button
            className="studio-mode-card"
            onClick={() => setMode('reimagine')}
            disabled={!geminiConfigured}
          >
            <div className="studio-mode-icon studio-mode-reimagine">
              <Wand2 size={28} />
            </div>
            <h3>Figure Reimaginer</h3>
            <p>Upload a photo of your figure and AI will create epic anime artwork inspired by it.</p>
          </button>
        </div>
      )}

      {/* Scene Generator */}
      {mode === 'scenes' && !generatedImage && !loading && (
        <div className="studio-scene-panel">
          <div className="studio-input-group">
            <label className="studio-label">Character Name</label>
            <input
              type="text"
              className="studio-input"
              placeholder="e.g. Super Saiyan 4 Goku"
              value={figureName}
              onChange={(e) => setFigureName(e.target.value)}
            />
          </div>

          <div className="studio-input-group">
            <label className="studio-label">Choose a Scene</label>
            <div className="studio-preset-grid">
              {SCENE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  className={`studio-preset-btn ${selectedPreset === preset.id ? 'active' : ''}`}
                  onClick={() => { setSelectedPreset(preset.id); setCustomPrompt(''); }}
                >
                  <span className="studio-preset-emoji">{preset.emoji}</span>
                  <span className="studio-preset-name">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="studio-divider">
            <span>or describe your own</span>
          </div>

          <div className="studio-input-group">
            <textarea
              className="studio-textarea"
              placeholder="Describe a custom scene... e.g. 'A destroyed futuristic city at sunset with smoke rising from the buildings'"
              value={customPrompt}
              onChange={(e) => { setCustomPrompt(e.target.value); setSelectedPreset(null); }}
              rows={3}
            />
          </div>

          <button
            className="studio-generate-btn"
            onClick={handleGenerateScene}
            disabled={(!selectedPreset && !customPrompt.trim()) || !figureName.trim()}
          >
            <Sparkles size={18} />
            Generate Scene
          </button>
        </div>
      )}

      {/* Reimagine Mode */}
      {mode === 'reimagine' && !generatedImage && !loading && (
        <div className="studio-reimagine-panel">
          <div className="studio-input-group">
            <label className="studio-label">Character Name</label>
            <input
              type="text"
              className="studio-input"
              placeholder="e.g. Vegeta"
              value={reimagineName}
              onChange={(e) => setReimagineName(e.target.value)}
            />
          </div>

          <div className="studio-upload-zone" onClick={() => fileInputRef.current?.click()}>
            {uploadPreview ? (
              <div className="studio-upload-preview">
                <img src={uploadPreview} alt="Uploaded figure" />
                <button className="studio-upload-clear" onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setUploadPreview(null);
                }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="studio-upload-placeholder">
                <Upload size={32} />
                <span>Upload your figure photo</span>
                <span className="studio-upload-hint">PNG, JPG up to 10MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="studio-input-group">
            <label className="studio-label">Art Style</label>
            <div className="studio-style-grid">
              {[
                { id: 'anime', label: '🎨 Anime' },
                { id: 'manga', label: '📖 Manga B&W' },
                { id: 'cinematic', label: '🎬 Cinematic' },
                { id: 'watercolor', label: '🖌️ Watercolor' },
                { id: 'pixel art', label: '👾 Pixel Art' },
                { id: 'comic book', label: '💥 Comic Book' },
              ].map(style => (
                <button
                  key={style.id}
                  className={`studio-style-btn ${reimagineStyle === style.id ? 'active' : ''}`}
                  onClick={() => setReimagineStyle(style.id)}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="studio-generate-btn"
            onClick={handleReimagine}
            disabled={!uploadedFile || !reimagineName.trim()}
          >
            <Wand2 size={18} />
            Reimagine Figure
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="studio-loading">
          <div className="studio-loading-visual">
            <Loader size={36} className="studio-spinner" />
          </div>
          <span className="studio-loading-status">{status || 'Generating...'}</span>
          <div className="studio-loading-bar">
            <div className="studio-loading-bar-fill" />
          </div>
          <span className="studio-loading-hint">This usually takes 10-20 seconds</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="studio-error">
          <AlertCircle size={20} />
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <RefreshCw size={14} />
            Dismiss
          </button>
        </div>
      )}

      {/* Generated Result */}
      {generatedImage && (
        <div className="studio-result">
          <div className="studio-result-image">
            <img
              src={`data:${generatedImage.mimeType};base64,${generatedImage.data}`}
              alt="AI generated scene"
            />
          </div>
          {generatedCaption && (
            <p className="studio-result-caption">{generatedCaption}</p>
          )}
          <div className="studio-result-actions">
            <button className="studio-action-btn studio-action-download" onClick={handleDownload}>
              <Download size={16} />
              Download
            </button>
            <button className="studio-action-btn studio-action-save" onClick={handleSaveToGallery}>
              <Image size={16} />
              Save to Gallery
            </button>
            <button className="studio-action-btn studio-action-retry" onClick={() => { resetGeneration(); }}>
              <RefreshCw size={16} />
              New Generation
            </button>
          </div>
        </div>
      )}

      {/* Gallery View */}
      {mode === 'gallery' && (
        <div className="studio-gallery">
          {gallery.length === 0 ? (
            <div className="studio-gallery-empty">
              <Image size={40} />
              <h3>No saved images yet</h3>
              <p>Generate a scene or reimagine a figure to start your gallery</p>
            </div>
          ) : (
            <div className="studio-gallery-grid">
              {gallery.map(item => (
                <div key={item.id} className="studio-gallery-item">
                  <img
                    src={`data:${item.imageData.mimeType};base64,${item.imageData.data}`}
                    alt={item.caption || item.figureName}
                  />
                  <div className="studio-gallery-item-info">
                    <span className="studio-gallery-item-name">{item.figureName}</span>
                    <span className="studio-gallery-item-type">
                      {item.mode === 'scene' ? '🎨 Scene' : '✨ Reimagined'}
                    </span>
                  </div>
                  <div className="studio-gallery-item-actions">
                    <button onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:${item.imageData.mimeType};base64,${item.imageData.data}`;
                      link.download = `komic-${item.figureName}-${Date.now()}.png`;
                      link.click();
                    }}>
                      <Download size={14} />
                    </button>
                    <button onClick={() => handleDeleteFromGallery(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
