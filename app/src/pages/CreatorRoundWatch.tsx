import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, ArrowLeft, Sparkles, Lock, Users, Clock, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import RoundTimer from '@/components/RoundTimer'
import DotPattern from '@/components/DotPattern'
import { usePiece } from '@/hooks/usePiece'

export default function CreatorRoundWatch() {
  const { pieceId } = useParams()
  const { piece, loading } = usePiece(pieceId, { resetDemoOnLoad: false })

  if (loading) {
    return (
      <main className="min-h-screen pt-14 pb-24 flex items-center justify-center">
        <div className="flex items-center gap-2 text-ink-tertiary text-sm font-mono">
          <Loader2 size={16} className="animate-spin" />
          Loading creator view…
        </div>
      </main>
    )
  }

  if (!piece || !piece.activeRound) {
    return (
      <main className="min-h-screen pt-14 pb-24 flex items-center justify-center">
        <p className="text-ink-tertiary text-sm font-mono">Round not found.</p>
      </main>
    )
  }

  const activeRound = piece.activeRound
  const useRunoffVotes = activeRound.status === 'Runoff'
  const pool = (activeRound.submissions ?? [])
    .filter(sub => useRunoffVotes ? sub.inRunoff : true)
    .sort((a, b) => (useRunoffVotes ? b.runoffVoteCount - a.runoffVoteCount : b.voteCount - a.voteCount))
  const totalVotes = useRunoffVotes ? activeRound.totalRunoffVotes : activeRound.totalVotes
  const leader = pool[0]
  const latestParagraph = piece.paragraphs[piece.paragraphs.length - 1]

  return (
    <main className="min-h-screen pt-14 pb-24 relative">
      <DotPattern />
      <div className="max-w-2xl mx-auto px-6 relative z-10">
        <div className="pt-10 mb-8">
          <Link
            to={`/piece/${piece.id}`}
            className="flex items-center gap-1.5 text-xs text-ink-tertiary hover:text-ink-secondary transition-colors mb-6 font-mono"
          >
            <ArrowLeft size={12} />
            Back to piece
          </Link>

          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-label uppercase tracking-[0.08em] text-ink-tertiary mb-1.5">{piece.title}</p>
              <h1 className="font-mono font-bold text-display-md text-ink tracking-[-0.02em]">
                Round {activeRound.roundIndex + 1} — Live votes
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-tertiary bg-paper border border-straw rounded-[8px] h-7 px-3 flex-shrink-0 font-mono">
              <Lock size={10} />
              View only
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-ink-tertiary mt-3 flex-wrap font-mono">
            <span className="flex items-center gap-1.5">
              <BarChart2 size={11} />
              {totalVotes.toLocaleString()} votes cast
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={11} />
              {pool.length} directions
            </span>
            {activeRound.status === 'Voting' && <RoundTimer deadline={activeRound.votingDeadline} label="closes" />}
            {activeRound.status === 'Submissions' && <RoundTimer deadline={activeRound.submissionDeadline} label="closes" />}
            {activeRound.status === 'Runoff' && <RoundTimer deadline={activeRound.runoffDeadline} label="closes" />}
          </div>
        </div>

        {latestParagraph?.content && (
          <div className="mb-6 p-4 rounded-[8px] border border-seal/20 bg-seal-light/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-seal" />
              <span className="text-label uppercase tracking-[0.08em] text-seal font-bold">Latest sealed scene</span>
            </div>
            <p className="text-ink-secondary text-sm leading-7 font-serif">{latestParagraph.content}</p>
          </div>
        )}

        {leader && (
          <motion.div layout className="mb-6 p-4 rounded-[8px] border border-sage/30 bg-sage-light/40">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-sage-dark" />
              <span className="text-label uppercase tracking-[0.08em] text-sage-dark font-bold">Leading direction</span>
            </div>
            <p className="text-ink-secondary text-sm leading-relaxed font-serif italic mb-2">
              "{leader.content}"
            </p>
            <div className="flex items-center gap-3 text-xs text-ink-tertiary font-mono">
              <span>{leader.contributor.slice(0, 4)}…{leader.contributor.slice(-4)}</span>
              <span>·</span>
              <span className="text-sage-dark font-bold">
                {useRunoffVotes ? leader.runoffVoteCount : leader.voteCount} votes
              </span>
              <span>·</span>
              <span>{totalVotes > 0 ? (((useRunoffVotes ? leader.runoffVoteCount : leader.voteCount) / totalVotes) * 100).toFixed(1) : 0}%</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {pool.map((sub, i) => {
            const subVotes = useRunoffVotes ? sub.runoffVoteCount : sub.voteCount
            const pct = totalVotes > 0 ? (subVotes / totalVotes) * 100 : 0
            const isLeading = i === 0
            return (
              <motion.div
                key={sub.id}
                layout
                className={clsx(
                  'p-4 rounded-[8px] border transition-colors bg-paper',
                  isLeading ? 'border-sage' : 'border-straw'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-xs text-ink-tertiary font-mono">
                    <span>#{String(i + 1).padStart(2, '0')}</span>
                    <span>{sub.contributor.slice(0, 4)}…{sub.contributor.slice(-4)}</span>
                  </div>
                  <span className={clsx(
                    'text-sm font-mono font-bold tabular-nums flex-shrink-0',
                    isLeading ? 'text-sage-dark' : 'text-ink-secondary'
                  )}>
                    {subVotes}
                  </span>
                </div>

                <p className="text-ink-secondary text-sm leading-relaxed mb-3 font-serif">{sub.content}</p>

                <div>
                  <div className="flex justify-between text-xs text-ink-tertiary mb-1 font-mono">
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-straw rounded-full overflow-hidden">
                    <motion.div
                      className={clsx('h-full rounded-full', isLeading ? 'bg-sage' : 'bg-ink-tertiary')}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-10 pt-6 border-t border-straw flex items-start gap-2.5">
          <Clock size={13} className="text-ink-tertiary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-ink-tertiary leading-relaxed font-mono">
            This creator view now follows the same live demo state as the viewer experience, including newly sealed scenes and the currently open round.
          </p>
        </div>
      </div>
    </main>
  )
}
