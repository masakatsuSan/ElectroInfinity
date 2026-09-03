import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { UserCheck } from 'lucide-react'

// ── Constants ──
const RANGE_METERS = 25
const STALE_AFTER_MS = 45_000
const DOT_COLOR = { near: '#06C167', idle: '#FFC043', out: '#9AA0A8' }
const DOT_BG = { near: 'bg-green-100', idle: 'bg-amber-100', out: 'bg-gray-100' }

// Classroom bounds from existing Classroom3D: x ∈ [-58, 58], z ∈ [-45, 45]
const CENTER_X = 320
const CENTER_Y = 240
const SCALE = 4.8

// ── Helpers ──
function classifyPosition(p) {
  const age = p.ts ? Date.now() - new Date(p.ts).getTime() : Infinity
  const stale = age > STALE_AFTER_MS
  const noGps = !p.hasGps
  const outOfRange = typeof p.distance === 'number' ? p.distance > RANGE_METERS : false

  if (noGps || outOfRange) return 'out'
  if (stale || p.status === 'flagged' || p.status === 'stale' || p.status === 'noGps') return 'idle'
  return 'near'
}

function initials(name) {
  return (name || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function AriaLiveLabel(p, state) {
  return `${p.name}, roll ${p.roll || 'N/A'}, ${state === 'near' ? 'near' : state === 'idle' ? 'idle' : 'out of range'}, ${Math.round(p.distance || 0)} meters`
}

const toSvg = (x, z) => ({
  cx: CENTER_X + x * SCALE,
  cy: CENTER_Y + z * SCALE,
})

// ── Main Component ──
export default function ClassroomPresence({ positions = [], session = null, showLabels = true }) {
  const classified = useMemo(
    () => positions.map((p) => ({ ...p, presenceState: classifyPosition(p) })),
    [positions],
  )

  const near = classified.filter((p) => p.presenceState === 'near')
  const idle = classified.filter((p) => p.presenceState === 'idle')
  const out = classified.filter((p) => p.presenceState === 'out')
  const nearbyCount = near.length + idle.length

  const roomLabel = session?.room?.name || session?.subject || 'Classroom'
  const facultyName = session?.faculty?.name || 'Faculty'

  return (
    <div className="flex h-full min-h-[640px] flex-col-reverse gap-4 md:flex-row">
      {/* ── Map panel (left) ── */}
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-hairline bg-gray-50 shadow-sm">
        <svg
          viewBox="0 0 640 480"
          className="block h-full w-full"
          role="img"
          aria-label={`Classroom presence map for ${roomLabel}. ${nearbyCount} of ${classified.length} students nearby.`}
          focusable="false"
        >
          <defs>
            <pattern id="grid-presence" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d9d9dd" strokeWidth="0.7" opacity="0.5" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="640" height="480" fill="url(#grid-presence)" />

          {/* Geofence rings */}
                    <circle cx={CENTER_X} cy={CENTER_Y} r={RANGE_METERS * SCALE} fill="rgba(6,193,103,0.06)" stroke="#06C167" strokeWidth="2" strokeDasharray="8 6" opacity="0.8" />
          <circle cx={CENTER_X} cy={CENTER_Y} r={RANGE_METERS * SCALE * 0.5} fill="none" stroke="#06C167" strokeWidth="1" opacity="0.25" />
          <circle cx={CENTER_X} cy={CENTER_Y} r={RANGE_METERS * SCALE * 0.75} fill="none" stroke="#06C167" strokeWidth="1" opacity="0.18" />

          {/* Teacher marker */}
          <g>
                        <circle cx={CENTER_X} cy={CENTER_Y} r="5" className="teacher-pulse" fill="none" stroke="#06C167" strokeWidth="2" />
            <circle cx={CENTER_X} cy={CENTER_Y} r="5" fill="#06C167" />
            <g aria-hidden="true">
              <UserCheck size={12} x={CENTER_X - 6} y={CENTER_Y - 20} color="#06C167" />
            </g>
            {showLabels && (
              <foreignObject x={CENTER_X - 32} y={CENTER_Y + 40} width="64" height="24">
                <div className="classroom-3d-label" aria-label={`Faculty ${facultyName}`}>{facultyName}</div>
              </foreignObject>
            )}
          </g>

          {/* Student dots */}
          {classified.map((p) => {
            const pos = toSvg(p.x, p.z)
            return <StudentDot key={p.id || p.roll || p.name} p={p} cx={pos.cx} cy={pos.cy} presenceState={p.presenceState} showLabels={showLabels} />
          })}
        </svg>

        {/* Top-left range pill */}
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow-card">
          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
          {RANGE_METERS} m range
        </div>
        {/* Bottom-left freshness note */}
        <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate shadow-card">
          Updated just now
        </div>
      </div>

      {/* ── Sidebar (right, 380px) ── */}
      <aside className="w-full max-w-[380px] flex-shrink-0 space-y-4 overflow-y-auto">
        <Summary nearbyCount={nearbyCount} total={classified.length} />
        <Legend />
                <RosterGroup label="Near" students={near} presenceState="near" />
        <RosterGroup label="Idle" students={idle} presenceState="idle" />
        <RosterGroup label="Out of range" students={out} presenceState="out" />
      </aside>
    </div>
  )
}

// ── Summary counter ──
function Summary({ nearbyCount, total }) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
      <p className="font-display text-[32px] font-bold">
        <span className="text-green-600">{nearbyCount}</span>
        {total > 0 && ` of ${total}`}
      </p>
      <p className="font-sans text-[13px] text-slate">students nearby</p>
    </div>
  )
}

// ── Legend ──
function Legend() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas px-4 py-2.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
        <span className="h-2.5 w-2.5 rounded-full bg-green-600"></span>
      </span>
      <span className="font-mono text-[11px] font-semibold uppercase text-slate">Near</span>
      <span className="h-4 w-px bg-hairline"></span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
      </span>
      <span className="font-mono text-[11px] font-semibold uppercase text-slate">Idle</span>
      <span className="h-4 w-px bg-hairline"></span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-500"></span>
      </span>
      <span className="font-mono text-[11px] font-semibold uppercase text-slate">Out of range</span>
    </div>
  )
}

// ── Student dot with optional label + pulse halo ──
function StudentDot({ p, cx, cy, presenceState, showLabels }) {
  const color = DOT_COLOR[presenceState]
  return (
    <g>
      {presenceState === 'near' && <PulseHalo cx={cx} cy={cy} color={color} />}
      <circle cx={cx} cy={cy} r="5" fill={color} stroke="#fff" strokeWidth="1.5" />
      {showLabels && (
        <foreignObject x={cx - 30} y={cy - 14} width="60" height="40" pointerEvents="none">
          <div
            className="classroom-3d-label"
            aria-label={AriaLiveLabel(p, presenceState)}
            style={{ fontSize: '10px', padding: '2px 6px' }}
          >
            {p.name} · {Math.round(p.distance || 0)}m
          </div>
        </foreignObject>
      )}
    </g>
  )
}

// ── Soft radiating pulse for near students ──
function PulseHalo({ cx, cy, color }) {
  return (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r="5"
        fill="none"
        stroke={color}
        strokeWidth="2"
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
      />
    </g>
  )
}

// ── Sidebar roster group ──
function RosterGroup({ label, students, presenceState }) {
  const color = DOT_COLOR[presenceState]
  return (
    <div className="space-y-2">
      <h3 className="font-display text-[13px] font-semibold text-ink flex items-center justify-between">
        <span>{label}</span>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
          {students.length}
        </span>
      </h3>
      {students.length === 0 ? (
        <p className="font-sans text-[12px] text-ink-muted-48 py-2">— none —</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <StudentCard key={s.id || s.roll} student={s} presenceState={presenceState} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sidebar student card ──
function StudentCard({ student, presenceState }) {
  const color = DOT_COLOR[presenceState]
  const avatarBg = DOT_BG[presenceState]
  const ago = student.ts ? Math.max(0, Math.round((Date.now() - new Date(student.ts).getTime()) / 1000)) : null
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${avatarBg}`}
          style={{ color }}
          aria-label={`Status ${presenceState}`}
        >
          {initials(student.name)}
        </div>
        <div className="min-w-0">
          <p className="font-sans text-[14px] font-bold text-ink truncate">{student.name}</p>
          <p className="font-mono text-[11px] text-slate">
            {student.roll && <span>Roll: {student.roll} · </span>}
            {ago !== null ? `${ago < 60 ? `${ago}s` : `${Math.floor(ago / 60)}m`} ago` : 'No scan yet'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-sans text-[14px] font-bold text-ink">{Math.round(student.distance || 0)}m</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: `${color}15`, color }}>
          {presenceState}
        </span>
      </div>
    </div>
  )
}
