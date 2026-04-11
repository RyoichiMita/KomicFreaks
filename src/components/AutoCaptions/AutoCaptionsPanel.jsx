import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Plus, Trash2, MessageSquareText } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function AutoCaptionsPanel() {
  const { addClipToTrack, currentTime, tracks, showNotification } = useEditorStore();
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | listening | done
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(0);

  const checkSpeechSupport = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  const startListening = useCallback(() => {
    if (!checkSpeechSupport()) {
      showNotification('Speech Recognition is not supported in this browser. Use Chrome.', 'error');
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
            setTranscripts((prev) => [
              ...prev,
              {
                id: `ac_${Date.now()}_${i}`,
                text,
                startTime: Math.max(0, elapsed - duration),
                endTime: elapsed,
                confidence: result[0].confidence,
              },
            ]);
          }
          lastFinalIndex = i + 1;
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        showNotification(`Speech error: ${event.error}`, 'error');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus('done');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setStatus('listening');
    showNotification('Listening... Speak clearly into your mic.', 'info');
  }, [showNotification]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus('done');
  }, []);

  const addToCaptions = (transcript) => {
    const captionsTrack = tracks.find((t) => t.type === 'captions');
    if (!captionsTrack) {
      showNotification('Captions track not found', 'error');
      return;
    }

    const clip = {
      name: transcript.text.length > 30
        ? transcript.text.substring(0, 30) + '...'
        : transcript.text,
      offset: currentTime + transcript.startTime,
      duration: transcript.endTime - transcript.startTime,
      type: 'caption',
      text: transcript.text,
      style: 'standard',
      position: 'bottom',
      align: 'center',
    };

    addClipToTrack('captions', clip);
    showNotification(`Caption added: "${clip.name}"`, 'success');
  };

  const addAllToCaptions = () => {
    if (transcripts.length === 0) return;

    transcripts.forEach((t) => addToCaptions(t));
    showNotification(`${transcripts.length} captions added to timeline!`, 'success');
  };

  const removeTranscript = (id) => {
    setTranscripts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setTranscripts([]);
    setStatus('idle');
  };

  return (
    <div className="ai-panel">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
            <MessageSquareText size={20} color="white" />
          </div>
          <div>
            <div className="ai-card-title">Auto Captions</div>
            <div className="ai-card-description">
              Speech-to-text using your microphone
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`auto-caption-status ${status}`}>
          {status === 'listening' && (
            <>
              <div className="pulse-dot" />
              Listening... speak clearly
            </>
          )}
          {status === 'idle' && '🎤 Ready to transcribe'}
          {status === 'done' && `✅ ${transcripts.length} segments captured`}
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
          {!isListening ? (
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={startListening}
            >
              <Mic size={16} />
              Start Listening
            </button>
          ) : (
            <button
              className="btn"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: 'var(--accent-error)',
              }}
              onClick={stopListening}
            >
              <MicOff size={16} />
              Stop Listening
            </button>
          )}
        </div>

        {/* Instructions */}
        {status === 'idle' && (
          <div style={{
            marginTop: 'var(--space-md)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-default)',
          }}>
            <div style={{ fontSize: '0.688rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong>
              <ol style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                <li>Click "Start Listening" to begin</li>
                <li>Speak your narration or read your script</li>
                <li>Click "Stop" when finished</li>
                <li>Review transcripts and add to timeline</li>
              </ol>
              <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.625rem' }}>
                ⚡ Works best in Chrome. Requires microphone permission.
              </div>
            </div>
          </div>
        )}

        {/* Transcripts */}
        {transcripts.length > 0 && (
          <div className="property-group" style={{ marginTop: 'var(--space-md)' }}>
            <div className="property-group-title">
              Transcripts ({transcripts.length})
            </div>
            <div className="caption-results-list">
              {transcripts.map((t) => (
                <div key={t.id} className="caption-result-item">
                  <div className="caption-result-time">
                    {formatTime(t.startTime)}
                  </div>
                  <div className="caption-result-text">
                    {t.text}
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => addToCaptions(t)}
                    title="Add to timeline"
                    style={{ flexShrink: 0 }}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => removeTranscript(t.id)}
                    title="Remove"
                    style={{ flexShrink: 0 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Batch Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.688rem' }}
                onClick={addAllToCaptions}
              >
                <Plus size={14} />
                Add All to Timeline
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.688rem' }}
                onClick={clearAll}
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
