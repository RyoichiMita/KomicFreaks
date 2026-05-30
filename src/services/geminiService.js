/**
 * Gemini Service — Image generation for Komic Freaks Studio
 *
 * Uses Gemini 2.5 Flash Image (gemini-2.5-flash-image) via REST API.
 * Handles:
 * - Text-to-image generation (scene backgrounds)
 * - Image + text editing (upload figure → generate background)
 * - Base64 image handling
 * - IndexedDB gallery persistence
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-3.1-flash-image-preview';
const API_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// --- Scene Presets ---
export const SCENE_PRESETS = [
  {
    id: 'namek',
    name: 'Planet Namek',
    emoji: '🌍',
    prompt: 'The alien landscape of Planet Namek from Dragon Ball Z. Green sky with multiple suns, Namekian villages with round dome buildings in the background, lush blue-green grass fields, alien trees, dramatic lighting. Cinematic anime style.',
  },
  {
    id: 'tournament',
    name: 'Tournament of Power',
    emoji: '🏟️',
    prompt: 'The Tournament of Power arena from Dragon Ball Super. A massive floating fighting stage surrounded by cosmic void, spectator stands filled with gods and angels, dramatic purple and blue cosmic energy swirling, cracking arena floor. Epic anime battle scene.',
  },
  {
    id: 'hyperbolic',
    name: 'Time Chamber',
    emoji: '⏳',
    prompt: 'The Hyperbolic Time Chamber (Room of Spirit and Time) from Dragon Ball Z. Infinite white void stretching in all directions, marble-tiled entrance platform, hourglass in background, ethereal misty atmosphere. Clean, minimalist, otherworldly.',
  },
  {
    id: 'vegeta_destroyed',
    name: 'Planet Vegeta',
    emoji: '🌋',
    prompt: 'Planet Vegeta being destroyed in a massive explosion from Dragon Ball Z. Volcanic eruptions, Saiyan space pods fleeing, Frieza\'s death ball in the sky, fiery red and orange atmosphere, crumbling alien architecture. Dramatic and apocalyptic anime scene.',
  },
  {
    id: 'capsule_corp',
    name: 'Capsule Corp',
    emoji: '🏙️',
    prompt: 'The Capsule Corporation headquarters rooftop from Dragon Ball Z. Futuristic dome building with the Capsule Corp logo, West City skyline in background, clear blue sky, hovercars flying, green garden areas. Bright and cheerful anime cityscape.',
  },
  {
    id: 'cell_arena',
    name: 'Cell Games Arena',
    emoji: '🏆',
    prompt: 'The Cell Games fighting ring from Dragon Ball Z. A raised stone fighting platform in a desert wasteland, ZTV cameras and reporters in the distance, dramatic clouds above, cracked earth. Tense martial arts tournament atmosphere.',
  },
  {
    id: 'kame_house',
    name: 'Kame House',
    emoji: '🏝️',
    prompt: 'Kame House (Master Roshi\'s island) from Dragon Ball. Small pink house on a tiny tropical island, palm trees, crystal clear ocean water, blue sky with fluffy clouds, beach sand. Peaceful and nostalgic anime setting.',
  },
  {
    id: 'otherworld',
    name: 'Other World',
    emoji: '👼',
    prompt: 'The Other World (afterlife) from Dragon Ball Z. Long golden Snake Way road above yellow clouds, King Yemma\'s palace in the distance, Grand Kai\'s planet visible, heavenly atmosphere with warm golden light. Ethereal anime afterlife scene.',
  },
  {
    id: 'wano',
    name: 'Wano Country',
    emoji: '⛩️',
    prompt: 'Wano Country from One Piece. Traditional Japanese-inspired landscape with cherry blossom trees, pagoda castles on mountaintops, flowing rivers with waterfalls, samurai village, dramatic cloudy sky. Beautiful and majestic anime feudal Japan.',
  },
  {
    id: 'marine_ford',
    name: 'Marineford',
    emoji: '⚓',
    prompt: 'The Marineford headquarters from One Piece. A massive fortress rising from the ocean, Marine battleships in the bay, execution platform at the center, Marines and pirates in an epic war, dramatic waves. Intense and epic anime battle scene.',
  },
];

// --- Core Gemini API Call ---
async function callGemini(parts, options = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env');
  }

  const body = {
    contents: [{
      role: 'user',
      parts,
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const response = await fetch(`${API_BASE}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const candidate = result.candidates?.[0];

  if (!candidate?.content?.parts) {
    throw new Error('No content returned from Gemini');
  }

  // Extract image and text from response
  let imageData = null;
  let textResponse = '';

  for (const part of candidate.content.parts) {
    if (part.text) {
      textResponse += part.text;
    } else if (part.inlineData) {
      imageData = part.inlineData; // { mimeType, data (base64) }
    }
  }

  return { imageData, textResponse };
}

// --- Public API ---

/**
 * Generate a scene background for an action figure.
 * Text-to-image: creates a background based on a scene preset or custom prompt.
 *
 * @param {string} scenePrompt - The scene description
 * @param {string} figureName - Character name for context
 * @param {Function} onStatus - Status callback
 * @returns {{ imageData: { mimeType: string, data: string }, textResponse: string }}
 */
export async function generateSceneBackground(scenePrompt, figureName, onStatus) {
  onStatus?.('Connecting to Gemini...');

  const fullPrompt = `Generate a high-quality, cinematic anime-style background scene. This background will be used behind an action figure of "${figureName}".

Scene description: ${scenePrompt}

Important requirements:
- The image should be a BACKGROUND ONLY — no characters or figures in the scene
- Use dramatic, cinematic lighting suitable for displaying an action figure in front
- The composition should have depth with a clear foreground area (where the figure would stand)
- Style: high-quality anime/manga art, vibrant colors, detailed environment
- Aspect ratio: 4:3 (landscape orientation)
- Make it look like a professional diorama backdrop`;

  onStatus?.('Generating scene...');

  const result = await callGemini([{ text: fullPrompt }]);

  if (!result.imageData) {
    throw new Error('Gemini did not return an image. Try a different prompt.');
  }

  onStatus?.('Scene ready! 🎨');
  return result;
}

/**
 * Generate a creative reimagining of an uploaded figure photo.
 * Image + Text: takes a photo and generates an artistic version.
 *
 * @param {string} base64Image - Base64-encoded image data
 * @param {string} mimeType - Image MIME type (e.g. 'image/jpeg')
 * @param {string} figureName - Character name
 * @param {string} style - Art style to apply
 * @param {Function} onStatus - Status callback
 */
export async function reimagineFigure(base64Image, mimeType, figureName, style, onStatus) {
  onStatus?.('Analyzing your figure...');

  const promptText = `This is a photo of a "${figureName}" S.H. Figuarts action figure.

Create an epic, ${style} artwork inspired by this figure. Keep the character recognizable but reimagine them in a dynamic, action-packed scene with:
- Dramatic pose and movement effects
- Energy auras, ki blasts, or power effects appropriate to the character
- A matching environment/background for this specific character
- Professional anime/manga art quality
- Dynamic camera angle

Make it look like a premium anime poster or key visual.`;

  onStatus?.('Creating artwork...');

  const result = await callGemini([
    { text: promptText },
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
  ]);

  if (!result.imageData) {
    throw new Error('Gemini did not return an image. Try again or use a different photo.');
  }

  onStatus?.('Artwork ready! ✨');
  return result;
}

/**
 * Check if Gemini API key is configured.
 */
export function isGeminiConfigured() {
  return !!GEMINI_API_KEY;
}

// --- Gallery IndexedDB ---
const GALLERY_DB = 'komic-photo-studio';
const GALLERY_STORE = 'gallery';
const GALLERY_DB_VERSION = 1;

function openGalleryDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(GALLERY_DB, GALLERY_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(GALLERY_STORE)) {
        db.createObjectStore(GALLERY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToGallery(entry) {
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, 'readwrite');
    tx.objectStore(GALLERY_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadGallery() {
  try {
    const db = await openGalleryDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GALLERY_STORE, 'readonly');
      const req = tx.objectStore(GALLERY_STORE).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteFromGallery(id) {
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, 'readwrite');
    tx.objectStore(GALLERY_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Convert a File object to base64 string.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove the data:mime;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
