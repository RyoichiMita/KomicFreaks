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
