/**
 * AutoCut Service — AI-powered silence detection and auto-editing
 * 
 * Uses Web Audio API to analyze audio waveform and detect silence gaps.
 * This is cross-browser compatible (no FFmpeg required for detection).
 * FFmpeg is only used for the final export.
 */

/**
 * Analyzes a video/audio file and detects segments of speech vs silence.
 * 
 * @param {File} file - The media file to analyze
 * @param {Object} options - Detection parameters
 * @param {number} options.silenceThreshold - Volume below this (0-1) = silence. Default 0.01
 * @param {number} options.minSilenceDuration - Minimum silence gap to detect (seconds). Default 0.3
 * @param {number} options.padding - Seconds of breathing room around cuts. Default 0.05
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeAudio(file, options = {}, onProgress = () => {}) {
  const {
    silenceThreshold = 0.015,
    minSilenceDuration = 0.3,
    padding = 0.05,
  } = options;

  onProgress(5);

  // Decode audio using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  
  onProgress(20);
  
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  onProgress(40);

  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const channelData = audioBuffer.getChannelData(0); // Use first channel

  // Compute RMS energy in windows
  const windowSize = Math.floor(sampleRate * 0.02); // 20ms windows
  const hopSize = Math.floor(windowSize / 2); // 50% overlap
  const numWindows = Math.floor((channelData.length - windowSize) / hopSize);
  
  const energyProfile = [];
  
  for (let i = 0; i < numWindows; i++) {
    const start = i * hopSize;
    let sumSquares = 0;
    
    for (let j = start; j < start + windowSize && j < channelData.length; j++) {
      sumSquares += channelData[j] * channelData[j];
    }
    
    const rms = Math.sqrt(sumSquares / windowSize);
    energyProfile.push({
      time: start / sampleRate,
      energy: rms,
    });

    if (i % 1000 === 0) {
      onProgress(40 + (i / numWindows) * 40);
    }
  }

  onProgress(80);

  // Detect silence regions
  const silenceRegions = [];
  let inSilence = false;
  let silenceStart = 0;

  for (let i = 0; i < energyProfile.length; i++) {
    const { time, energy } = energyProfile[i];

    if (energy < silenceThreshold) {
      if (!inSilence) {
        inSilence = true;
        silenceStart = time;
      }
    } else {
      if (inSilence) {
        const silenceDuration = time - silenceStart;
        if (silenceDuration >= minSilenceDuration) {
          silenceRegions.push({
            start: silenceStart,
            end: time,
            duration: silenceDuration,
          });
        }
        inSilence = false;
      }
    }
  }

  // Handle trailing silence
  if (inSilence) {
    const endTime = channelData.length / sampleRate;
    const silenceDuration = endTime - silenceStart;
    if (silenceDuration >= minSilenceDuration) {
      silenceRegions.push({
        start: silenceStart,
        end: endTime,
        duration: silenceDuration,
      });
    }
  }

  onProgress(90);

  // Build speech segments (inverse of silence)
  const speechSegments = [];
  let cursor = 0;

  for (const silence of silenceRegions) {
    const segStart = Math.max(0, cursor - padding);
    const segEnd = Math.min(duration, silence.start + padding);

    if (segEnd - segStart > 0.1) {
      speechSegments.push({
        id: `seg_${speechSegments.length}`,
        start: segStart,
        end: segEnd,
        duration: segEnd - segStart,
        keep: true,
      });
    }

    cursor = silence.end;
  }

  // Add final segment if needed
  if (cursor < duration) {
    const segStart = Math.max(0, cursor - padding);
    if (duration - segStart > 0.1) {
      speechSegments.push({
        id: `seg_${speechSegments.length}`,
        start: segStart,
        end: duration,
        duration: duration - segStart,
        keep: true,
      });
    }
  }

  // Merge segments that are very close together (< 0.15s gap)
  const mergedSegments = [];
  for (const seg of speechSegments) {
    if (mergedSegments.length > 0) {
      const last = mergedSegments[mergedSegments.length - 1];
      if (seg.start - last.end < 0.15) {
        last.end = seg.end;
        last.duration = last.end - last.start;
        continue;
      }
    }
    mergedSegments.push({ ...seg, id: `seg_${mergedSegments.length}` });
  }

  onProgress(95);

  // Calculate stats
  const totalSpeech = mergedSegments.reduce((sum, s) => sum + s.duration, 0);
  const totalSilence = duration - totalSpeech;
  const timeSaved = totalSilence;
  const outputDuration = totalSpeech;

  // Create waveform data for visualization (downsampled)
  const waveformSamples = 500;
  const samplesPerBucket = Math.floor(channelData.length / waveformSamples);
  const waveform = [];
  
  for (let i = 0; i < waveformSamples; i++) {
    const start = i * samplesPerBucket;
    let max = 0;
    for (let j = start; j < start + samplesPerBucket && j < channelData.length; j++) {
      max = Math.max(max, Math.abs(channelData[j]));
    }
    waveform.push({
      time: (i / waveformSamples) * duration,
      amplitude: max,
    });
  }

  onProgress(100);

  audioContext.close();

  return {
    duration,
    sampleRate,
    silenceRegions,
    segments: mergedSegments,
    waveform,
    stats: {
      totalSegments: mergedSegments.length,
      totalSpeech: Math.round(totalSpeech * 10) / 10,
      totalSilence: Math.round(totalSilence * 10) / 10,
      timeSaved: Math.round(timeSaved * 10) / 10,
      outputDuration: Math.round(outputDuration * 10) / 10,
      compressionRatio: Math.round((outputDuration / duration) * 100),
    },
  };
}

/**
 * Generates FFmpeg trim commands for keeping only speech segments.
 * @param {Array} segments - Speech segments from analyzeAudio
 * @returns {Object} - { filterComplex, trimList }
 */
export function generateCutList(segments) {
  const keptSegments = segments.filter((s) => s.keep);
  
  const trimList = keptSegments.map((seg, i) => ({
    index: i,
    start: seg.start,
    end: seg.end,
    duration: seg.duration,
  }));

  // Build FFmpeg filter_complex for concatenation
  const filters = keptSegments.map((seg, i) => {
    return `[0:v]trim=start=${seg.start.toFixed(3)}:end=${seg.end.toFixed(3)},setpts=PTS-STARTPTS[v${i}];` +
           `[0:a]atrim=start=${seg.start.toFixed(3)}:end=${seg.end.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`;
  });

  const concatInputs = keptSegments.map((_, i) => `[v${i}][a${i}]`).join('');
  const concatFilter = `${concatInputs}concat=n=${keptSegments.length}:v=1:a=1[outv][outa]`;

  return {
    filterComplex: [...filters, concatFilter].join(';\n'),
    trimList,
    outputMaps: ['-map', '[outv]', '-map', '[outa]'],
  };
}

/**
 * Generates a preview of what the auto-cut video would look like
 * by calculating time saved and segment count.
 */
export function getAutoCutPreview(segments) {
  const kept = segments.filter((s) => s.keep);
  const removed = segments.filter((s) => !s.keep);

  return {
    keptCount: kept.length,
    removedCount: removed.length,
    keptDuration: kept.reduce((sum, s) => sum + s.duration, 0),
    removedDuration: removed.reduce((sum, s) => sum + s.duration, 0),
  };
}
