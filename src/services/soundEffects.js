/**
 * Synthesized Anime Sound Effects using Web Audio API
 * Generates short clips in-browser — no external files needed
 */

let audioContext = null;

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Generate a simple tone buffer
 */
function generateTone(frequency, duration, type = 'sine', volume = 0.5) {
  const ctx = getContext();
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, (length - i) / (sampleRate * 0.05)) * Math.min(1, i / (sampleRate * 0.01));
    let sample;

    switch (type) {
      case 'square':
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
        break;
      case 'sawtooth':
        sample = 2 * (frequency * t % 1) - 1;
        break;
      case 'triangle':
        sample = Math.abs(4 * (frequency * t % 1) - 2) - 1;
        break;
      default:
        sample = Math.sin(2 * Math.PI * frequency * t);
    }

    data[i] = sample * envelope * volume;
  }
  return buffer;
}

/**
 * Mix multiple buffers into one
 */
function mixBuffers(buffers) {
  const ctx = getContext();
  const maxLength = Math.max(...buffers.map(b => b.length));
  const mixed = ctx.createBuffer(1, maxLength, ctx.sampleRate);
  const output = mixed.getChannelData(0);

  for (const buffer of buffers) {
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      output[i] += data[i];
    }
  }

  // Normalize to prevent clipping
  let max = 0;
  for (let i = 0; i < output.length; i++) {
    if (Math.abs(output[i]) > max) max = Math.abs(output[i]);
  }
  if (max > 1) {
    for (let i = 0; i < output.length; i++) {
      output[i] /= max;
    }
  }

  return mixed;
}

/**
 * Generate noise buffer
 */
function generateNoise(duration, volume = 0.3) {
  const ctx = getContext();
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const envelope = Math.min(1, (length - i) / (ctx.sampleRate * 0.02)) * Math.min(1, i / (ctx.sampleRate * 0.005));
    data[i] = (Math.random() * 2 - 1) * envelope * volume;
  }
  return buffer;
}

/**
 * Frequency sweep
 */
function generateSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.5) {
  const ctx = getContext();
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / ctx.sampleRate;
    const progress = i / length;
    const freq = startFreq + (endFreq - startFreq) * progress;
    const envelope = Math.min(1, (length - i) / (ctx.sampleRate * 0.05)) * Math.min(1, i / (ctx.sampleRate * 0.005));
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
  }
  return buffer;
}

// ===== Sound Effect Generators =====

const SFX_GENERATORS = {
  // Reactions
  nani: () => {
    // Dramatic rising chord
    return mixBuffers([
      generateSweep(200, 800, 0.6, 'square', 0.3),
      generateSweep(300, 1200, 0.6, 'sine', 0.25),
      generateTone(100, 0.1, 'square', 0.4),
    ]);
  },

  sugoi: () => {
    // Happy sparkle sound
    return mixBuffers([
      generateTone(880, 0.15, 'sine', 0.3),
      generateTone(1100, 0.15, 'sine', 0.25),
      generateTone(1320, 0.3, 'sine', 0.3),
    ]);
  },

  'yare-yare': () => {
    // Descending disappointment
    return mixBuffers([
      generateSweep(400, 200, 0.8, 'triangle', 0.3),
      generateTone(180, 0.3, 'sine', 0.2),
    ]);
  },

  fire: () => {
    // Intense burst
    return mixBuffers([
      generateNoise(0.3, 0.4),
      generateSweep(100, 600, 0.2, 'sawtooth', 0.3),
      generateTone(200, 0.5, 'square', 0.2),
    ]);
  },

  shocked: () => {
    // Dramatic sting
    return mixBuffers([
      generateTone(100, 0.05, 'square', 0.5),
      generateSweep(200, 1500, 0.3, 'sine', 0.4),
    ]);
  },

  heh: () => {
    // Smug chuckle note
    return mixBuffers([
      generateTone(350, 0.2, 'triangle', 0.3),
      generateTone(300, 0.3, 'triangle', 0.25),
    ]);
  },

  // Impact SFX
  explosion: () => {
    return mixBuffers([
      generateNoise(0.8, 0.5),
      generateTone(60, 0.6, 'sine', 0.5),
      generateSweep(200, 30, 0.5, 'sawtooth', 0.3),
    ]);
  },

  electric: () => {
    return mixBuffers([
      generateSweep(2000, 100, 0.3, 'sawtooth', 0.3),
      generateSweep(100, 3000, 0.2, 'square', 0.2),
      generateNoise(0.15, 0.3),
    ]);
  },

  whoosh: () => {
    return mixBuffers([
      generateSweep(200, 2000, 0.3, 'sine', 0.3),
      generateNoise(0.3, 0.2),
    ]);
  },

  sparkle: () => {
    return mixBuffers([
      generateTone(2000, 0.1, 'sine', 0.2),
      generateTone(2500, 0.1, 'sine', 0.2),
      generateTone(3000, 0.15, 'sine', 0.2),
      generateTone(3500, 0.2, 'sine', 0.15),
    ]);
  },

  powerup: () => {
    return mixBuffers([
      generateSweep(200, 1000, 0.5, 'square', 0.25),
      generateSweep(300, 1500, 0.5, 'sine', 0.2),
      generateTone(1500, 0.3, 'sine', 0.3),
    ]);
  },

  punch: () => {
    return mixBuffers([
      generateNoise(0.1, 0.5),
      generateTone(80, 0.15, 'sine', 0.5),
      generateSweep(300, 60, 0.1, 'sawtooth', 0.3),
    ]);
  },

  // Transitions
  ding: () => {
    return mixBuffers([
      generateTone(1000, 0.5, 'sine', 0.4),
      generateTone(1500, 0.3, 'sine', 0.2),
    ]);
  },

  jingle: () => {
    return mixBuffers([
      generateTone(660, 0.15, 'sine', 0.3),
      generateTone(880, 0.15, 'sine', 0.3),
      generateTone(1100, 0.15, 'sine', 0.3),
      generateTone(1320, 0.25, 'sine', 0.3),
    ]);
  },

  announce: () => {
    return mixBuffers([
      generateTone(440, 0.2, 'square', 0.25),
      generateTone(660, 0.2, 'square', 0.25),
      generateTone(880, 0.3, 'square', 0.3),
    ]);
  },

  hit: () => {
    return mixBuffers([
      generateNoise(0.05, 0.4),
      generateTone(150, 0.1, 'sine', 0.5),
    ]);
  },

  star: () => {
    return mixBuffers([
      generateSweep(1000, 2000, 0.2, 'sine', 0.3),
      generateTone(2000, 0.3, 'sine', 0.25),
    ]);
  },

  action: () => {
    return mixBuffers([
      generateTone(200, 0.1, 'square', 0.3),
      generateSweep(200, 800, 0.3, 'sawtooth', 0.25),
      generateTone(800, 0.2, 'sine', 0.3),
    ]);
  },

  // Anime Vibes
  pirates: () => {
    return mixBuffers([
      generateTone(220, 0.2, 'sawtooth', 0.25),
      generateTone(330, 0.2, 'sawtooth', 0.25),
      generateTone(440, 0.3, 'sawtooth', 0.3),
    ]);
  },

  sword: () => {
    return mixBuffers([
      generateSweep(500, 3000, 0.15, 'sawtooth', 0.3),
      generateNoise(0.1, 0.3),
      generateTone(3000, 0.2, 'sine', 0.15),
    ]);
  },

  dragon: () => {
    return mixBuffers([
      generateSweep(100, 40, 1.0, 'sawtooth', 0.3),
      generateNoise(0.5, 0.25),
      generateTone(60, 0.8, 'sine', 0.3),
    ]);
  },

  dojo: () => {
    return mixBuffers([
      generateTone(200, 0.5, 'sine', 0.3),
      generateTone(300, 0.3, 'sine', 0.2),
      generateTone(400, 0.4, 'sine', 0.25),
    ]);
  },

  sakura: () => {
    return mixBuffers([
      generateTone(1200, 0.2, 'sine', 0.2),
      generateTone(1500, 0.2, 'sine', 0.2),
      generateTone(1800, 0.3, 'sine', 0.2),
      generateTone(2100, 0.2, 'sine', 0.15),
    ]);
  },

  'ora-ora': () => {
    // Rapid punches
    const punches = [];
    for (let i = 0; i < 6; i++) {
      const offset = i * 0.08;
      const ctx = getContext();
      const length = Math.floor(ctx.sampleRate * (0.08 + offset));
      // Generate short punch
      punches.push(generateTone(100 + i * 20, 0.06, 'square', 0.35));
    }
    return mixBuffers([
      ...punches,
      generateNoise(0.5, 0.2),
    ]);
  },
};

/**
 * Play a sound effect by name
 */
export function playSFX(soundId) {
  const ctx = getContext();
  const generator = SFX_GENERATORS[soundId];

  if (!generator) {
    console.warn(`Unknown SFX: ${soundId}`);
    return;
  }

  const buffer = generator();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}

/**
 * Get the duration of a sound effect
 */
export function getSFXDuration(soundId) {
  const generator = SFX_GENERATORS[soundId];
  if (!generator) return 1;

  const buffer = generator();
  return buffer.duration;
}

/**
 * Export a sound effect as a blob URL for use in timeline
 */
export function getSFXBlobUrl(soundId) {
  const generator = SFX_GENERATORS[soundId];
  if (!generator) return null;

  const buffer = generator();
  const ctx = getContext();

  // Render to WAV
  const length = buffer.length;
  const channels = 1;
  const sampleRate = ctx.sampleRate;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = length * channels * bitsPerSample / 8;

  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  // WAV header
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write audio data
  const data = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
