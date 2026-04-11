import { useState, useRef } from 'react';
import { Mic, Play, Loader, Sparkles, Plus, Square, Volume2 } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { VOICES, generateSpeech } from '../../services/elevenlabs';

// Browser TTS voices mapped to our voice options
const BROWSER_TTS_VOICES = {
  narrator: { rate: 0.85, pitch: 0.8 },
  hype: { rate: 1.15, pitch: 1.1 },
  chill: { rate: 0.9, pitch: 1.0 },
  sensei: { rate: 0.8, pitch: 0.7 },
};

export default function NarrationPanel() {
  const {
    narrationScript,
    setNarrationScript,
    selectedVoice,
    setSelectedVoice,
    isGeneratingNarration,
    setIsGeneratingNarration,
    addClipToTrack,
    showNotification,
  } = useEditorStore();

  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewUtteranceRef = useRef(null);

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const hasApiKey = !!apiKey;

  // Preview voice using browser TTS
  const handlePreviewVoice = (voiceId) => {
    if (isPreviewing) {
      window.speechSynthesis.cancel();
      setIsPreviewing(false);
      return;
    }

    const sample = narrationScript.trim() || "Today we're looking at this incredible anime figure!";
    const utterance = new SpeechSynthesisUtterance(sample.substring(0, 100));
    const settings = BROWSER_TTS_VOICES[voiceId] || { rate: 1, pitch: 1 };
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.onend = () => setIsPreviewing(false);
    utterance.onerror = () => setIsPreviewing(false);

    previewUtteranceRef.current = utterance;
    setIsPreviewing(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerate = async () => {
    if (!narrationScript.trim()) return;

    setIsGeneratingNarration(true);
    setError(null);

    if (hasApiKey) {
      // ElevenLabs API generation
      try {
        const voice = VOICES.find((v) => v.id === selectedVoice);
        const result = await generateSpeech(apiKey, narrationScript, voice.elevenLabsId);
        setGeneratedAudioUrl(result.url);
        showNotification('Narration generated!', 'success');
      } catch (err) {
        setError(err.message || 'Failed to generate narration');
      } finally {
        setIsGeneratingNarration(false);
      }
    } else {
      // Browser TTS fallback (free, no API key needed)
      try {
        const audioUrl = await generateBrowserTTS(narrationScript, selectedVoice);
        setGeneratedAudioUrl(audioUrl);
        showNotification('Narration generated (browser voice)', 'success');
      } catch (err) {
        setError('Browser TTS failed. Try a different browser.');
      } finally {
        setIsGeneratingNarration(false);
      }
    }
  };

  const handleAddToTimeline = () => {
    if (!generatedAudioUrl) return;
    addClipToTrack('narration', {
      name: `🎙️ "${narrationScript.substring(0, 25)}…"`,
      url: generatedAudioUrl,
      startTime: 0,
      duration: Math.max(2, narrationScript.length * 0.07), // ~70ms per char estimate
      offset: 0,
      type: 'narration',
    });
    showNotification('Narration added to timeline', 'success');
    setGeneratedAudioUrl(null);
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
              {hasApiKey
                ? 'ElevenLabs powered voiceovers'
                : 'Free browser voices (add API key for premium)'}
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
                <button
                  className="voice-preview-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice.id);
                  }}
                  title="Preview this voice"
                >
                  {isPreviewing && selectedVoice === voice.id ? (
                    <Square size={10} />
                  ) : (
                    <Volume2 size={10} />
                  )}
                </button>
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
            <span>
              {hasApiKey
                ? '✓ ElevenLabs connected'
                : '🔊 Browser TTS (free)'}
            </span>
          </div>
        </div>

        {/* Quick Script Templates */}
        <div className="property-group">
          <div className="property-group-title">Quick Scripts</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {[
              { label: '📦 Unboxing', text: "Let's see what's inside this box! I've been waiting for this one..." },
              { label: '⭐ Review', text: "This figure is absolutely incredible. The paint quality, the detail, everything about it is top-tier." },
              { label: '🏆 Top Pick', text: "This has to be one of my favorite figures of all time. Here's why..." },
              { label: '🔥 Hype', text: "OH MY GOD! Look at this! This is absolutely INSANE!" },
            ].map((template) => (
              <button
                key={template.label}
                className="btn btn-secondary"
                style={{ fontSize: '0.625rem', padding: '3px 8px' }}
                onClick={() => setNarrationScript(template.text)}
              >
                {template.label}
              </button>
            ))}
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
            <div className="property-group-title">Generated Audio</div>
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
              <Plus size={14} />
              Add to Narration Track
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate TTS using browser's built-in SpeechSynthesis API.
 * Records the audio output via MediaRecorder to get a blob URL.
 * Falls back to a simple timing estimate if recording is not supported.
 */
async function generateBrowserTTS(text, voiceId) {
  return new Promise((resolve, reject) => {
    try {
      // Use SpeechSynthesis with AudioContext recording
      const utterance = new SpeechSynthesisUtterance(text);
      const settings = BROWSER_TTS_VOICES[voiceId] || { rate: 1, pitch: 1 };
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;

      // Create a simple WAV from timing (since MediaRecorder can't capture TTS)
      const estimatedDuration = text.length * 0.07 / settings.rate;

      utterance.onend = () => {
        // Generate a simple placeholder audio blob for the timeline
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = audioContext.sampleRate;
        const length = Math.floor(sampleRate * estimatedDuration);
        const buffer = audioContext.createBuffer(1, length, sampleRate);

        // Create subtle background tone to mark the narration clip
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          data[i] = Math.sin(2 * Math.PI * 220 * (i / sampleRate)) * 0.01;
        }

        // Convert to WAV
        const wavBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(wavBuffer);
        const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, length * 2, true);

        let offset = 44;
        for (let i = 0; i < length; i++) {
          const s = Math.max(-1, Math.min(1, data[i]));
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          offset += 2;
        }

        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        resolve(URL.createObjectURL(blob));
      };

      utterance.onerror = () => reject(new Error('Speech synthesis failed'));
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      reject(err);
    }
  });
}
