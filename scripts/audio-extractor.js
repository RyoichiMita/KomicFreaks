#!/usr/bin/env node
/**
 * Local Audio Extractor Server
 * Uses yt-dlp + Demucs for YouTube extraction & vocal isolation.
 * Runs alongside the Vite dev server on port 8787.
 *
 * Usage: node scripts/audio-extractor.js
 */

import http from 'node:http';
import { exec } from 'node:child_process';
import { readFile, unlink, mkdtemp, readdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const PORT = 8787;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const VENV_PYTHON = join(PROJECT_ROOT, '.venv', 'bin', 'python');

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

function execPromise(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    console.log(`[exec] ${cmd.substring(0, 120)}...`);
    exec(cmd, { timeout: 300000, maxBuffer: 50 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) {
        console.error('[exec] stderr:', stderr?.substring(0, 500));
        reject(new Error(stderr?.split('\n').find(l => l.includes('ERROR')) || err.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function downloadWithYtDlp(url, outputPath) {
  const cmd = `yt-dlp -x --audio-format wav --no-playlist -o "${outputPath}" "${url}"`;
  console.log(`[yt-dlp] Extracting: ${url}`);
  await execPromise(cmd);
  const buffer = await readFile(outputPath);
  console.log(`[yt-dlp] ✅ Extracted ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
  return buffer;
}

/**
 * Isolate vocals from an audio file using Demucs.
 * Returns a Buffer with the vocals-only WAV.
 */
async function isolateVocals(inputPath, tmpDir) {
  const outputDir = join(tmpDir, 'separated');
  
  // Use htdemucs (fastest model) with 2-stem mode (vocals + no_vocals)
  const cmd = `"${VENV_PYTHON}" -m demucs --two-stems vocals -n htdemucs --out "${outputDir}" "${inputPath}"`;
  
  console.log(`[demucs] 🎤 Isolating vocals...`);
  const start = Date.now();
  await execPromise(cmd);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[demucs] ✅ Vocal isolation complete (${elapsed}s)`);

  // Find the vocals output file
  // Demucs outputs to: outputDir/htdemucs/<filename>/vocals.wav
  const htdemucsDir = join(outputDir, 'htdemucs');
  const trackDirs = await readdir(htdemucsDir);
  const vocalsPath = join(htdemucsDir, trackDirs[0], 'vocals.wav');

  if (!existsSync(vocalsPath)) {
    throw new Error('Demucs did not produce vocals output');
  }

  const buffer = await readFile(vocalsPath);
  console.log(`[demucs] 🎤 Vocals: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
  return buffer;
}

// ─── Check Demucs availability ───
let demucsAvailable = false;
try {
  if (existsSync(VENV_PYTHON)) {
    const { stdout } = await execPromise(`"${VENV_PYTHON}" -c "import demucs; print('ok')"`);
    demucsAvailable = stdout.trim() === 'ok';
  }
} catch {}
console.log(`[init] Demucs: ${demucsAvailable ? '✅ available' : '❌ not available'}`);

// ─── Server ───
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (reqUrl.pathname === '/health') {
    return jsonResponse(res, {
      status: 'ok',
      service: 'komic-freaks-audio-proxy',
      engine: 'yt-dlp',
      demucs: demucsAvailable,
    });
  }

  // YouTube extraction (with optional vocal isolation)
  if (reqUrl.pathname === '/extract' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), 'komic-'));
      try {
        const { url: videoUrl, isolateVocals: doIsolate } = JSON.parse(body);
        if (!videoUrl) return jsonResponse(res, { error: 'Missing url field' }, 400);

        const videoId = extractYouTubeId(videoUrl);
        if (!videoId) return jsonResponse(res, { error: 'Invalid YouTube URL' }, 400);

        const audioPath = join(tmpDir, 'audio.wav');
        await downloadWithYtDlp(videoUrl, audioPath);

        let buffer;
        if (doIsolate && demucsAvailable) {
          buffer = await isolateVocals(audioPath, tmpDir);
        } else {
          buffer = await readFile(audioPath);
        }

        res.writeHead(200, {
          ...CORS_HEADERS,
          'Content-Type': 'audio/wav',
          'Content-Length': buffer.length,
          'Content-Disposition': `attachment; filename="${videoId}${doIsolate ? '_vocals' : ''}.wav"`,
        });
        res.end(buffer);
      } catch (err) {
        console.error('[extract] Failed:', err.message);
        jsonResponse(res, { error: err.message || 'Extraction failed' }, 502);
      } finally {
        rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    });
    return;
  }

  // Standalone vocal isolation (POST audio file, get vocals back)
  if (reqUrl.pathname === '/isolate' && req.method === 'POST') {
    if (!demucsAvailable) {
      return jsonResponse(res, { error: 'Demucs not installed. Run: python3 -m venv .venv && source .venv/bin/activate && pip install demucs' }, 501);
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), 'komic-isolate-'));
      try {
        const inputBuffer = Buffer.concat(chunks);
        const inputPath = join(tmpDir, 'input.wav');
        const { writeFile } = await import('node:fs/promises');
        await writeFile(inputPath, inputBuffer);

        console.log(`[isolate] Received ${(inputBuffer.length / 1024 / 1024).toFixed(1)}MB audio`);
        const vocalsBuffer = await isolateVocals(inputPath, tmpDir);

        res.writeHead(200, {
          ...CORS_HEADERS,
          'Content-Type': 'audio/wav',
          'Content-Length': vocalsBuffer.length,
        });
        res.end(vocalsBuffer);
      } catch (err) {
        console.error('[isolate] Failed:', err.message);
        jsonResponse(res, { error: err.message || 'Vocal isolation failed' }, 502);
      } finally {
        rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    });
    return;
  }

  // Direct URL proxy
  if (reqUrl.pathname === '/proxy' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), 'komic-proxy-'));
      try {
        const { url: targetUrl, isolateVocals: doIsolate } = JSON.parse(body);
        if (!targetUrl) return jsonResponse(res, { error: 'Missing url field' }, 400);

        // Try yt-dlp first (handles many sites)
        let buffer;
        const audioPath = join(tmpDir, 'audio.wav');
        try {
          await downloadWithYtDlp(targetUrl, audioPath);
          if (doIsolate && demucsAvailable) {
            buffer = await isolateVocals(audioPath, tmpDir);
          } else {
            buffer = await readFile(audioPath);
          }
        } catch {
          // yt-dlp failed, try direct fetch
          const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          if (!response.ok) {
            return jsonResponse(res, { error: `Remote returned ${response.status}` }, response.status);
          }
          buffer = Buffer.from(await response.arrayBuffer());
        }

        res.writeHead(200, {
          ...CORS_HEADERS,
          'Content-Type': 'audio/wav',
          'Content-Length': buffer.length,
        });
        res.end(buffer);
      } catch (err) {
        jsonResponse(res, { error: err.message }, 502);
      } finally {
        rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    });
    return;
  }

  jsonResponse(res, { error: 'Not found. Use /extract, /isolate, or /proxy' }, 404);
});

server.listen(PORT, () => {
  console.log(`\n🎬 Komic Freaks Audio Extractor`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Engine: yt-dlp (local)`);
  console.log(`   Demucs: ${demucsAvailable ? '✅ vocal isolation ready' : '❌ not available'}`);
  console.log(`   Ready to extract YouTube audio!\n`);
});
