const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Curated voices well-suited for anime figure reviews
export const VOICES = [
  {
    id: 'narrator',
    name: 'Epic Narrator',
    style: 'Deep & dramatic',
    emoji: '🎙️',
    elevenLabsId: 'ErXwobaYiN019PkySvjV', // Antoni
  },
  {
    id: 'hype',
    name: 'Hype Beast',
    style: 'Energetic & excited',
    emoji: '🔥',
    elevenLabsId: 'VR6AewLTigWG4xSOukaG', // Arnold
  },
  {
    id: 'chill',
    name: 'Chill Reviewer',
    style: 'Calm & informative',
    emoji: '😎',
    elevenLabsId: 'pNInz6obpgDQGcFmaJgB', // Adam
  },
  {
    id: 'sensei',
    name: 'Figure Sensei',
    style: 'Wise & authoritative',
    emoji: '🥋',
    elevenLabsId: 'yoZ06aMxZJJ28mfd3POQ', // Sam
  },
];

export async function getAvailableVoices(apiKey) {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch voices');
    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
}

export async function generateSpeech(apiKey, text, voiceId, options = {}) {
  const {
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.5,
  } = options;

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail?.message || 'Failed to generate speech');
    }

    const audioBlob = await response.blob();
    return {
      blob: audioBlob,
      url: URL.createObjectURL(audioBlob),
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export async function getCharacterCount(apiKey) {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch subscription');
    const data = await response.json();
    return {
      used: data.character_count,
      limit: data.character_limit,
      remaining: data.character_limit - data.character_count,
    };
  } catch (error) {
    console.error('Error fetching character count:', error);
    return null;
  }
}
