/**
 * Audio Proxy Client — talks to the Cloudflare Worker
 *
 * Handles YouTube extraction and direct URL proxying.
 * Falls back to direct fetch if worker is unavailable.
 */

// Worker URL — update after deploying
const WORKER_URL = import.meta.env.VITE_AUDIO_PROXY_URL || 'http://localhost:8787';

/**
 * Detect if a URL is a YouTube link.
 */
export function isYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes('youtube.com') ||
      parsed.hostname === 'youtu.be' ||
      parsed.hostname.includes('youtube-nocookie.com')
    );
  } catch {
    return false;
  }
}

/**
 * Detect if a URL looks like a direct media file.
 */
export function isDirectMediaUrl(url) {
  try {
    const parsed = new URL(url);
    const ext = parsed.pathname.split('.').pop().toLowerCase();
    return ['mp4', 'mkv', 'webm', 'mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext);
  } catch {
    return false;
  }
}

/**
 * Extract audio from a YouTube URL via the worker.
 * Returns a Blob of the audio data.
 */
export async function extractYouTubeAudio(url, onStatus, isolateVocals = false) {
  onStatus?.(isolateVocals ? 'Extracting & isolating vocals...' : 'Connecting to audio proxy...');

  const response = await fetch(`${WORKER_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, isolateVocals }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Proxy returned ${response.status}`);
  }

  onStatus?.(isolateVocals ? 'Processing vocals...' : 'Downloading audio...');

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('Received empty audio data');
  }

  return blob;
}

/**
 * Proxy-download audio from a direct URL via the worker.
 * Returns a Blob.
 */
export async function proxyDownload(url, onStatus, isolateVocals = false) {
  onStatus?.('Fetching via proxy...');

  // First try direct fetch (works if CORS allows it, only if not isolating vocals)
  if (!isolateVocals) {
    try {
      const directResponse = await fetch(url, { mode: 'cors' });
      if (directResponse.ok) {
        onStatus?.('Downloading...');
        const blob = await directResponse.blob();
        if (blob.size > 0) return blob;
      }
    } catch {
      // CORS blocked — fall through to worker proxy
    }
  }

  // Use worker proxy
  onStatus?.(isolateVocals ? 'Extracting vocals via proxy...' : 'Using proxy...');

  const response = await fetch(`${WORKER_URL}/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, isolateVocals }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Proxy returned ${response.status}`);
  }

  onStatus?.('Downloading...');
  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error('Received empty data');
  }

  return blob;
}

/**
 * Fetch audio from any URL (auto-detects YouTube vs direct).
 * Returns { blob, type }.
 */
export async function fetchAudioFromUrl(url, onStatus, isolateVocals = false) {
  if (isYouTubeUrl(url)) {
    const blob = await extractYouTubeAudio(url, onStatus, isolateVocals);
    return { blob, type: 'youtube' };
  }

  const blob = await proxyDownload(url, onStatus, isolateVocals);
  return { blob, type: 'direct' };
}

/**
 * Check if the worker proxy is available.
 * Returns { online, demucs, whisper }
 */
export async function checkProxyHealth() {
  try {
    const response = await fetch(`${WORKER_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { online: false, demucs: false, whisper: false };
    const data = await response.json();
    return { online: true, demucs: !!data.demucs, whisper: !!data.whisper };
  } catch {
    return { online: false, demucs: false, whisper: false };
  }
}

/**
 * Transcribe audio using Whisper AI.
 * @param {Blob} audioBlob - WAV audio blob
 * @param {boolean} translate - Also translate to English
 * @param {function} onStatus - Status callback
 * @returns {{ language, segments, translation? }}
 */
export async function transcribeAudio(audioBlob, translate = false, onStatus) {
  onStatus?.('Preparing audio...');

  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  onStatus?.(translate ? 'Transcribing + translating...' : 'Transcribing...');

  const response = await fetch(`${WORKER_URL}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64: base64, translate }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Transcription failed: ${response.status}`);
  }

  const result = await response.json();
  onStatus?.('Done!');
  return result;
}
