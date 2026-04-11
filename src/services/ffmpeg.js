import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let loadingPromise = null;

/**
 * Get or initialize the FFmpeg instance.
 * Uses SharedArrayBuffer if available, falls back to single-threaded.
 */
export async function getFFmpeg() {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    // Load FFmpeg WASM binaries from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

/**
 * Trim a video file.
 */
export async function trimVideo(inputFile, startTime, duration, onProgress) {
  const ffmpeg = await getFFmpeg();

  const inputName = 'input' + getExtension(inputFile.name);
  const outputName = 'trimmed.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  await ffmpeg.exec([
    '-i', inputName,
    '-ss', String(startTime),
    '-t', String(duration),
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-preset', 'ultrafast',
    '-movflags', '+faststart',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });

  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

/**
 * Concatenate multiple video clips into one.
 */
export async function concatenateVideos(clips, onProgress) {
  const ffmpeg = await getFFmpeg();

  // Write all input files
  const inputFiles = [];
  for (let i = 0; i < clips.length; i++) {
    const name = `input_${i}.mp4`;
    if (clips[i].file) {
      await ffmpeg.writeFile(name, await fetchFile(clips[i].file));
    } else if (clips[i].url) {
      const response = await fetch(clips[i].url);
      const data = await response.arrayBuffer();
      await ffmpeg.writeFile(name, new Uint8Array(data));
    }
    inputFiles.push(name);
  }

  // Create concat file list
  const concatList = inputFiles.map((f) => `file '${f}'`).join('\n');
  await ffmpeg.writeFile('concat.txt', concatList);

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const outputName = 'output.mp4';
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-preset', 'ultrafast',
    '-movflags', '+faststart',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });

  // Cleanup
  for (const f of inputFiles) {
    await ffmpeg.deleteFile(f);
  }
  await ffmpeg.deleteFile('concat.txt');
  await ffmpeg.deleteFile(outputName);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

/**
 * Merge a video with an audio track (narration/voiceover).
 */
export async function mergeVideoWithAudio(videoSource, audioSource, onProgress) {
  const ffmpeg = await getFFmpeg();

  // Write video
  if (videoSource instanceof File) {
    await ffmpeg.writeFile('video_in.mp4', await fetchFile(videoSource));
  } else {
    const response = await fetch(videoSource);
    const data = await response.arrayBuffer();
    await ffmpeg.writeFile('video_in.mp4', new Uint8Array(data));
  }

  // Write audio
  if (audioSource instanceof Blob) {
    const data = await audioSource.arrayBuffer();
    await ffmpeg.writeFile('audio_in.mp3', new Uint8Array(data));
  } else {
    const response = await fetch(audioSource);
    const data = await response.arrayBuffer();
    await ffmpeg.writeFile('audio_in.mp3', new Uint8Array(data));
  }

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const outputName = 'merged.mp4';
  await ffmpeg.exec([
    '-i', 'video_in.mp4',
    '-i', 'audio_in.mp3',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    '-movflags', '+faststart',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });

  await ffmpeg.deleteFile('video_in.mp4');
  await ffmpeg.deleteFile('audio_in.mp3');
  await ffmpeg.deleteFile(outputName);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

/**
 * Extract a thumbnail frame from a video at a specific time.
 */
export async function extractFrame(videoSource, timeSeconds) {
  const ffmpeg = await getFFmpeg();

  if (videoSource instanceof File) {
    await ffmpeg.writeFile('frame_in.mp4', await fetchFile(videoSource));
  } else {
    const response = await fetch(videoSource);
    const data = await response.arrayBuffer();
    await ffmpeg.writeFile('frame_in.mp4', new Uint8Array(data));
  }

  await ffmpeg.exec([
    '-i', 'frame_in.mp4',
    '-ss', String(timeSeconds),
    '-frames:v', '1',
    '-q:v', '2',
    'frame.jpg',
  ]);

  const data = await ffmpeg.readFile('frame.jpg');
  const blob = new Blob([data.buffer], { type: 'image/jpeg' });

  await ffmpeg.deleteFile('frame_in.mp4');
  await ffmpeg.deleteFile('frame.jpg');

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

/**
 * Export the final video with YouTube-optimized settings.
 */
export async function exportForYouTube(videoSource, onProgress) {
  const ffmpeg = await getFFmpeg();

  if (videoSource instanceof File) {
    await ffmpeg.writeFile('export_in.mp4', await fetchFile(videoSource));
  } else {
    const response = await fetch(videoSource);
    const data = await response.arrayBuffer();
    await ffmpeg.writeFile('export_in.mp4', new Uint8Array(data));
  }

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const outputName = 'youtube_ready.mp4';
  await ffmpeg.exec([
    '-i', 'export_in.mp4',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-r', '30',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });

  await ffmpeg.deleteFile('export_in.mp4');
  await ffmpeg.deleteFile(outputName);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

function getExtension(filename) {
  const ext = filename.split('.').pop();
  return ext ? `.${ext}` : '.mp4';
}

/**
 * Export with multi-track audio mixing.
 * Takes all tracks from the store and merges them into a single MP4.
 *
 * Strategy:
 * 1. Concatenate video clips into a base video
 * 2. Write each audio track clip as a separate audio input
 * 3. Use FFmpeg's amix filter to combine all audio streams
 * 4. Output a single YouTube-ready MP4
 */
export async function exportMultiTrack(tracks, projectName, onProgress, onStatus) {
  const ffmpeg = await getFFmpeg();

  const videoTrack = tracks.find((t) => t.id === 'video');
  const audioTracks = tracks.filter((t) => t.type !== 'video');

  const videoClips = (videoTrack?.clips || [])
    .filter((c) => c.url)
    .sort((a, b) => (a.offset || 0) - (b.offset || 0));

  if (videoClips.length === 0) {
    throw new Error('No video clips to export. Add a video first!');
  }

  let progressScale = 0;
  const report = (pct) => onProgress && onProgress(Math.min(99, Math.round(pct)));

  // ==========================================
  // STEP 1: Write video inputs
  // ==========================================
  onStatus && onStatus('Preparing video clips...');
  const videoInputFiles = [];

  for (let i = 0; i < videoClips.length; i++) {
    const clip = videoClips[i];
    const name = `video_${i}.mp4`;

    const response = await fetch(clip.url);
    const data = await response.arrayBuffer();
    await ffmpeg.writeFile(name, new Uint8Array(data));
    videoInputFiles.push(name);
    report((i / videoClips.length) * 20);
  }

  // ==========================================
  // STEP 2: Prepare base video
  // ==========================================
  let baseVideoFile;

  if (videoInputFiles.length === 1) {
    baseVideoFile = videoInputFiles[0];
  } else {
    onStatus && onStatus('Concatenating video clips...');
    const concatList = videoInputFiles.map((f) => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('concat.txt', concatList);

    baseVideoFile = 'base_video.mp4';
    ffmpeg.on('progress', ({ progress }) => {
      report(20 + progress * 20);
    });

    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'ultrafast',
      '-movflags', '+faststart',
      baseVideoFile,
    ]);

    await ffmpeg.deleteFile('concat.txt');
  }

  report(40);

  // ==========================================
  // STEP 3: Collect audio clips from all non-video tracks
  // ==========================================
  onStatus && onStatus('Preparing audio tracks...');
  const audioInputs = []; // { file, offset, volume, trackId }

  for (const track of audioTracks) {
    if (track.muted) continue;

    for (const clip of track.clips) {
      if (!clip.url) continue;

      const audioName = `audio_${audioInputs.length}.wav`;
      try {
        const response = await fetch(clip.url);
        const data = await response.arrayBuffer();
        await ffmpeg.writeFile(audioName, new Uint8Array(data));

        audioInputs.push({
          file: audioName,
          offset: clip.offset || 0,
          volume: track.volume,
          duration: clip.duration || 0,
          loop: !!clip.loop,
        });
      } catch (err) {
        console.warn(`Skipping audio clip: ${clip.name}`, err);
      }
    }
  }

  report(50);

  // ==========================================
  // STEP 4: Mix audio with video
  // ==========================================
  const outputName = 'final_export.mp4';

  if (audioInputs.length === 0) {
    // No extra audio — just re-encode the base video
    onStatus && onStatus('Encoding final video...');
    ffmpeg.on('progress', ({ progress }) => {
      report(50 + progress * 50);
    });

    await ffmpeg.exec([
      '-i', baseVideoFile,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-r', '30',
      outputName,
    ]);
  } else {
    onStatus && onStatus(`Mixing ${audioInputs.length} audio track(s)...`);

    // Build FFmpeg command with multiple inputs
    const args = ['-i', baseVideoFile];

    for (const input of audioInputs) {
      args.push('-i', input.file);
    }

    // Build the filter graph
    // Input 0 = video (with its own audio track)
    // Input 1..N = additional audio clips

    const totalInputs = audioInputs.length + 1;
    const filterParts = [];

    // Extract video's original audio and apply video track volume
    const vTrack = tracks.find((t) => t.id === 'video');
    const videoVol = vTrack?.muted ? 0 : (vTrack?.volume ?? 1);
    filterParts.push(`[0:a]volume=${videoVol}[v_audio]`);

    // Process each additional audio input
    const mixInputLabels = ['[v_audio]'];

    for (let i = 0; i < audioInputs.length; i++) {
      const input = audioInputs[i];
      const inputIdx = i + 1;
      const label = `[a${i}]`;

      // Apply volume + delay to position the clip on the timeline
      const delayMs = Math.round(input.offset * 1000);
      filterParts.push(
        `[${inputIdx}:a]volume=${input.volume},adelay=${delayMs}|${delayMs}${label}`
      );
      mixInputLabels.push(label);
    }

    // Mix all audio streams together
    const mixFilter = `${mixInputLabels.join('')}amix=inputs=${totalInputs}:duration=longest:dropout_transition=2[mixed]`;
    filterParts.push(mixFilter);

    const filterGraph = filterParts.join(';');

    ffmpeg.on('progress', ({ progress }) => {
      report(50 + progress * 50);
    });

    await ffmpeg.exec([
      ...args,
      '-filter_complex', filterGraph,
      '-map', '0:v:0',
      '-map', '[mixed]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-r', '30',
      '-shortest',
      outputName,
    ]);
  }

  report(98);
  onStatus && onStatus('Finalizing...');

  // ==========================================
  // STEP 5: Read output and cleanup
  // ==========================================
  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });

  // Cleanup all temp files
  for (const f of videoInputFiles) {
    try { await ffmpeg.deleteFile(f); } catch (e) {}
  }
  for (const input of audioInputs) {
    try { await ffmpeg.deleteFile(input.file); } catch (e) {}
  }
  if (baseVideoFile !== videoInputFiles[0]) {
    try { await ffmpeg.deleteFile(baseVideoFile); } catch (e) {}
  }
  try { await ffmpeg.deleteFile(outputName); } catch (e) {}

  report(100);
  onStatus && onStatus('Export complete! 🎉');

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
  };
}
