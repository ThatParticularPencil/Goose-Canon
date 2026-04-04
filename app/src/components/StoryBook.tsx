import { motion } from 'framer-motion'
import { clsx } from 'clsx'

/**
 * FolioCard — an abstract, editorial card for a story in the library.
 * No skeuomorphism — just typography, a status rail, and a folio number.
 * Kept in this filename for import stability.
 */

export type FolioStatus = 'voting' | 'complete' | 'between'

interface FolioCardProps {
  folio:    number   // 1-indexed position in the library
  title:    string
  author:   string
  chapters: number
  status:   FolioStatus
  index?:   number   // stagger key
}

const STATUS_META: Record<FolioStatus, { label: string; rail: string; tone: string }> = {
  voting:   { label: 'Round open',    rail: 'bg-sage',         tone: 'text-sage' },
  complete: { label: 'Sealed',        rail: 'bg-seal',         tone: 'text-seal' },
  between:  { label: 'Between rounds',rail: 'bg-ink-tertiary', tone: 'text-ink-tertiary' },
}

export default function FolioCard({
  folio, title, author, chapters, status, index = 0,
}: FolioCardProps) {
  const meta = STATUS_META[status]
  const folioStr = String(folio).padStart(3, '0')

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'group relative flex flex-col justify-between',
        'w-[220px] h-[300px] flex-shrink-0',
        'bg-paper border border-straw rounded-[4px] overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-ink/40',
      )}
    >
      {/* Status rail — left edge accent */}
      <div className={clsx('absolute left-0 top-0 bottom-0 w-[3px]', meta.rail)} aria-hidden />

      {/* Top — folio number + status */}
      <header className="flex items-start justify-between px-6 pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary tabular-nums">
          № {folioStr}
        </span>
        <span className={clsx(
          'font-mono text-[10px] uppercase tracking-[0.12em] flex items-center gap-1.5',
          meta.tone,
          status !== 'between' && 'font-bold',
        )}>
          {status === 'voting' && <span className="live-dot scale-[0.55]" />}
          {meta.label}
        </span>
      </header>

      {/* Middle — title */}
      <div className="px-6 flex-1 flex items-center">
        <h3 className="font-mono font-bold text-[17px] leading-[1.25] tracking-[-0.015em] text-ink text-balance group-hover:text-sage transition-colors">
          {title}
        </h3>
      </div>

      {/* Bottom — meta line */}
      <footer className="px-6 pb-6 pt-4 border-t border-straw/70 flex items-center justify-between">
        <span className="font-mono text-[11px] text-ink-secondary truncate max-w-[55%]">
          {author}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary tabular-nums">
          {chapters} {chapters === 1 ? 'part' : 'parts'}
        </span>
      </footer>
    </motion.article>
  )
}
