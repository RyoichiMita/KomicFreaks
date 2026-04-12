/**
 * AI Service — Central AI orchestrator for Komic Freaks Studio
 *
 * Handles all OpenAI API calls with:
 * - API key management
 * - Response caching (localStorage)
 * - Error handling + fallbacks
 * - Usage tracking
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_BASE = 'https://api.openai.com/v1/chat/completions';

// --- Cache ---
const CACHE_PREFIX = 'kf_ai_cache_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage full — silently fail
  }
}

// --- Core API Call ---
async function callOpenAI(messages, options = {}) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 1500,
    responseFormat,
  } = options;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env');
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || '';
}

// --- Lore Card Generation ---

const LORE_SYSTEM_PROMPT = `You are a Dragon Ball encyclopedia expert and anime historian. You generate rich, engaging character lore cards for action figure collectors.

Your responses MUST be valid JSON with this exact structure:
{
  "characterName": "string — the character's canonical name",
  "alias": "string — any alternate names or titles (e.g. 'The Prince of All Saiyans')",
  "race": "string — species/race",
  "firstAppearance": "string — first anime episode/manga chapter",
  "powerLevel": "string — peak known power level or tier description",
  "signature_moves": ["array of signature techniques/attacks"],
  "lore": "string — 2-3 paragraph character backstory focusing on their most iconic moments. Write with enthusiasm and passion — you're writing for collectors who love these characters.",
  "funFacts": ["array of 3-4 interesting trivia facts about the character"],
  "rivalries": ["array of key rival/opponent names"],
  "quote": "string — the character's most iconic quote from the anime"
}

Important rules:
- Focus on the specific version/form of the character when relevant (e.g. "Ultra Instinct" Goku vs base Goku)
- Keep the tone hype and collector-friendly — these are for passionate fans
- Include figure-specific context when the figure name references a specific saga or moment
- If the character is minor (like Guldo or Dodoria), still make them sound interesting
- For power levels, use descriptive tiers if no canon number exists`;

/**
 * Generate an AI Lore Card for an SHF figure.
 *
 * @param {Object} figure - The figure data object
 * @param {Function} onStatus - Status callback
 * @returns {Object} - Parsed lore card data
 */
export async function generateLoreCard(figure, onStatus) {
  // Check cache first
  const cacheKey = `lore_${figure.id}`;
  const cached = getCached(cacheKey);
  if (cached) {
    onStatus?.('Loaded from cache ⚡');
    return cached;
  }

  onStatus?.('Contacting AI...');

  const userPrompt = `Generate a lore card for this S.H. Figuarts action figure:

Figure Name: ${figure.name}
Franchise: ${figure.franchise}
Line: ${figure.line}
Story Arc: ${figure.arc}
Sub-Line: ${figure.subLine || 'N/A'}
Accessories: ${figure.accessories?.join(', ') || 'Standard'}

Focus on the specific version/form depicted by this figure. The story arc "${figure.arc}" gives context for which era of the character this represents.`;

  onStatus?.('Generating lore...');

  const raw = await callOpenAI(
    [
      { role: 'system', content: LORE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 1200,
      responseFormat: { type: 'json_object' },
    }
  );

  onStatus?.('Processing...');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  // Cache the result
  setCache(cacheKey, parsed);

  onStatus?.('Done ✨');
  return parsed;
}

/**
 * Check if a lore card is cached for a figure.
 */
export function isLoreCached(figureId) {
  return getCached(`lore_${figureId}`) !== null;
}

/**
 * Clear all AI caches.
 */
export function clearAICache() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
  return keys.length;
}

/**
 * Check if the OpenAI API key is configured.
 */
export function isAIConfigured() {
  return !!OPENAI_API_KEY;
}
