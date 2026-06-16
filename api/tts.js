// ═══════════════════════════════════════
//   ELEVENLABS TEXT TO SPEECH
//   Converts AI reply to human voice
//   Change VOICE_ID to switch voices
// ═══════════════════════════════════════
 
// Popular ElevenLabs Voice IDs — pick one:
// Rachel  → 21m00Tcm4TlvDq8ikWAM  (professional female, calm)
// Adam    → pNInz6obpgDQGcFmaJgB  (neutral male, clear)
// Antoni  → ErXwobaYiN019PkySvjV  (warm male)
// Elli    → MF3mGyEYCl7XYWbV9V6O  (young female, friendly)
// Josh    → TxGEqnHWrfWFTfGW9XjX  (deep male)
// Arnold  → VR6AewLTigWG4xSOukaG  (strong male)
//
// Or go to elevenlabs.io/voice-library to browse and get more IDs
 
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — change this to switch voice
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
 
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
 
  const API_KEY = process.env.ELEVENLABS_API_KEY;
 
  // If no ElevenLabs key — tell browser to use fallback
  if (!API_KEY) {
    return res.status(503).json({ error: 'ElevenLabs not configured', fallback: true });
  }
 
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text.slice(0, 500), // max 500 chars per call
          model_id: 'eleven_turbo_v2_5', // fast + natural
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.80,
            style: 0.25,
            use_speaker_boost: true
          }
        })
      }
    );
 
    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs error:', errText);
      return res.status(response.status).json({ error: 'ElevenLabs error', fallback: true });
    }
 
    // Stream audio back to browser
    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(Buffer.from(audioBuffer));
 
  } catch (err) {
    console.error('TTS error:', err.message);
    return res.status(500).json({ error: err.message, fallback: true });
  }
};
 
