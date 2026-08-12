// Reusable notice row — used on Home page and Resources page
export default function NoticeCard({ notice }) {
  // Colour-coded category tag
  const catColor = {
    exam:      'text-vs',
    lab:       'text-green',
    event:     'text-yellow-400',
    academic:  'text-dim',
    placement: 'text-orange-400',
    general:   'text-dim',
  }

  const date = new Date(notice.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/7 group hover:cursor-default">

      {/* Category */}
      <span className={`font-mono text-[9px] uppercase tracking-widest pt-1 w-14 flex-shrink-0 ${catColor[notice.category] || 'text-dim'}`}>
        {notice.category}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-medium leading-snug group-hover:text-vs transition-colors">
          {notice.isPinned && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-vs mr-2 mb-0.5" />
          )}
          {notice.title}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-dim mt-1">{date}</p>
      </div>

      {/* Download link */}
      {notice.attachmentUrl && (
        <a
          href={notice.attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] uppercase tracking-wider text-vs border-b border-vs pb-px flex-shrink-0 hover:text-white hover:border-white transition-colors"
        >
          PDF ↓
        </a>
      )}
    </div>
  )
}
