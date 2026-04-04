import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ArrowRight, CheckCircle2, Lock, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { sendSolPayment } from '@/utils/solana'
import DotPattern from '@/components/DotPattern'

// 8 community rounds: Intro + 6 Chapters + Conclusion
export const MAX_ROUNDS = 8
// paragraphCount includes the creator's premise (index 0) + 8 community rounds
export const COMPLETE_AT = MAX_ROUNDS + 1

type Step = 'title' | 'settings' | 'confirm' | 'done'
const STEP_ORDER: Step[] = ['title', 'settings', 'confirm', 'done']

// Round labels: 0 = Intro, 1-6 = Chapters, 7 = Conclusion
export function getRoundLabel(roundIndex: number): string {
  if (roundIndex === 0) return 'Intro'
  if (roundIndex === MAX_ROUNDS - 1) return 'Conclusion'
  return `Chapter ${roundIndex + 1}`
}

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export default function NewPiece() {
  const navigate = useNavigate()
  const wallet = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()

  const [step, setStep]                   = useState<Step>('title')
  const [title, setTitle]                 = useState('')
  const [concept, setConcept]             = useState('')   // creator's brief premise
  const [submissionHours, setSubmissionHours] = useState(0.5 / 60)  // 30s default
  const [votingHours, setVotingHours]     = useState(0.5 / 60)      // 30s default
  const [maxSubmissions, setMaxSubmissions] = useState(20)
  const [communityOnly, setCommunityOnly] = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [submitStatus, setSubmitStatus]   = useState<string | null>(null)
  const [payError, setPayError]           = useState<string | null>(null)
  const [piecePDA, setPiecePDA]           = useState<string | null>(null)

  const stepIndex = STEP_ORDER.indexOf(step)

  const goNext = async () => {
    if (step === 'confirm') {
      await handleCreate()
      return
    }
    setStep(STEP_ORDER[stepIndex + 1])
  }

  const handleCreate = async () => {
    if (!publicKey) return
    setSubmitting(true)
    setPayError(null)

    try {
      // 1 ── Treasury fee (0.1 SOL → opens Phantom popup)
      setSubmitStatus('Approving payment…')
      await sendSolPayment(connection, wallet, 0.1)

      // 2 ── Create piece + open Intro round in backend store
      setSubmitStatus('Creating your story…')
      const premiseText = concept.trim() || title
      const createRes = await fetch(`${BACKEND}/api/pieces/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          openingText:      premiseText,
          creatorWallet:    publicKey.toString(),
          submissionHours,
          votingHours,
          maxSubmissions,
        }),
      })
      if (!createRes.ok) throw new Error(await createRes.text())
      const piece = await createRes.json()

      setPiecePDA(piece.id)
      setSubmitStatus(null)
      setStep('done')
    } catch (err: any) {
      const msg = err?.message ?? ''
      setPayError(
        msg.includes('rejected') || msg.includes('cancel')
          ? 'Transaction cancelled.'
          : msg.includes('insufficient') || msg.includes('balance')
          ? 'Insufficient SOL balance. You need ~0.1 SOL + gas on devnet.'
          : `Transaction failed: ${msg.slice(0, 120)}`
      )
    } finally {
      setSubmitting(false)
      setSubmitStatus(null)
    }
  }

  const goBack = () => {
    if (stepIndex > 0 && step !== 'done') setStep(STEP_ORDER[stepIndex - 1])
  }

  if (!publicKey) {
    return (
      <main className="min-h-screen pt-28 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-[8px] bg-sage-light border border-sage/40 flex items-center justify-center mx-auto mb-5">
            <Lock size={22} className="text-sage-dark" />
          </div>
          <h1 className="font-mono font-bold text-display-md text-ink mb-3">Creators only</h1>
          <p className="text-ink-secondary mb-8 text-sm leading-relaxed font-serif">
            Connect your Phantom or Solflare wallet to start a new piece.
          </p>
          <WalletMultiButton />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 relative">
      <DotPattern />
      <div className="max-w-2xl mx-auto relative z-10">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {(['Title', 'Settings', 'Confirm'] as const).map((label, i) => {
            const done   = stepIndex > i
            const active = stepIndex === i && step !== 'done'
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all',
                  done    ? 'bg-sage-light border border-sage text-sage-dark' :
                  active  ? 'bg-sage text-white' :
                            'bg-paper border border-straw text-ink-tertiary'
                )}>
                  {done ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={clsx('text-xs font-mono', active || done ? 'text-ink' : 'text-ink-tertiary')}>
                  {label}
                </span>
                {i < 2 && (
                  <div className={clsx('w-8 h-px', done ? 'bg-sage' : 'bg-straw')} />
                )}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Title + Premise ── */}
          {step === 'title' && (
            <StepWrapper key="title">
              <StepHeading
                eyebrow="Step 1"
                title="Set up your piece"
                description="Give your piece a title and a brief premise. Your community will build the story from here."
              />

              {/* Title */}
              <label className="block text-label uppercase tracking-[0.08em] text-ink-tertiary mb-1.5 font-mono">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="It was the night before the product launch…"
                maxLength={128}
                className="w-full bg-paper border border-straw rounded-[8px] px-5 py-4 font-mono font-bold text-xl text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-sage mb-1 transition-colors"
                autoFocus
              />
              <div className="text-xs text-ink-tertiary text-right mb-5 font-mono">{title.length} / 128</div>

              {/* Premise */}
              <label className="block text-label uppercase tracking-[0.08em] text-ink-tertiary mb-1.5 font-mono">
                Premise <span className="text-ink-tertiary normal-case tracking-normal">(optional — 1–3 sentences)</span>
              </label>
              <textarea
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder="The night before the launch, a critical bug brings the team together. What unfolds in the next 12 hours will define them."
                maxLength={400}
                rows={3}
                className="w-full bg-paper border border-straw rounded-[8px] px-5 py-3.5 font-serif text-base text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-sage mb-1 resize-none transition-colors leading-relaxed"
              />
              <div className="text-xs text-ink-tertiary text-right mb-6 font-mono">{concept.length} / 400</div>

              <StepButton onClick={goNext} disabled={title.trim().length < 3}>
                Continue
              </StepButton>
            </StepWrapper>
          )}

          {/* ── Step 2: Settings ── */}
          {step === 'settings' && (
            <StepWrapper key="settings">
              <StepHeading
                eyebrow="Step 2"
                title="Round settings"
                description={`These timings apply to all ${MAX_ROUNDS} rounds — Intro through Conclusion.`}
              />
              <div className="space-y-4 mb-8">
                <SettingInput
                  label="Submission window"
                  value={submissionHours}
                  onChange={setSubmissionHours}
                  unit="hours"
                  min={1}
                  max={168}
                  hint="How long the community has to submit 50-word directions each round"
                />
                <SettingInput
                  label="Voting window"
                  value={votingHours}
                  onChange={setVotingHours}
                  unit="hours"
                  min={1}
                  max={168}
                  hint="How long voting is open after submissions close"
                />
                <SettingInput
                  label="Max submissions per round"
                  value={maxSubmissions}
                  onChange={setMaxSubmissions}
                  unit="directions"
                  min={2}
                  max={100}
                  hint="Keeps the vote pool readable — we recommend 10–30"
                />
                <ToggleSetting
                  label="Community only"
                  enabled={communityOnly}
                  onToggle={() => setCommunityOnly(v => !v)}
                  hint="Only community-tier members can submit directions and vote in rounds."
                />
              </div>
              <div className="flex items-center gap-4">
                <button onClick={goBack} className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors font-mono">← Back</button>
                <StepButton onClick={goNext} className="flex-1">Continue</StepButton>
              </div>
            </StepWrapper>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 'confirm' && (
            <StepWrapper key="confirm">
              <StepHeading
                eyebrow="Step 3"
                title="Confirm & deploy"
                description="Two Phantom approvals: one for the 0.1 SOL platform fee, one for the on-chain Anchor instruction."
              />

              <div className="rounded-[8px] bg-paper border border-straw p-6 mb-5 space-y-4">
                <ConfirmRow label="Title"              value={title} />
                <ConfirmRow label="Premise"            value={concept.trim() || '(using title as premise)'} />
                <ConfirmRow label="Submission window"  value={formatHourDisplay(submissionHours)} />
                <ConfirmRow label="Voting window"      value={formatHourDisplay(votingHours)} />
                <ConfirmRow label="Max submissions"    value={`${maxSubmissions} per round`} />
                <ConfirmRow label="Access"             value={communityOnly ? 'Community only' : 'Open to all readers'} />
                <ConfirmRow label="Rounds"             value={`${MAX_ROUNDS} (Intro → 6 Chapters → Conclusion)`} />
                <ConfirmRow label="Round 1 opens"      value="Immediately after creation" />
                <ConfirmRow label="Network"            value="Solana Devnet" />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-[8px] bg-sage-light/50 border border-sage/30 mb-4">
                <Sparkles size={13} className="text-sage-dark mt-0.5 flex-shrink-0" />
                <p className="text-xs text-ink-secondary leading-5 font-mono">
                  After creation, the Intro round opens immediately. Share the link with your community
                  so they can start submitting directions.
                </p>
              </div>

              {submitStatus && (
                <div className="flex items-center gap-2 p-3 rounded-[8px] bg-parchment border border-straw mb-4 text-xs text-ink-secondary font-mono">
                  <Loader2 size={13} className="animate-spin text-sage flex-shrink-0" />
                  {submitStatus}
                </div>
              )}

              {payError && (
                <div className="flex items-start gap-2 p-3 rounded-[8px] bg-red-50 border border-red-200 mb-4 text-xs text-red-700 font-mono">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  {payError}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button onClick={goBack} disabled={submitting} className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors disabled:opacity-40 font-mono">← Back</button>
                <div className="flex-1">
                  <motion.button
                    onClick={goNext}
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.01 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-[8px] font-mono font-bold text-sm bg-sage text-white hover:bg-sage-dark transition-all disabled:opacity-40"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {submitStatus ?? 'Creating…'}
                      </>
                    ) : (
                      <>
                        <Lock size={13} />
                        Create Piece on Devnet
                      </>
                    )}
                  </motion.button>
                  {!submitting && (
                    <p className="text-center text-xs text-ink-tertiary mt-2 font-mono">0.1 SOL + gas fee</p>
                  )}
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ── Done ── */}
          {step === 'done' && piecePDA && (
            <StepWrapper key="done">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="text-center py-8"
              >
                <div className="inline-flex w-20 h-20 rounded-full bg-seal-light border-2 border-seal items-center justify-center mb-6 animate-seal-stamp">
                  <CheckCircle2 size={32} className="text-seal" />
                </div>
                <h2 className="font-mono font-bold text-display-md text-ink mb-3">Piece sealed.</h2>
                <p className="text-ink-secondary mb-2 max-w-sm mx-auto text-sm leading-relaxed font-serif">
                  "{title}" is live on Solana devnet. The Intro round is open — share the link and
                  your community can start submitting directions right now.
                </p>
                <div className="text-xs font-mono text-seal mb-2 break-all px-4">
                  {piecePDA.slice(0, 20)}…{piecePDA.slice(-8)}
                </div>
                <p className="text-xs text-ink-tertiary mb-8 font-mono">Piece account · Solana Devnet · Round 1 (Intro) open</p>

                {/* Round progress preview */}
                <div className="flex items-end gap-1 justify-center mb-8 px-4">
                  {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className={clsx(
                        'w-full rounded-sm transition-all',
                        i === 0 ? 'bg-sage h-6 animate-pulse' :
                        i === MAX_ROUNDS - 1 ? 'bg-straw h-6' :
                        'bg-straw h-4'
                      )} />
                      {(i === 0 || i === MAX_ROUNDS - 1) && (
                        <span className="text-[9px] text-ink-tertiary hidden sm:block font-mono">
                          {getRoundLabel(i)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="h-10 px-5 rounded-[8px] text-sm text-ink-secondary hover:text-ink border border-straw hover:border-sage transition-all font-mono font-bold"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate(`/piece/${piecePDA}`)}
                    className="flex items-center gap-2 h-10 px-5 rounded-[8px] text-sm bg-sage text-white hover:bg-sage-dark font-mono font-bold transition-all"
                  >
                    Open Intro Round
                    <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            </StepWrapper>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="text-label uppercase tracking-[0.08em] text-sage-dark font-bold mb-2 font-mono">{eyebrow}</div>
      <h2 className="font-mono font-bold text-display-md text-ink mb-2 tracking-[-0.02em]">{title}</h2>
      <p className="text-ink-secondary leading-relaxed text-sm font-serif">{description}</p>
    </div>
  )
}

function StepButton({ onClick, disabled, children, className = '' }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={clsx(
        'flex items-center justify-center gap-2 h-11 px-6 rounded-[8px] font-mono font-bold text-sm transition-all',
        disabled
          ? 'bg-parchment text-ink-tertiary border border-straw cursor-not-allowed'
          : 'bg-sage text-white hover:bg-sage-dark',
        className
      )}
    >
      {children}
      {!disabled && <ArrowRight size={14} />}
    </motion.button>
  )
}

function SettingInput({ label, value, onChange, unit, min, max, hint }: {
  label: string; value: number; onChange: (v: number) => void
  unit: string; min: number; max: number; hint: string
}) {
  const displayValue = unit === 'hours' ? formatHourCount(value) : value
  const displayUnit = unit === 'hours' ? pluralizeHours(displayValue) : unit

  return (
    <div className="rounded-[8px] border border-straw bg-paper p-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-mono font-bold text-ink">{label}</label>
        <div className="flex items-center gap-2">
          <button onClick={() => onChange(Math.max(min, value - 1))}
            className="w-6 h-6 rounded border border-straw text-ink-secondary hover:text-ink hover:border-sage flex items-center justify-center text-sm transition-colors">−</button>
          <span className="font-mono font-bold text-sage-dark min-w-[3ch] text-center">{displayValue}</span>
          <button onClick={() => onChange(Math.min(max, value + 1))}
            className="w-6 h-6 rounded border border-straw text-ink-secondary hover:text-ink hover:border-sage flex items-center justify-center text-sm transition-colors">+</button>
          <span className="text-xs text-ink-tertiary font-mono">{displayUnit}</span>
        </div>
      </div>
      <p className="text-xs text-ink-tertiary font-mono">{hint}</p>
    </div>
  )
}

function ToggleSetting({ label, enabled, onToggle, hint }: {
  label: string
  enabled: boolean
  onToggle: () => void
  hint: string
}) {
  return (
    <div className="rounded-[8px] border border-straw bg-paper p-4">
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <div>
          <label className="text-sm font-mono font-bold text-ink">{label}</label>
          <p className="text-xs text-ink-tertiary mt-1 font-mono">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={clsx(
            'relative inline-flex h-7 w-12 items-center rounded-full border transition-all',
            enabled ? 'bg-sage-light border-sage' : 'bg-parchment border-straw'
          )}
          aria-pressed={enabled}
        >
          <span
            className={clsx(
              'inline-block h-5 w-5 transform rounded-full transition-transform',
              enabled ? 'translate-x-6 bg-sage' : 'translate-x-1 bg-ink-tertiary'
            )}
          />
        </button>
      </div>
    </div>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-label uppercase tracking-[0.08em] text-ink-tertiary flex-shrink-0 mt-0.5 font-mono">{label}</span>
      <span className="text-sm text-ink text-right font-mono">{value}</span>
    </div>
  )
}

function formatHourCount(value: number) {
  return Math.max(1, Math.round(value))
}

function pluralizeHours(value: number) {
  return value === 1 ? 'hour' : 'hours'
}

function formatHourDisplay(value: number) {
  const hours = formatHourCount(value)
  return `${hours} ${pluralizeHours(hours)}`
}
