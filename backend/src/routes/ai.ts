import { Router } from 'express'
import { reactToVote, generateScriptFromDirection, reactToSeal } from '../services/gemini'

const router = Router()

function requireGemini(res: any): boolean {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'Gemini not configured — add GEMINI_API_KEY to backend/.env' })
    return false
  }
  return true
}

/**
 * POST /api/ai/vote-reaction
 * User just voted for a direction — return a 1-2 sentence literary reaction.
 */
router.post('/vote-reaction', async (req, res) => {
  const { directionText, voteCount } = req.body as {
    directionText?: string
    voteCount?: number
  }
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
 * Winning direction chosen — Gemini writes the full professional TV script scene.
 * This is the "official paragraph" the creator reviews before publishing on-chain.
 */
router.post('/generate-script', async (req, res) => {
  const { winningDirection, storyContext, pieceTitle } = req.body as {
    winningDirection?: string
    storyContext?: string
    pieceTitle?: string
  }
  if (!winningDirection) return res.status(400).json({ error: 'winningDirection is required' })
  if (!requireGemini(res)) return

  try {
    const script = await generateScriptFromDirection(
      winningDirection,
      storyContext ?? '',
      pieceTitle ?? 'Untitled'
    )
    res.json({ script })
  } catch (err: any) {
    console.error('[gemini] generate-script error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * POST /api/ai/seal-reaction
 * After the creator publishes the script on-chain — return a brief literary analysis.
 */
router.post('/seal-reaction', async (req, res) => {
  const { sealedScript, pieceTitle } = req.body as {
    sealedScript?: string
    pieceTitle?: string
  }
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

export default router
