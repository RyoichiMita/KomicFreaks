import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

const ytDlpPlugin = () => ({
  name: 'yt-dlp-api',
  configureServer(server) {
    server.middlewares.use('/api/ytdlp', (req, res) => {
      // Setup SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const { url, extractAudio, format } = JSON.parse(body);
          if (!url) {
            res.write(`data: ${JSON.stringify({ error: 'URL is required' })}\n\n`);
            return res.end();
          }

          const tempDir = path.resolve(process.cwd(), 'public', 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          
          const outputTemplate = path.join(tempDir, `%(id)s.%(ext)s`);
          
          const args = [
            url,
            '-o', outputTemplate,
            '--no-playlist',
            '--print', 'after_move:filepath',
            '--newline'
          ];
          
          if (extractAudio) {
            args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
          } else if (format === 'video') {
            args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
          }

          res.write(`data: ${JSON.stringify({ progress: 'Starting download...' })}\n\n`);

          const child = spawn('yt-dlp', args);
          let outputPath = '';
          
          child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
              if (line.trim().startsWith('/')) {
                outputPath = line.trim();
              } else if (line.includes('[download]')) {
                res.write(`data: ${JSON.stringify({ progress: line.trim() })}\n\n`);
              }
            }
          });
          
          child.stderr.on('data', (data) => {
            res.write(`data: ${JSON.stringify({ progress: data.toString().trim() })}\n\n`);
          });
          
          child.on('close', (code) => {
            if (code === 0 && outputPath) {
              const fileName = path.basename(outputPath);
              const fileUrl = '/temp/' + fileName;
              res.write(`data: ${JSON.stringify({ done: true, fileUrl, fileName })}\n\n`);
            } else {
              res.write(`data: ${JSON.stringify({ error: 'Download failed' })}\n\n`);
            }
            res.end();
          });

        } catch (e) {
          res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
          res.end();
        }
      });
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ytDlpPlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
