const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getLevelColor(count) {
  if (count === 0) return 'bg-surface-strong'
  if (count <= 2) return 'bg-signature-mint'
  if (count <= 5) return 'bg-signature-mustard'
  if (count <= 8) return 'bg-signature-forest'
  return 'bg-signature-coral'
}

export default function ContributionGraph({ data = [], monthsToShow = 12 }) {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - monthsToShow * 30)

  const activityMap = new Map()
  data.forEach((item) => {
    const date = new Date(item.date)
    if (date >= startDate) {
      const key = date.toISOString().split('T')[0]
      activityMap.set(key, (activityMap.get(key) || 0) + (item.count || 1))
    }
  })

  const weeks = []
  let current = new Date(startDate)
  while (current <= today) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const dateStr = current.toISOString().split('T')[0]
      week.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
      })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const month = new Date(week[0].date).getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ month, weekIndex: i })
      lastMonth = month
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-full">
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {monthLabels.map(({ month, weekIndex }) => (
            <div
              key={month}
              className="font-sans text-[11px] text-muted"
              style={{ marginLeft: weekIndex === 0 ? 0 : `${(weekIndex - (monthLabels[monthLabels.indexOf({ month, weekIndex }) - 1]?.weekIndex || 0)) * 16}px` }}
            >
              {MONTHS[month]}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {DAYS.map((day, i) => (
              <div key={day} className="h-3 w-3 flex items-center justify-center">
                {i % 2 === 1 && <span className="font-sans text-[10px] text-muted">{day}</span>}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    title={`${day.date}: ${day.count} activities`}
                    className={`w-3 h-3 rounded-sm ${getLevelColor(day.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
