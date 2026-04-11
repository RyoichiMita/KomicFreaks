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
export async function extractYouTubeAudio(url, onStatus) {
  onStatus?.('Connecting to audio proxy...');

  const response = await fetch(`${WORKER_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Proxy returned ${response.status}`);
  }

  onStatus?.('Downloading audio...');

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
export async function proxyDownload(url, onStatus) {
  onStatus?.('Fetching via proxy...');

  // First try direct fetch (works if CORS allows it)
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

  // Use worker proxy
  onStatus?.('Using proxy...');

  const response = await fetch(`${WORKER_URL}/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
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
export async function fetchAudioFromUrl(url, onStatus) {
  if (isYouTubeUrl(url)) {
    const blob = await extractYouTubeAudio(url, onStatus);
    return { blob, type: 'youtube' };
  }

  const blob = await proxyDownload(url, onStatus);
  return { blob, type: 'direct' };
}

/**
 * Check if the worker proxy is available.
 */
export async function checkProxyHealth() {
  try {
    const response = await fetch(`${WORKER_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}
