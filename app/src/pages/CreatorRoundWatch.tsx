import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, ArrowLeft, Sparkles, Lock, Users, Clock, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import RoundTimer from '@/components/RoundTimer'
import { usePiece } from '@/hooks/usePiece'

export default function CreatorRoundWatch() {
  const { pieceId } = useParams()
  const { piece, loading } = usePiece(pieceId, { resetDemoOnLoad: false })

  if (loading) {
    return (
      <main className="min-h-screen pt-14 pb-24 flex items-center justify-center">
        <div className="flex items-center gap-2 text-parchment/35 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading creator view…
        </div>
      </main>
    )
  }

  if (!piece || !piece.activeRound) {
    return (
      <main className="min-h-screen pt-14 pb-24 flex items-center justify-center">
        <p className="text-parchment/30 text-sm">Round not found.</p>
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
    <main className="min-h-screen pt-14 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        <div className="pt-10 mb-8">
          <Link
            to={`/piece/${piece.id}`}
            className="flex items-center gap-1.5 text-xs text-parchment/30 hover:text-parchment/60 transition-colors mb-6"
          >
            <ArrowLeft size={12} />
            Back to piece
          </Link>

          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-xs text-parchment/30 mb-1">{piece.title}</p>
              <h1 className="font-serif text-2xl text-parchment">
                Round {activeRound.roundIndex + 1} — Live votes
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-parchment/25 bg-parchment/[0.03] border border-parchment/10 rounded-full h-7 px-3 flex-shrink-0">
              <Lock size={10} />
              View only
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-parchment/30 mt-3 flex-wrap">
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
          <div className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-gold/60" />
              <span className="text-xs text-gold/60 uppercase tracking-widest">Latest sealed scene</span>
            </div>
            <p className="text-parchment/78 text-sm leading-7 font-serif">{latestParagraph.content}</p>
          </div>
        )}

        {leader && (
          <motion.div layout className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-gold/60" />
              <span className="text-xs text-gold/60 uppercase tracking-widest">Leading direction</span>
            </div>
            <p className="text-parchment/75 text-sm leading-relaxed font-serif italic mb-2">
              "{leader.content}"
            </p>
            <div className="flex items-center gap-3 text-xs text-parchment/30">
              <span>{leader.contributor.slice(0, 4)}…{leader.contributor.slice(-4)}</span>
              <span>·</span>
              <span className="font-mono text-gold/60">
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
                  'p-4 rounded-xl border transition-colors',
                  isLeading ? 'border-gold/20 bg-gold/[0.03]' : 'border-parchment/8 bg-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-xs text-parchment/35">
                    <span className="font-mono">#{String(i + 1).padStart(2, '0')}</span>
                    <span>{sub.contributor.slice(0, 4)}…{sub.contributor.slice(-4)}</span>
                  </div>
                  <span className={clsx(
                    'text-sm font-mono font-medium tabular-nums flex-shrink-0',
                    isLeading ? 'text-gold/80' : 'text-parchment/50'
                  )}>
                    {subVotes}
                  </span>
                </div>

                <p className="text-parchment/65 text-sm leading-relaxed mb-3">{sub.content}</p>

                <div>
                  <div className="flex justify-between text-xs text-parchment/25 mb-1">
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-parchment/6 rounded-full overflow-hidden">
                    <motion.div
                      className={clsx('h-full rounded-full', isLeading ? 'bg-gold/50' : 'bg-parchment/20')}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-10 pt-6 border-t border-parchment/6 flex items-start gap-2.5">
          <Clock size={13} className="text-parchment/20 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-parchment/25 leading-relaxed">
            This creator view now follows the same live demo state as the viewer experience, including newly sealed scenes and the currently open round.
          </p>
        </div>
      </div>
    </main>
  )
}
