#!/usr/bin/env node
/**
 * Local Audio Extractor Server
 * Uses yt-dlp (installed via brew) to extract audio from YouTube URLs.
 * Runs alongside the Vite dev server on port 8787.
 *
 * Usage: node scripts/audio-extractor.js
 */

import http from 'node:http';
import { exec } from 'node:child_process';
import { readFile, unlink, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PORT = 8787;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function extractYouTubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0];
    }
    if (parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname.split('/embed/')[1].split('?')[0];
    }
    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.split('/shorts/')[1].split('?')[0];
    }
  } catch {}
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

async function downloadWithYtDlp(url) {
  const tmpDir = await mkdtemp(join(tmpdir(), 'komic-'));
  const outputPath = join(tmpDir, 'audio.wav');

  return new Promise((resolve, reject) => {
    const cmd = `yt-dlp -x --audio-format wav --no-playlist -o "${outputPath}" "${url}"`;
    console.log(`[yt-dlp] Extracting: ${url}`);

    const proc = exec(cmd, { timeout: 120000 }, async (err, stdout, stderr) => {
      if (err) {
        console.error('[yt-dlp] Error:', stderr || err.message);
        reject(new Error(stderr?.split('\n').find(l => l.includes('ERROR')) || err.message));
        return;
      }

      try {
        const buffer = await readFile(outputPath);
        // Cleanup
        unlink(outputPath).catch(() => {});
        console.log(`[yt-dlp] ✅ Extracted ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
        resolve(buffer);
      } catch (readErr) {
        reject(new Error('Failed to read extracted audio'));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === '/health') {
    return jsonResponse(res, { status: 'ok', service: 'komic-freaks-audio-proxy', engine: 'yt-dlp' });
  }

  // YouTube extraction
  if (url.pathname === '/extract' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { url: videoUrl } = JSON.parse(body);
        if (!videoUrl) return jsonResponse(res, { error: 'Missing url field' }, 400);

        const videoId = extractYouTubeId(videoUrl);
        if (!videoId) return jsonResponse(res, { error: 'Invalid YouTube URL' }, 400);

        const buffer = await downloadWithYtDlp(videoUrl);

        res.writeHead(200, {
          ...CORS_HEADERS,
          'Content-Type': 'audio/wav',
          'Content-Length': buffer.length,
          'Content-Disposition': `attachment; filename="${videoId}.wav"`,
        });
        res.end(buffer);
      } catch (err) {
        console.error('[extract] Failed:', err.message);
        jsonResponse(res, { error: err.message || 'Extraction failed' }, 502);
      }
    });
    return;
  }

  // Direct URL proxy
  if (url.pathname === '/proxy' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { url: targetUrl } = JSON.parse(body);
        if (!targetUrl) return jsonResponse(res, { error: 'Missing url field' }, 400);

        // Try yt-dlp first (handles many sites)
        try {
          const buffer = await downloadWithYtDlp(targetUrl);
          res.writeHead(200, {
            ...CORS_HEADERS,
            'Content-Type': 'audio/wav',
            'Content-Length': buffer.length,
          });
          res.end(buffer);
          return;
        } catch {
          // yt-dlp failed, try direct fetch
        }

        // Direct fetch fallback
        const response = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!response.ok) {
          return jsonResponse(res, { error: `Remote returned ${response.status}` }, response.status);
        }

        const data = Buffer.from(await response.arrayBuffer());
        res.writeHead(200, {
          ...CORS_HEADERS,
          'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
          'Content-Length': data.length,
        });
        res.end(data);
      } catch (err) {
        jsonResponse(res, { error: err.message }, 502);
      }
    });
    return;
  }

  jsonResponse(res, { error: 'Not found. Use /extract or /proxy' }, 404);
});

server.listen(PORT, () => {
  console.log(`\n🎬 Komic Freaks Audio Extractor`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Engine: yt-dlp (local)`);
  console.log(`   Ready to extract YouTube audio!\n`);
});
