/**
 * Komic Freaks Audio Proxy — Cloudflare Worker
 *
 * Extracts audio from YouTube and proxies direct video/audio URLs.
 * Bypasses CORS so the browser app can load audio from any source.
 *
 * Endpoints:
 *   POST /extract  { url: "https://youtube.com/watch?v=..." }
 *   POST /proxy    { url: "https://example.com/video.mp4" }
 *   GET  /health
 */

// --- PIPED API INSTANCES (public, no API key needed) ---
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
];

// --- INVIDIOUS API INSTANCES (fallback) ---
const INVIDIOUS_INSTANCES = [
  'https://invidious.io',
  'https://inv.nadeko.net',
  'https://invidious.private.coffee',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Health check
      if (url.pathname === '/health') {
        return jsonResponse({ status: 'ok', service: 'komic-freaks-audio-proxy' }, 200, corsHeaders);
      }

      // Extract audio from YouTube
      if (url.pathname === '/extract') {
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'POST required' }, 405, corsHeaders);
        }

        const body = await request.json();
        const videoUrl = body.url;

        if (!videoUrl) {
          return jsonResponse({ error: 'Missing url field' }, 400, corsHeaders);
        }

        const videoId = extractYouTubeId(videoUrl);
        if (!videoId) {
          return jsonResponse({ error: 'Invalid YouTube URL' }, 400, corsHeaders);
        }

        // Try Piped API first, then Invidious
        const audioUrl = await getAudioUrl(videoId);
        if (!audioUrl) {
          return jsonResponse({ error: 'Could not extract audio. Try a different video.' }, 502, corsHeaders);
        }

        // Proxy the audio stream back to the client
        const audioResponse = await fetch(audioUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        if (!audioResponse.ok) {
          return jsonResponse({ error: 'Failed to download audio stream' }, 502, corsHeaders);
        }

        // Stream the audio back with CORS headers
        const responseHeaders = new Headers(corsHeaders);
        responseHeaders.set('Content-Type', audioResponse.headers.get('Content-Type') || 'audio/webm');
        responseHeaders.set('Content-Disposition', `attachment; filename="${videoId}.webm"`);

        if (audioResponse.headers.get('Content-Length')) {
          responseHeaders.set('Content-Length', audioResponse.headers.get('Content-Length'));
        }

        return new Response(audioResponse.body, {
          status: 200,
          headers: responseHeaders,
        });
      }

      // Proxy any direct URL
      if (url.pathname === '/proxy') {
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'POST required' }, 405, corsHeaders);
        }

        const body = await request.json();
        const targetUrl = body.url;

        if (!targetUrl) {
          return jsonResponse({ error: 'Missing url field' }, 400, corsHeaders);
        }

        // Validate URL
        try {
          new URL(targetUrl);
        } catch {
          return jsonResponse({ error: 'Invalid URL' }, 400, corsHeaders);
        }

        // Fetch the remote resource
        const proxyResponse = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Referer': new URL(targetUrl).origin,
          },
          redirect: 'follow',
        });

        if (!proxyResponse.ok) {
          return jsonResponse(
            { error: `Remote server returned ${proxyResponse.status}` },
            proxyResponse.status,
            corsHeaders
          );
        }

        // Forward response with CORS headers
        const responseHeaders = new Headers(corsHeaders);
        const contentType = proxyResponse.headers.get('Content-Type') || 'application/octet-stream';
        responseHeaders.set('Content-Type', contentType);

        if (proxyResponse.headers.get('Content-Length')) {
          responseHeaders.set('Content-Length', proxyResponse.headers.get('Content-Length'));
        }

        return new Response(proxyResponse.body, {
          status: 200,
          headers: responseHeaders,
        });
      }

      return jsonResponse({ error: 'Not found. Use /extract or /proxy' }, 404, corsHeaders);
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: err.message || 'Internal error' }, 500, corsHeaders);
    }
  },
};

// ========================================
// YOUTUBE VIDEO ID EXTRACTION
// ========================================
function extractYouTubeId(url) {
  try {
    const parsed = new URL(url);
    // youtube.com/watch?v=ID
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return parsed.searchParams.get('v');
    }
    // youtu.be/ID
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0];
    }
    // youtube.com/embed/ID
    if (parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname.split('/embed/')[1].split('?')[0];
    }
    // youtube.com/shorts/ID
    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.split('/shorts/')[1].split('?')[0];
    }
  } catch {
    // Not a URL
  }
  // Bare video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  return null;
}

// ========================================
// AUDIO URL EXTRACTION (Piped + Invidious)
// ========================================
async function getAudioUrl(videoId) {
  // Try Piped first
  for (const instance of PIPED_INSTANCES) {
    try {
      const resp = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!resp.ok) continue;

      const data = await resp.json();
      const audioStreams = data.audioStreams || [];

      // Pick the best audio stream (prefer opus/webm, highest bitrate)
      const sorted = audioStreams
        .filter((s) => s.url && s.mimeType?.startsWith('audio/'))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

      if (sorted.length > 0) {
        console.log(`[Piped] Got audio for ${videoId} from ${instance}`);
        return sorted[0].url;
      }
    } catch (err) {
      console.log(`[Piped] ${instance} failed:`, err.message);
    }
  }

  // Fallback: Invidious
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const resp = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!resp.ok) continue;

      const data = await resp.json();
      const adaptiveFormats = data.adaptiveFormats || [];

      // Pick audio-only stream
      const audioFormats = adaptiveFormats
        .filter((f) => f.type?.startsWith('audio/'))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

      if (audioFormats.length > 0) {
        console.log(`[Invidious] Got audio for ${videoId} from ${instance}`);
        return audioFormats[0].url;
      }
    } catch (err) {
      console.log(`[Invidious] ${instance} failed:`, err.message);
    }
  }

  return null;
}

// ========================================
// HELPERS
// ========================================
function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
