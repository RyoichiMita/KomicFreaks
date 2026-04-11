/**
 * Background Music Library — Synthesized ambient loops using Web Audio API.
 * Provides loopable background tracks generated in-browser.
 */

let audioContext = null;

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Generate a chord progression buffer (loopable)
 */
function generateChordLoop(chords, noteDuration, waveType = 'sine', volume = 0.15) {
  const ctx = getContext();
  const totalDuration = chords.length * noteDuration;
  const length = Math.floor(ctx.sampleRate * totalDuration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  chords.forEach((chord, chordIdx) => {
    const startSample = Math.floor(chordIdx * noteDuration * ctx.sampleRate);
    const endSample = Math.floor((chordIdx + 1) * noteDuration * ctx.sampleRate);
    const chordLen = endSample - startSample;

    chord.forEach((freq) => {
      for (let i = 0; i < chordLen; i++) {
        const t = i / ctx.sampleRate;
        const progress = i / chordLen;
        // Soft attack/release envelope
        const attack = Math.min(1, i / (ctx.sampleRate * 0.05));
        const release = Math.min(1, (chordLen - i) / (ctx.sampleRate * 0.08));
        const envelope = attack * release;

        let sample;
        switch (waveType) {
          case 'triangle':
            sample = Math.abs(4 * (freq * t % 1) - 2) - 1;
            break;
          case 'square':
            sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
            break;
          default:
            sample = Math.sin(2 * Math.PI * freq * t);
        }

        data[startSample + i] += sample * envelope * (volume / chord.length);
      }
    });
  });

  // Normalize
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > max) max = Math.abs(data[i]);
  }
  if (max > 0.9) {
    const scale = 0.9 / max;
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }

  return buffer;
}

/**
 * Generate a simple beat pattern
 */
function generateBeat(bpm, bars, volume = 0.2) {
  const ctx = getContext();
  const beatDuration = 60 / bpm;
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;
  const totalDuration = totalBeats * beatDuration;
  const length = Math.floor(ctx.sampleRate * totalDuration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let beat = 0; beat < totalBeats; beat++) {
    const startSample = Math.floor(beat * beatDuration * ctx.sampleRate);
    const isKick = beat % 4 === 0;
    const isSnare = beat % 4 === 2;
    const isHat = true;

    const tickLen = Math.floor(0.05 * ctx.sampleRate);

    for (let i = 0; i < tickLen && (startSample + i) < length; i++) {
      const t = i / ctx.sampleRate;
      const envelope = 1 - (i / tickLen);

      if (isKick) {
        const freq = 60 * Math.pow(2, -t * 8);
        data[startSample + i] += Math.sin(2 * Math.PI * freq * t) * envelope * volume * 1.5;
      }
      if (isSnare) {
        data[startSample + i] += (Math.random() * 2 - 1) * envelope * volume * 0.6;
      }
      if (isHat) {
        const hatLen = Math.floor(0.015 * ctx.sampleRate);
        if (i < hatLen) {
          data[startSample + i] += (Math.random() * 2 - 1) * (1 - i / hatLen) * volume * 0.25;
        }
      }
    }
  }

  return buffer;
}

/**
 * Mix two buffers
 */
function mixTwo(buf1, buf2) {
  const ctx = getContext();
  const maxLen = Math.max(buf1.length, buf2.length);
  const mixed = ctx.createBuffer(1, maxLen, ctx.sampleRate);
  const out = mixed.getChannelData(0);
  const d1 = buf1.getChannelData(0);
  const d2 = buf2.getChannelData(0);

  for (let i = 0; i < maxLen; i++) {
    out[i] = (i < d1.length ? d1[i] : 0) + (i < d2.length ? d2[i] : 0);
  }

  // Soft clamp
  let max = 0;
  for (let i = 0; i < out.length; i++) {
    if (Math.abs(out[i]) > max) max = Math.abs(out[i]);
  }
  if (max > 0.95) {
    const scale = 0.95 / max;
    for (let i = 0; i < out.length; i++) out[i] *= scale;
  }

  return mixed;
}

// ========= Music Track Definitions =========

export const MUSIC_TRACKS = [
  {
    id: 'chill-lofi',
    name: 'Chill Lo-Fi',
    emoji: '🎧',
    mood: 'Relaxed',
    bpm: 75,
    description: 'Mellow lo-fi vibes for chill reviews',
  },
  {
    id: 'epic-battle',
    name: 'Epic Battle',
    emoji: '⚔️',
    mood: 'Intense',
    bpm: 140,
    description: 'Dramatic energy for action figure battles',
  },
  {
    id: 'anime-opening',
    name: 'Anime Opening',
    emoji: '🌟',
    mood: 'Hype',
    bpm: 160,
    description: 'Energetic J-pop inspired opening vibes',
  },
  {
    id: 'mystery-box',
    name: 'Mystery Box',
    emoji: '📦',
    mood: 'Suspense',
    bpm: 90,
    description: 'Tension-building for unboxing reveals',
  },
  {
    id: 'sakura-breeze',
    name: 'Sakura Breeze',
    emoji: '🌸',
    mood: 'Peaceful',
    bpm: 60,
    description: 'Gentle ambient for figure showcases',
  },
  {
    id: 'pirate-shanty',
    name: 'Pirate Shanty',
    emoji: '🏴‍☠️',
    mood: 'Adventure',
    bpm: 120,
    description: 'One Piece inspired sea shanty feel',
  },
];

// Music generators (create ~8 second loops)
const MUSIC_GENERATORS = {
  'chill-lofi': () => {
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [293.66, 369.99, 440.00], // D minor-ish
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33], // G major
    ];
    return generateChordLoop(chords, 2.0, 'triangle', 0.15);
  },

  'epic-battle': () => {
    const chords = [
      [130.81, 164.81, 196.00], // C low
      [146.83, 185.00, 220.00], // D minor
      [110.00, 138.59, 164.81], // A low
      [123.47, 155.56, 196.00], // B dim
    ];
    const melody = generateChordLoop(chords, 1.0, 'sawtooth', 0.12);
    const beat = generateBeat(140, 2, 0.25);
    return mixTwo(melody, beat);
  },

  'anime-opening': () => {
    const chords = [
      [329.63, 415.30, 493.88],
      [349.23, 440.00, 523.25],
      [392.00, 493.88, 587.33],
      [440.00, 554.37, 659.25],
    ];
    const melody = generateChordLoop(chords, 0.75, 'square', 0.1);
    const beat = generateBeat(160, 2, 0.2);
    return mixTwo(melody, beat);
  },

  'mystery-box': () => {
    const chords = [
      [196.00, 246.94],
      [207.65, 261.63],
      [220.00, 277.18],
      [207.65, 261.63],
    ];
    return generateChordLoop(chords, 2.0, 'sine', 0.18);
  },

  'sakura-breeze': () => {
    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.00],
      [523.25, 659.25, 783.99],
      [493.88, 622.25, 739.99],
    ];
    return generateChordLoop(chords, 2.5, 'sine', 0.12);
  },

  'pirate-shanty': () => {
    const chords = [
      [196.00, 246.94, 293.66],
      [220.00, 277.18, 329.63],
      [246.94, 311.13, 369.99],
      [220.00, 277.18, 329.63],
    ];
    const melody = generateChordLoop(chords, 1.0, 'triangle', 0.15);
    const beat = generateBeat(120, 2, 0.2);
    return mixTwo(melody, beat);
  },
};

let currentSource = null;

/**
 * Preview play a music track
 */
export function previewMusic(trackId) {
  stopPreview();

  const ctx = getContext();
  const generator = MUSIC_GENERATORS[trackId];
  if (!generator) return;

  const buffer = generator();
  currentSource = ctx.createBufferSource();
  currentSource.buffer = buffer;
  currentSource.loop = true;
  currentSource.connect(ctx.destination);
  currentSource.start();
}

/**
 * Stop preview
 */
export function stopPreview() {
  if (currentSource) {
    try { currentSource.stop(); } catch (e) { /* already stopped */ }
    currentSource = null;
  }
}

/**
 * Get music duration
 */
export function getMusicDuration(trackId) {
  const generator = MUSIC_GENERATORS[trackId];
  if (!generator) return 8;
  return generator().duration;
}

/**
 * Get music as blob URL for timeline
 */
export function getMusicBlobUrl(trackId) {
  const generator = MUSIC_GENERATORS[trackId];
  if (!generator) return null;

  const buffer = generator();
  const ctx = getContext();
  const length = buffer.length;
  const sampleRate = ctx.sampleRate;
  const bitsPerSample = 16;
  const channels = 1;
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = length * channels * bitsPerSample / 8;

  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

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
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

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
