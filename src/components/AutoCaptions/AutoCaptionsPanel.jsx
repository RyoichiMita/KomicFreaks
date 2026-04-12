import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Plus, Trash2, MessageSquareText, Languages, Wand2 } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { whisperFullPipeline } from '../../services/whisperService';

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const LANGUAGE_LABELS = {
  japanese: '日本語 Japanese',
  english: 'English',
  korean: '한국어 Korean',
  chinese: '中文 Chinese',
  spanish: 'Español Spanish',
  french: 'Français French',
  german: 'Deutsch German',
  portuguese: 'Português Portuguese',
  arabic: 'العربية Arabic',
  italian: 'Italiano Italian',
};

export default function AutoCaptionsPanel() {
  const { addClipToTrack, tracks, showNotification, mediaFiles } = useEditorStore();

  // Mode: 'ai' (Whisper cloud) or 'mic' (browser speech recognition)
  const [mode, setMode] = useState('ai');

  // --- AI state ---
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState('');
  const [detectedLang, setDetectedLang] = useState(null);
  const [captionMode, setCaptionMode] = useState('both'); // 'original' | 'english' | 'both'

  // --- Shared results ---
  const [transcripts, setTranscripts] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [showTranslation, setShowTranslation] = useState(false);

  // --- Mic state ---
  const [isListening, setIsListening] = useState(false);
  const [micStatus, setMicStatus] = useState('idle');
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(0);

  // Get audio from video on timeline or media library
  const getVideoAudioBlob = async () => {
    const videoTrack = tracks.find((t) => t.type === 'video');
    if (videoTrack?.clips.length > 0) {
      const clip = videoTrack.clips[0];
      if (clip.url) {
        const response = await fetch(clip.url);
        return await response.blob();
      }
    }

    const videoFile = mediaFiles.find((f) =>
      f.type?.startsWith('video/') || f.type?.startsWith('audio/')
    );
    if (videoFile?.url) {
      const response = await fetch(videoFile.url);
      return await response.blob();
    }

    return null;
  };

  // --- AI Transcription (OpenAI Whisper Cloud API) ---
  const handleAITranscribe = async () => {
    setIsTranscribing(true);
    setTranscribeStatus('Finding video audio...');
    setTranscripts([]);
    setTranslations([]);
    setDetectedLang(null);

    try {
      const audioBlob = await getVideoAudioBlob();
      if (!audioBlob) {
        showNotification('No video or audio found. Import a video first.', 'error');
        setIsTranscribing(false);
        setTranscribeStatus('');
        return;
      }

      // Convert to WAV for best Whisper results
      let wavBlob = audioBlob;
      if (!audioBlob.type?.includes('wav')) {
        setTranscribeStatus('Converting audio format...');
        wavBlob = await convertToWav(audioBlob);
      }

      // Check size — OpenAI has 25MB limit
      const sizeMB = wavBlob.size / (1024 * 1024);
      if (sizeMB > 25) {
        showNotification(`Audio is ${sizeMB.toFixed(0)}MB — trimming to first 10 min for API limit`, 'info');
        wavBlob = await trimAudio(wavBlob, 600); // 10 minutes max
      }

      const result = await whisperFullPipeline(wavBlob, captionMode, setTranscribeStatus);

      setDetectedLang(result.language);

      if (result.segments?.length > 0) {
        setTranscripts(result.segments.map((seg, i) => ({
          id: `w_${i}`,
          text: seg.text,
          startTime: seg.start,
          endTime: seg.end,
          lang: result.language,
        })));
      }

      if (result.translation?.length > 0) {
        setTranslations(result.translation.map((seg, i) => ({
          id: `t_${i}`,
          text: seg.text,
          startTime: seg.start,
          endTime: seg.end,
          lang: 'en',
        })));
      }

      const langName = LANGUAGE_LABELS[result.language] || result.language;
      const segCount = result.segments?.length || 0;
      showNotification(
        `✅ ${segCount} captions in ${langName}${result.translation ? ' + English' : ''}`,
        'success'
      );
    } catch (err) {
      console.error('Transcription failed:', err);
      showNotification(`Failed: ${err.message}`, 'error');
    } finally {
      setIsTranscribing(false);
      setTranscribeStatus('');
    }
  };

  // Convert blob to WAV using Web Audio API
  const convertToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const sr = audioBuffer.sampleRate;
    const ch = audioBuffer.numberOfChannels;
    const len = audioBuffer.length;

    const wavBuf = new ArrayBuffer(44 + len * ch * 2);
    const v = new DataView(wavBuf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

    w(0, 'RIFF');
    v.setUint32(4, 36 + len * ch * 2, true);
    w(8, 'WAVE');
    w(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, ch, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * ch * 2, true);
    v.setUint16(32, ch * 2, true);
    v.setUint16(34, 16, true);
    w(36, 'data');
    v.setUint32(40, len * ch * 2, true);

    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < ch; c++) {
        const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(c)[i]));
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }

    audioCtx.close();
    return new Blob([wavBuf], { type: 'audio/wav' });
  };

  // Trim audio to maxSeconds
  const trimAudio = async (blob, maxSeconds) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const sr = audioBuffer.sampleRate;
    const ch = audioBuffer.numberOfChannels;
    const maxSamples = Math.min(audioBuffer.length, Math.floor(maxSeconds * sr));

    const trimmed = audioCtx.createBuffer(ch, maxSamples, sr);
    for (let c = 0; c < ch; c++) {
      const src = audioBuffer.getChannelData(c);
      const dst = trimmed.getChannelData(c);
      for (let i = 0; i < maxSamples; i++) dst[i] = src[i];
    }

    // Encode trimmed to WAV
    const wavBuf = new ArrayBuffer(44 + maxSamples * ch * 2);
    const v = new DataView(wavBuf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

    w(0, 'RIFF');
    v.setUint32(4, 36 + maxSamples * ch * 2, true);
    w(8, 'WAVE');
    w(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, ch, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * ch * 2, true);
    v.setUint16(32, ch * 2, true);
    v.setUint16(34, 16, true);
    w(36, 'data');
    v.setUint32(40, maxSamples * ch * 2, true);

    let off = 44;
    for (let i = 0; i < maxSamples; i++) {
      for (let c = 0; c < ch; c++) {
        const s = Math.max(-1, Math.min(1, trimmed.getChannelData(c)[i]));
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }

    audioCtx.close();
    return new Blob([wavBuf], { type: 'audio/wav' });
  };

  // --- Mic-based speech recognition ---
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showNotification('Speech Recognition not supported. Use Chrome.', 'error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    startTimeRef.current = Date.now();
    let lastFinalIndex = 0;

    recognition.onresult = (event) => {
      for (let i = lastFinalIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const duration = Math.max(2, Math.min(5, text.split(' ').length * 0.5));
            setTranscripts((prev) => [...prev, {
              id: `ac_${Date.now()}_${i}`,
              text,
              startTime: Math.max(0, elapsed - duration),
              endTime: elapsed,
            }]);
          }
          lastFinalIndex = i + 1;
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') showNotification(`Speech error: ${event.error}`, 'error');
    };
    recognition.onend = () => { setIsListening(false); setMicStatus('done'); };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setMicStatus('listening');
    showNotification('Listening... Speak clearly into your mic.', 'info');
  }, [showNotification]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setMicStatus('done');
  }, []);

  // --- Add to timeline ---
  const addToCaptions = (t) => {
    addClipToTrack('captions', {
      name: t.text.length > 30 ? t.text.substring(0, 30) + '...' : t.text,
      offset: t.startTime,
      duration: t.endTime - t.startTime,
      type: 'caption',
      text: t.text,
      style: 'standard',
      position: 'bottom',
      align: 'center',
    });
    showNotification(`Caption added: "${t.text.substring(0, 40)}"`, 'success');
  };

  const addAllToCaptions = (list) => {
    if (!list.length) return;
    list.forEach((t) => addToCaptions(t));
    showNotification(`${list.length} captions added to timeline!`, 'success');
  };

  const removeTranscript = (id) => {
    setTranscripts((p) => p.filter((t) => t.id !== id));
    setTranslations((p) => p.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setTranscripts([]);
    setTranslations([]);
    setMicStatus('idle');
    setDetectedLang(null);
  };

  const displayList = showTranslation && translations.length > 0 ? translations : transcripts;
  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  return (
    <div className="ai-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
            <MessageSquareText size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">Auto Captions</div>
            <div className="ai-card-description">AI transcription & translation</div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginTop: 'var(--space-md)',
          padding: '3px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-deep)', border: '1px solid var(--border-default)',
        }}>
          <button
            className={`btn ${mode === 'ai' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.688rem', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
            onClick={() => setMode('ai')}
          >
            <Wand2 size={13} /> AI from Video
          </button>
          <button
            className={`btn ${mode === 'mic' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.688rem', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
            onClick={() => setMode('mic')}
          >
            <Mic size={13} /> Microphone
          </button>
        </div>

        {/* =================== AI MODE =================== */}
        {mode === 'ai' && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            {/* API status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-sm)' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: hasApiKey ? 'var(--accent-success)' : 'var(--accent-error)',
              }} />
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                {hasApiKey ? 'OpenAI Whisper API connected' : 'API key missing — add VITE_OPENAI_API_KEY to .env'}
              </span>
            </div>

            {/* Caption mode */}
            <div className="property-group" style={{ marginBottom: 'var(--space-sm)' }}>
              <div className="property-group-title">Caption Language</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { key: 'original', label: '🗾 Original' },
                  { key: 'english', label: '🇬🇧 English' },
                  { key: 'both', label: '🌐 Both' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    className={`btn ${captionMode === opt.key ? 'btn-primary' : ''}`}
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem', padding: '5px 4px' }}
                    onClick={() => setCaptionMode(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.563rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {captionMode === 'original' && 'Captions in the spoken language (e.g. 日本語)'}
                {captionMode === 'english' && 'Translated English captions only'}
                {captionMode === 'both' && 'Original language + English translation'}
              </div>
            </div>

            {/* Transcribe button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleAITranscribe}
              disabled={isTranscribing || !hasApiKey}
            >
              {isTranscribing ? (
                <><div className="spinner" /> {transcribeStatus || 'Processing...'}</>
              ) : (
                <><Wand2 size={14} /> Generate Captions from Video</>
              )}
            </button>

            {/* Detected language */}
            {detectedLang && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                marginTop: 'var(--space-sm)', padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)',
              }}>
                <Languages size={14} style={{ color: 'var(--accent-primary-light)' }} />
                <span style={{ fontSize: '0.688rem', color: 'var(--accent-primary-light)' }}>
                  Detected: {LANGUAGE_LABELS[detectedLang] || detectedLang}
                </span>
              </div>
            )}

            {/* Info */}
            {!isTranscribing && transcripts.length === 0 && (
              <div style={{
                marginTop: 'var(--space-md)', padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-deep)', border: '1px solid var(--border-default)',
              }}>
                <div style={{ fontSize: '0.688rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong>
                  <ol style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                    <li>Import a video with dialogue</li>
                    <li>Choose: Original, English, or Both</li>
                    <li>Click "Generate Captions"</li>
                    <li>AI transcribes & translates automatically</li>
                    <li>Add captions to your timeline</li>
                  </ol>
                  <div style={{ marginTop: '8px', fontSize: '0.625rem' }}>
                    🎌 Auto-detects Japanese, Korean, Chinese + 90 more languages
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================== MIC MODE =================== */}
        {mode === 'mic' && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <div className={`auto-caption-status ${micStatus}`}>
              {micStatus === 'listening' && <><div className="pulse-dot" /> Listening... speak clearly</>}
              {micStatus === 'idle' && '🎤 Ready to transcribe'}
              {micStatus === 'done' && `✅ ${transcripts.length} segments captured`}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
              {!isListening ? (
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={startListening}>
                  <Mic size={16} /> Start Listening
                </button>
              ) : (
                <button
                  className="btn"
                  style={{ flex: 1, justifyContent: 'center', background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--accent-error)' }}
                  onClick={stopListening}
                >
                  <MicOff size={16} /> Stop Listening
                </button>
              )}
            </div>

            {micStatus === 'idle' && (
              <div style={{ marginTop: 'var(--space-md)', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-deep)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '0.688rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong>
                  <ol style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                    <li>Click "Start Listening"</li>
                    <li>Speak your narration clearly</li>
                    <li>Click "Stop" when done</li>
                    <li>Add transcripts to timeline</li>
                  </ol>
                  <div style={{ marginTop: '8px', fontSize: '0.625rem' }}>⚡ Works best in Chrome.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================== RESULTS =================== */}
        {(transcripts.length > 0 || translations.length > 0) && (
          <div className="property-group" style={{ marginTop: 'var(--space-md)' }}>
            {/* Language switcher */}
            {translations.length > 0 && (
              <div style={{
                display: 'flex', gap: '4px', marginBottom: 'var(--space-sm)',
                padding: '3px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)',
              }}>
                <button
                  className={`btn ${!showTranslation ? 'btn-primary' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem', padding: '4px' }}
                  onClick={() => setShowTranslation(false)}
                >
                  🗾 Original ({(detectedLang || '?').toUpperCase()})
                </button>
                <button
                  className={`btn ${showTranslation ? 'btn-primary' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem', padding: '4px' }}
                  onClick={() => setShowTranslation(true)}
                >
                  🇬🇧 English
                </button>
              </div>
            )}

            <div className="property-group-title">
              {showTranslation ? 'English Translation' : 'Transcripts'} ({displayList.length})
            </div>

            <div className="caption-results-list" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {displayList.map((t) => (
                <div key={t.id} className="caption-result-item">
                  <div className="caption-result-time">{formatTime(t.startTime)}</div>
                  <div className="caption-result-text">{t.text}</div>
                  <button className="btn-icon" onClick={() => addToCaptions(t)} title="Add to timeline" style={{ flexShrink: 0 }}>
                    <Plus size={12} />
                  </button>
                  <button className="btn-icon" onClick={() => removeTranscript(t.id)} title="Remove" style={{ flexShrink: 0 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Batch actions */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.688rem', minWidth: '120px' }}
                onClick={() => addAllToCaptions(displayList)}
              >
                <Plus size={14} /> Add All to Timeline
              </button>
              {translations.length > 0 && transcripts.length > 0 && (
                <button
                  className="btn"
                  style={{
                    justifyContent: 'center', fontSize: '0.625rem', padding: '6px 10px',
                    background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', color: 'var(--accent-primary-light)',
                  }}
                  onClick={() => { addAllToCaptions(transcripts); addAllToCaptions(translations); }}
                >
                  🌐 Both
                </button>
              )}
              <button className="btn btn-secondary" style={{ fontSize: '0.688rem' }} onClick={clearAll}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
