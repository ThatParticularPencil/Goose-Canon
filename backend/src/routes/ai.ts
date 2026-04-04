import { Router } from 'express'
import { reactToVote, generateScriptFromDirection, reactToSeal } from '../services/gemini'
import { storeGeneratedScript } from '../services/content'

const router = Router()

function requireGemini(res: any): boolean {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'Gemini not configured — add GEMINI_API_KEY to backend/.env' })
    return false
  }
  return true
}

function requireElevenLabs(res: any): boolean {
  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(503).json({ error: 'ElevenLabs not configured — add ELEVENLABS_API_KEY to backend/.env' })
    return false
  }
  if (!process.env.ELEVENLABS_VOICE_ID) {
    res.status(503).json({ error: 'ElevenLabs voice missing — add ELEVENLABS_VOICE_ID to backend/.env' })
    return false
  }
  return true
}

/**
 * POST /api/ai/vote-reaction
 * Called when a user votes for a direction — returns a 1-2 sentence literary reaction.
 */
router.post('/vote-reaction', async (req, res) => {
  const { directionText, voteCount } = req.body as { directionText?: string; voteCount?: number }
  if (!directionText) return res.status(400).json({ error: 'directionText is required' })
  if (!requireGemini(res)) return

  try {
    const reaction = await reactToVote(directionText, voteCount ?? 1)
    res.json({ reaction })
  } catch (err: any) {
    console.error('[gemini] vote-reaction error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * POST /api/ai/generate-script
 * Winning direction chosen — Gemini writes the full TV script scene.
 *
 * After generation, the script is stored in the backend content store
 * (keyed by roundId) so the creator can reference the hash/URI when
 * calling close_round on-chain.
 *
 * Returns: { script, hash, uri }
 * - hash: SHA-256 of the script text (same as what goes on-chain in content_hash)
 * - uri:  ar:// URI (fake hash-based until Arweave wallet is configured)
 */
router.post('/generate-script', async (req, res) => {
  const { winningDirection, storyContext, pieceTitle, roundId } = req.body as {
    winningDirection?: string
    storyContext?: string
    pieceTitle?: string
    roundId?: string
  }
  if (!winningDirection) return res.status(400).json({ error: 'winningDirection is required' })
  if (!requireGemini(res)) return

  try {
    const script = await generateScriptFromDirection(
      winningDirection,
      storyContext ?? '',
      pieceTitle ?? 'Untitled'
    )

    // Store in backend so the on-chain close_round can reference hash + URI
    let hash: string | undefined
    let uri: string | undefined
    if (roundId) {
      const stored = await storeGeneratedScript(roundId, script, pieceTitle ?? 'Untitled', winningDirection)
      hash = stored.hash
      uri  = stored.uri
    }

    res.json({ script, hash, uri })
  } catch (err: any) {
    console.error('[gemini] generate-script error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * POST /api/ai/seal-reaction
 * After creator publishes on-chain — returns brief literary analysis.
 */
router.post('/seal-reaction', async (req, res) => {
  const { sealedScript, pieceTitle } = req.body as { sealedScript?: string; pieceTitle?: string }
  if (!sealedScript) return res.status(400).json({ error: 'sealedScript is required' })
  if (!requireGemini(res)) return

  try {
    const reaction = await reactToSeal(sealedScript, pieceTitle ?? 'Untitled')
    res.json({ reaction })
  } catch (err: any) {
    console.error('[gemini] seal-reaction error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * GET /api/ai/script/:roundId
 * Retrieve the stored Gemini script for a round (used by PieceView to show AI content).
 */
router.get('/script/:roundId', (req, res) => {
  const { getGeneratedScript } = require('../services/content')
  const entry = getGeneratedScript(req.params.roundId)
  if (!entry) return res.status(404).json({ error: 'No script generated for this round yet' })
  res.json(entry)
})

/**
 * POST /api/ai/narrate
 * Generate MP3 narration for a story using ElevenLabs.
 */
router.post('/narrate', async (req, res) => {
  const { text, title } = req.body as { text?: string; title?: string }
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' })
  if (!requireElevenLabs(res)) return

  const voiceId = process.env.ELEVENLABS_VOICE_ID as string
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY as string,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
        },
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      console.error('[elevenlabs] narration error:', message)
      return res.status(502).json({ error: 'ElevenLabs request failed' })
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    const safeTitle = (title || 'storylock-narration').replace(/[^a-z0-9]+/gi, '-').toLowerCase()

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.mp3"`)
    res.send(audioBuffer)
  } catch (err: any) {
    console.error('[elevenlabs] narration fetch error:', err?.message)
    res.status(500).json({ error: 'Narration request failed' })
  }
})

export default router
