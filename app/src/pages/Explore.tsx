import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { useExplore } from '@/hooks/usePiece'
import type { ExplorePiece } from '@/hooks/usePiece'
import DotPattern from '@/components/DotPattern'
import FolioCard, { type FolioStatus } from '@/components/StoryBook'

/**
 * Explore — "The Library"
 *
 * Two views of the same catalog:
 *   1. Currently Writing — a row of abstract folio cards (active pieces),
 *      the live, visual browsing layer.
 *   2. The Archive — a printed index with dotted leader lines; every piece
 *      on record, navigable like a table of contents.
 */

export default function Explore() {
  const { pieces, loading } = useExplore()

  const active  = pieces.filter(p => p.activeRound?.status === 'Voting')
  const archive = pieces // everything, including active, like a real library index

  return (
    <main className="min-h-screen pt-20 pb-24 relative">
      <DotPattern />
      <div className="max-w-4xl mx-auto px-6 relative z-10">

        {/* Masthead */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-10 pb-8"
        >
          <p className="text-label uppercase tracking-[0.18em] text-ink-tertiary mb-3">The library</p>
          <h1 className="font-mono font-bold text-display-lg text-ink leading-[1.05] tracking-[-0.02em]">
            Stories in progress,<br />
            <span className="text-sage">stories sealed forever.</span>
          </h1>
          <p className="font-serif text-body-lg text-ink-secondary mt-5 max-w-[52ch]">
            Every piece here is being written by a community. Drop into an open round to help decide
            where it goes next, or wander the archive to read what's already been sealed on chain.
          </p>
        </motion.header>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-ink-tertiary font-mono">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span className="text-sm">Fetching from chain…</span>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Section 1 · Currently Writing ─────────────────────────── */}
            <section className="mt-10 pt-10 border-t border-straw">
              <SectionHeader
                kicker="§ I"
                title="Currently writing"
                subtitle={active.length > 0
                  ? `${active.length} ${active.length === 1 ? 'round' : 'rounds'} open for voting`
                  : 'No active rounds — come back soon'}
              />

              {active.length > 0 ? (
                <div className="mt-8 -mx-6 px-6 overflow-x-auto scrollbar-none">
                  <div className="flex items-stretch gap-5 pb-2 pt-2">
                    {active.map((piece, i) => (
                      <Link key={piece.id} to={`/piece/${piece.id}`}>
                        <FolioCard
                          folio={i + 1}
                          title={piece.title}
                          author={shortAddr(piece.creator)}
                          chapters={piece.paragraphCount}
                          status={resolveStatus(piece)}
                          index={i}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-8 font-serif text-ink-tertiary italic">
                  Nothing live at the moment.
                </p>
              )}
            </section>

            {/* ── Section 2 · The Archive (ToC) ─────────────────────────── */}
            <section className="mt-16 pt-10 border-t border-straw">
              <SectionHeader
                kicker="§ II"
                title="The archive"
                subtitle={`${archive.length} ${archive.length === 1 ? 'piece' : 'pieces'} on record`}
              />

              {archive.length > 0 ? (
                <ol className="mt-8 divide-y divide-straw/80">
                  {archive.map((piece, i) => (
                    <TocRow key={piece.id} piece={piece} index={i} />
                  ))}
                </ol>
              ) : (
                <p className="mt-8 font-serif text-ink-tertiary italic">
                  Nothing in the archive yet.
                </p>
              )}
            </section>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-20 pt-10 border-t border-straw text-center"
            >
              <p className="text-ink-tertiary text-sm mb-4 font-mono">Have a story to tell?</p>
              <Link
                to="/new"
                className="inline-flex items-center gap-2 text-sage hover:text-sage-dark transition-colors font-mono font-bold text-sm border border-sage hover:border-sage-dark px-6 py-3 rounded-[8px]"
              >
                Start a piece
                <ArrowUpRight size={14} />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </main>
  )
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({
  kicker,
  title,
  subtitle,
}: { kicker: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 flex-wrap">
      <div className="flex items-baseline gap-4">
        <span className="font-mono font-bold text-seal text-sm tracking-[0.08em]">{kicker}</span>
        <h2 className="font-mono font-bold text-headline text-ink">{title}</h2>
      </div>
      <p className="font-mono text-xs text-ink-tertiary uppercase tracking-[0.1em]">{subtitle}</p>
    </div>
  )
}

// ── Table of contents row ──────────────────────────────────────────────────

function TocRow({ piece, index }: { piece: ExplorePiece; index: number }) {
  const status = resolveStatus(piece)
  const num = String(index + 1).padStart(2, '0')

  const statusLabel =
    status === 'voting'   ? 'open' :
    status === 'complete' ? 'sealed' :
                            'idle'

  const statusTone =
    status === 'voting'   ? 'text-sage font-bold' :
    status === 'complete' ? 'text-seal font-bold' :
                            'text-ink-tertiary'

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group"
    >
      <Link to={`/piece/${piece.id}`} className="block">
        <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-5 pl-2 pr-3 -mx-2 rounded-[4px] transition-colors hover:bg-parchment/50">
          {/* Number */}
          <span className="font-mono text-xs text-ink-tertiary tabular-nums w-8">
            {num}.
          </span>

          {/* Title + author + dotted leader */}
          <div className="flex items-baseline min-w-0 overflow-hidden">
            <h3 className="font-mono font-bold text-base text-ink truncate group-hover:text-sage transition-colors tracking-[-0.01em]">
              {piece.title}
            </h3>
            <span
              className="flex-1 mx-3 border-b border-dotted border-ink/25 translate-y-[-3px]"
              aria-hidden
            />
            <span className="font-mono text-xs text-ink-tertiary whitespace-nowrap">
              {shortAddr(piece.creator)}
            </span>
          </div>

          {/* Right meta column */}
          <div className="flex items-center gap-5 text-xs font-mono whitespace-nowrap">
            <span className="text-ink-tertiary tabular-nums">
              {piece.paragraphCount} pts
            </span>
            <span className={statusTone + ' uppercase tracking-[0.1em] text-[10px] flex items-center gap-1.5 w-14 justify-end'}>
              {status === 'voting' && <span className="live-dot scale-[0.55]" />}
              {statusLabel}
            </span>
            <ArrowUpRight
              size={13}
              className="text-ink-tertiary group-hover:text-sage group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
        </div>
      </Link>
    </motion.li>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveStatus(piece: ExplorePiece): FolioStatus {
  if (piece.activeRound?.status === 'Voting') return 'voting'
  if (piece.status === 'Complete')            return 'complete'
  return 'between'
}

function shortAddr(addr: string | undefined): string {
  if (!addr) return 'unknown'
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}
