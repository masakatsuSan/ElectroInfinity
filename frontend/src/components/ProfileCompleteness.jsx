export default function ProfileCompleteness({ percentage, missing, onEdit }) {
  const color = percentage >= 80 ? 'bg-green-600' : percentage >= 50 ? 'bg-orange-400' : 'bg-[#1877F2]'

  return (
    <div className="border border-hairline bg-white p-6 rounded-xl shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-[18px] font-bold text-gray-900">Profile Completeness</h3>
        <span className="font-sans text-[14px] font-medium text-gray-700">{percentage}%</span>
      </div>
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {missing.length > 0 && (
        <>
          <p className="font-sans text-[13px] text-gray-500 mb-3">Missing:</p>
          <ul className="space-y-1.5 mb-4">
            {missing.map((item) => (
              <li key={item} className="font-sans text-[13px] text-gray-500 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-full text-[13px] font-medium hover:bg-[#166FE2] transition-colors"
          >
            Complete Profile
          </button>
        </>
      )}
    </div>
  )
}
