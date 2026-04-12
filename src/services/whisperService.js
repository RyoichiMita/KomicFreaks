/**
 * Whisper Cloud Transcription Service
 * Uses OpenAI's Whisper API for cloud-based speech-to-text.
 * No local server required — works from any browser.
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_BASE = 'https://api.openai.com/v1/audio';

/**
 * Transcribe audio in its original language using OpenAI Whisper API.
 * Returns timestamped segments.
 *
 * @param {Blob} audioBlob - Audio/video blob (mp3, mp4, wav, etc.)
 * @param {function} onStatus - Status callback
 * @returns {{ language, segments: Array<{start, end, text}> }}
 */
export async function whisperTranscribe(audioBlob, onStatus) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env');
  }

  onStatus?.('Uploading to Whisper AI...');

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch(`${API_BASE}/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Whisper API error: ${response.status}`);
  }

  onStatus?.('Processing results...');
  const result = await response.json();

  return {
    language: result.language || 'unknown',
    segments: (result.segments || []).map((seg) => ({
      start: round(seg.start),
      end: round(seg.end),
      text: seg.text.trim(),
    })),
  };
}

/**
 * Translate audio to English using OpenAI Whisper API.
 * Regardless of the source language, output is always English.
 *
 * @param {Blob} audioBlob - Audio/video blob
 * @param {function} onStatus - Status callback
 * @returns {{ segments: Array<{start, end, text}> }}
 */
export async function whisperTranslate(audioBlob, onStatus) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env');
  }

  onStatus?.('Translating to English...');

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch(`${API_BASE}/translations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Whisper translate error: ${response.status}`);
  }

  onStatus?.('Processing translation...');
  const result = await response.json();

  return {
    segments: (result.segments || []).map((seg) => ({
      start: round(seg.start),
      end: round(seg.end),
      text: seg.text.trim(),
    })),
  };
}

/**
 * Full transcription pipeline: transcribe + optionally translate.
 *
 * @param {Blob} audioBlob - Audio blob
 * @param {'original'|'english'|'both'} captionMode
 * @param {function} onStatus
 * @returns {{ language, segments, translation? }}
 */
export async function whisperFullPipeline(audioBlob, captionMode = 'both', onStatus) {
  const result = { language: 'en', segments: [], translation: null };

  // Step 1: Always transcribe to get original language
  if (captionMode === 'original' || captionMode === 'both') {
    const transcription = await whisperTranscribe(audioBlob, onStatus);
    result.language = transcription.language;
    result.segments = transcription.segments;
  }

  // Step 2: Translate to English if needed
  if (captionMode === 'english' || captionMode === 'both') {
    // If captionMode is 'english' only, we still need the language detection
    if (captionMode === 'english') {
      const transcription = await whisperTranscribe(audioBlob, onStatus);
      result.language = transcription.language;
      // For english-only, put translation as the main segments
    }

    // Only translate if not already English
    if (result.language !== 'english' && result.language !== 'en') {
      const translation = await whisperTranslate(audioBlob, onStatus);

      if (captionMode === 'english') {
        // Replace segments with English translation
        result.segments = translation.segments;
      } else {
        // Both mode: keep original + add translation
        result.translation = translation.segments;
      }
    }
  }

  return result;
}

function round(n) {
  return Math.round(n * 100) / 100;
}
