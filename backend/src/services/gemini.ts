import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

const MODEL = 'gemini-2.0-flash-exp'

/**
 * Called when a user casts a vote on a direction.
 * Returns a 1–2 sentence literary reaction to what the direction could produce.
 */
export async function reactToVote(directionText: string, voteCount: number): Promise<string> {
  const model = getClient().getGenerativeModel({ model: MODEL })

  const prompt = `You are a literary editor watching a live collaborative story unfold.

A community member just voted for this story direction (now at ${voteCount} votes). React in 1–2 sharp sentences — speak like a critic watching something exciting happen. Present tense. No fluff.

Direction the community voted for:
"${directionText.slice(0, 300)}"`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

/**
 * The core function. Called after the community votes and a winning direction is chosen.
 *
 * Takes the winning 50-word direction + the sealed story so far, and generates
 * a full professional video/TV script scene — the official next paragraph.
 *
 * Returns the complete script text that the creator can review and publish on-chain.
 */
export async function generateScriptFromDirection(
  winningDirection: string,
  storyContext: string,
  pieceTitle: string
): Promise<string> {
  const model = getClient().getGenerativeModel({ model: MODEL })

  const prompt = `You are a professional TV drama screenwriter (think HBO, Succession, The Bear).

You are writing the next scene for a collaborative story. The community has voted on a direction — your job is to execute it as a polished, publication-ready script scene.

STORY TITLE: "${pieceTitle}"

STORY SO FAR:
${storyContext.slice(0, 1200)}

---

COMMUNITY'S CHOSEN DIRECTION (what they want to happen next):
"${winningDirection}"

---

Write the next scene. Requirements:
- Professional TV drama script format
- 120–180 words
- Use action lines (INT./EXT. slug if needed, then present-tense action)
- Include at least one line of sharp, character-revealing dialogue
- Match the tone and voice of the story so far exactly
- Do NOT add a title, scene number, or any preamble — just the scene
- End at a natural beat — a turn, a revelation, or a held moment

Write only the scene. Nothing else.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

/**
 * After the script is sealed on-chain, generate a brief literary analysis.
 */
export async function reactToSeal(sealedScript: string, pieceTitle: string): Promise<string> {
  const model = getClient().getGenerativeModel({ model: MODEL })

  const prompt = `You're a literary critic writing a one-paragraph reaction to a scene that was just permanently sealed on the Solana blockchain by community vote.

Story: "${pieceTitle}"

Sealed scene:
"${sealedScript.slice(0, 600)}"

Write exactly two sentences:
1. What makes this scene work — the craft choice that lands
2. A teaser about what the next scene might demand

Under 50 words. No headers.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
