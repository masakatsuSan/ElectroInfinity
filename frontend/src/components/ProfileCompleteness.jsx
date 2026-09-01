export default function ProfileCompleteness({ percentage, missing, onEdit }) {
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="p-6 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-[18px] font-bold text-ink">Profile Completeness</h3>
        <span className="font-mono text-[14px] font-bold text-ink">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-divider-soft rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {missing.length > 0 && (
        <>
          <p className="font-sans text-[13px] text-ink-muted-80 mb-3">Missing:</p>
          <ul className="space-y-1.5 mb-4">
            {missing.map((item) => (
              <li key={item} className="font-sans text-[13px] text-ink-muted-80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 bg-ink text-canvas px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
          >
            Complete Profile
          </button>
        </>
      )}
    </div>
  )
}
