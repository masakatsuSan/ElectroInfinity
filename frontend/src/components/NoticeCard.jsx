export default function NoticeCard({ notice }) {
  const date = new Date(notice.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="border border-hairline bg-canvas rounded-2xl p-5 shadow-card hover:bg-soft-stone/30 transition-colors flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pale-green text-deep-green border border-green-200">
            {notice.category || 'General'}
          </span>
          {notice.isPinned && (
            <span className="font-mono text-[10px] font-bold uppercase bg-ink text-white px-2 py-0.5 rounded-full">
              Pinned
            </span>
          )}
        </div>

        <h3 className="font-sans text-[15px] font-semibold text-ink leading-snug group-hover:text-action-blue transition-colors">
          {notice.title}
        </h3>
      </div>

      <div className="flex items-center justify-between pt-4 mt-3 border-t border-hairline text-[12px]">
        <span className="font-mono text-slate">{date}</span>
        {notice.attachmentUrl && (
          <a
            href={notice.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-action-blue hover:underline"
          >
            Attachment PDF ↓
          </a>
        )}
      </div>
    </div>
  )
}
