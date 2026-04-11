import { useState } from 'react';
import { Mic, Play, Loader, Sparkles } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { VOICES, generateSpeech } from '../../services/elevenlabs';

export default function NarrationPanel() {
  const {
    narrationScript,
    setNarrationScript,
    selectedVoice,
    setSelectedVoice,
    isGeneratingNarration,
    setIsGeneratingNarration,
    addClipToTrack,
  } = useEditorStore();

  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

  const handleGenerate = async () => {
    if (!narrationScript.trim()) return;
    if (!apiKey) {
      setError('Please add your ElevenLabs API key to the .env file');
      return;
    }

    setIsGeneratingNarration(true);
    setError(null);

    try {
      const voice = VOICES.find((v) => v.id === selectedVoice);
      const result = await generateSpeech(apiKey, narrationScript, voice.elevenLabsId);
      setGeneratedAudioUrl(result.url);
    } catch (err) {
      setError(err.message || 'Failed to generate narration');
    } finally {
      setIsGeneratingNarration(false);
    }
  };

  const handleAddToTimeline = () => {
    if (!generatedAudioUrl) return;
    addClipToTrack('narration', {
      name: `Narration: "${narrationScript.substring(0, 30)}..."`,
      url: generatedAudioUrl,
      startTime: 0,
      duration: 10, // Approximate
      offset: 0,
      type: 'narration',
    });
    setGeneratedAudioUrl(null);
    setNarrationScript('');
  };

  return (
    <div className="ai-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon narration">
            <Mic size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">
              AI Narration <span className="badge badge-ai">AI</span>
            </div>
            <div className="ai-card-description">
              Generate professional voiceovers with ElevenLabs
            </div>
          </div>
        </div>

        {/* Voice Selection */}
        <div className="property-group">
          <div className="property-group-title">Choose Voice</div>
          <div className="voice-grid">
            {VOICES.map((voice) => (
              <div
                key={voice.id}
                className={`voice-option ${selectedVoice === voice.id ? 'selected' : ''}`}
                onClick={() => setSelectedVoice(voice.id)}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{voice.emoji}</div>
                <div className="voice-name">{voice.name}</div>
                <div className="voice-style">{voice.style}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Script Input */}
        <div className="property-group">
          <div className="property-group-title">Narration Script</div>
          <textarea
            className="script-textarea"
            placeholder="Type your narration script here... e.g. 'Today we're unboxing the Gear 5 Luffy figure from Bandai, and this one is absolutely INSANE!'"
            value={narrationScript}
            onChange={(e) => setNarrationScript(e.target.value)}
            rows={4}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: 'var(--space-sm)',
            fontSize: '0.688rem',
            color: 'var(--text-muted)'
          }}>
            <span>{narrationScript.length} characters</span>
            <span>{!apiKey ? '⚠️ No API key set' : '✓ API key configured'}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: 'var(--space-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-danger)',
            fontSize: '0.813rem',
            marginBottom: 'var(--space-md)',
          }}>
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleGenerate}
          disabled={isGeneratingNarration || !narrationScript.trim()}
        >
          {isGeneratingNarration ? (
            <>
              <div className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Narration
            </>
          )}
        </button>

        {/* Preview Generated Audio */}
        {generatedAudioUrl && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <div className="property-group-title">Preview</div>
            <audio
              controls
              src={generatedAudioUrl}
              style={{ width: '100%', height: '36px', marginBottom: 'var(--space-sm)' }}
            />
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleAddToTimeline}
            >
              <Play size={14} />
              Add to Timeline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
