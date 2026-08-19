import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Grid, OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import { getAvatarTexture, getLabelTexture } from './markerTextures'

// ── visual states (concepts only — live markers are drawn textures, never emoji) ──
const STATE = {
  present: { color: '#22c55e', label: 'Live' },
  flagged: { color: '#f59e0b', label: 'Flagged' },
  stale:   { color: '#94a3b8', label: 'Stale' },
  noGps:   { color: '#64748b', label: 'No GPS' },
  faculty: { color: '#38bdf8', label: 'You' },
}

const LOW_ACCURACY_M = 150
const STALE_AFTER_MS = 45000
const MAX_SPEED_MPS = 9.8

// Shared flat triangle pointing up the +Y axis (laid on the floor; apex = heading)
const DIRECTION_SHAPE = new THREE.Shape()
DIRECTION_SHAPE.moveTo(0, -0.5)
DIRECTION_SHAPE.lineTo(0.24, 0.25)
DIRECTION_SHAPE.lineTo(-0.24, 0.25)
DIRECTION_SHAPE.closePath()
const DIRECTION_GEOMETRY = new THREE.ShapeGeometry(DIRECTION_SHAPE)

function resolveState(p) {
  if (!p.hasGps) return 'noGps'
  if (p.status === 'flagged') return 'flagged'
  if (p.ts) {
    const age = Date.now() - new Date(p.ts).getTime()
    if (age > STALE_AFTER_MS) return 'stale'
  }
  return 'present'
}

function circlePoints(radius) {
  // No hard cap — draw the student's real accuracy radius. Only clamp against
  // pathological values so the geometry stays sane.
  const r = Math.min(Math.max(Number.isFinite(radius) ? radius : 60, 5), 2000)
  const pts = []
  const segs = 64
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2
    pts.push([Math.cos(a) * r, 0.05, Math.sin(a) * r])
  }
  return pts
}

function fmtAgo(ts) {
  if (!ts) return '—'
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000))
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

const CLASSROOM_OUTLINE = [
  [-58, -45, 0],
  [58, -45, 0],
  [58, 45, 0],
  [-58, 45, 0],
  [-58, -45, 0],
]

// ── expanding halo / pulse rings (two cheap meshes — no DOM) ──
function PulseRings({ color, active, boostKey = 0 }) {
  const ringA = useRef()
  const ringB = useRef()
  const flash = useRef()
  const boostRef = useRef(0)
  const phase = useRef(Math.random() * 10)
  const lastBoost = useRef(0)

  useEffect(() => {
    if (boostKey !== lastBoost.current) {
      lastBoost.current = boostKey
      boostRef.current = 1
    }
  }, [boostKey])

  useFrame((state, delta) => {
    if (!ringA.current) return
    const t = ((state.clock.elapsedTime + phase.current) / 1.6) % 1
    const t2 = (((state.clock.elapsedTime + phase.current) / 1.6) + 0.5) % 1

    ringA.current.scale.setScalar(0.9 + t * 2.1)
    ringA.current.material.opacity = active ? (1 - t) * 0.18 : 0
    ringB.current.scale.setScalar(0.9 + t2 * 1.6)
    ringB.current.material.opacity = active ? (1 - t2) * 0.12 : 0

    if (flash.current) {
      if (boostRef.current > 0) {
        const f = boostRef.current
        flash.current.scale.setScalar(0.8 + (1 - f) * 2.4)
        flash.current.material.opacity = f * 0.35
        boostRef.current = Math.max(0, f - delta)
      } else {
        flash.current.material.opacity = 0
      }
    }
  })

  return (
    <group position={[0, 0.05, 0]}>
      <mesh ref={ringA} rotation={[-Math.PI / 2, 0, 0]} visible={active}>
        <ringGeometry args={[0.5, 0.62, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringB} rotation={[-Math.PI / 2, 0, 0]} visible={active}>
        <ringGeometry args={[0.5, 0.62, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={flash} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.58, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ── short, fading movement trail (dots pinned to real recent GPS way-points) ──
function TrailDots({ count = 5, color, trailRef, originRef }) {
  const dots = useRef([])
  useFrame(() => {
    const origin = originRef.current?.position
    const trail = trailRef.current
    if (!origin || !trail) return
    const len = trail.length
    for (let i = 0; i < count; i++) {
      const m = dots.current[i]
      if (!m) continue
      const idx = len - 1 - i
      if (idx >= 0) {
        const pt = trail[idx]
        m.visible = true
        m.position.set(pt.x - origin.x, 0.035, pt.z - origin.z)
        m.material.opacity = 0.24 * ((i + 1) / count)
        m.scale.setScalar(0.42 - i * 0.05)
      } else {
        m.visible = false
      }
    }
  })
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dots.current[i] = el
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.28, 0.42, 20]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

// ── "You are here" faculty marker: distinct blue, pulsing, labelled ──
function FacultyMarker({ showLabel }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.1, 40]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.75, 1.95, 40]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>
      <PulseRings color="#38bdf8" active />
      {showLabel && (
        <Html position={[0, 0.85, 0]} center distanceFactor={0}>
          <div
            style={{
              background: 'rgba(56,189,248,0.14)',
              border: '1px solid rgba(56,189,248,0.65)',
              color: '#e0f2fe',
              padding: '2px 9px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              fontFamily: 'Inter, system-ui, sans-serif',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            YOU · FACULTY
          </div>
        </Html>
      )}
    </group>
  )
}


// ── per-student live map marker: smooth movement, heading, trail, states ──
function StudentMarker({ p, selected, onSelect, showLabel }) {
  const groupRef = useRef()
  const dirRef = useRef()
  const curPos = useRef({ x: p.x, z: p.z })
  const tgt = useRef({ x: p.x, z: p.z })
  const headingRef = useRef(0)
  const speedRef = useRef(0)
  const sampleRef = useRef({ x: p.x, z: p.z, t: 0 })
  const trailRef = useRef([])
  const lastTrailPush = useRef(0)
  const [hovered, setHovered] = useState(false)
  const [boost, setBoost] = useState(0)

  const state = resolveState(p)
  const lowAcc = state === 'present' && p.accuracy != null && p.accuracy > LOW_ACCURACY_M
  const kind = lowAcc ? 'flagged' : state === 'noGps' ? 'noGps' : state
  const color = STATE[kind].color
  const statusLabel = lowAcc ? 'Low GPS' : STATE[state].label

  const avatarTex = useMemo(() => getAvatarTexture(color), [p.id, color])
  const labelTex = useMemo(() => getLabelTexture(p.name, p.roll, color), [p.name, p.roll, color])

  // New GPS fix arrives → record target, speed, a real way-point and a fresh pulse
  useEffect(() => {
    tgt.current.x = p.x
    tgt.current.z = p.z
    const now = Date.now()
    const prev = sampleRef.current
    const dt = prev.t ? (now - prev.t) / 1000 : 0
    if (prev.t && dt > 0.4) {
      const dist = Math.hypot(p.x - prev.x, p.z - prev.z)
      speedRef.current = Math.min(MAX_SPEED_MPS, dist / dt)
      if (dist > 0.5) {
        const h = trailRef.current
        const last = h[h.length - 1]
        if (!last || Math.hypot(last.x - prev.x, last.z - prev.z) > 0.4) {
          h.push({ x: prev.x, z: prev.z })
        }
        while (h.length > 4) h.shift()
      }
      setBoost((b) => b + 1)
    } else if (prev.t && dt >= 0.9) {
      speedRef.current = 0
    }
    sampleRef.current = { x: p.x, z: p.z, t: now }
  }, [p.x, p.z])

  // Glide smoothly toward the latest real fix; never invent movement
  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g) return
    const dt = Math.min(delta, 0.1)
    const k = 1 - Math.exp(-7.5 * dt)
    const nx = THREE.MathUtils.lerp(curPos.current.x, tgt.current.x, k)
    const nz = THREE.MathUtils.lerp(curPos.current.z, tgt.current.z, k)
    const dx = tgt.current.x - nx
    const dz = tgt.current.z - nz
    curPos.current.x = nx
    curPos.current.z = nz
    g.position.set(nx, 0, nz)

    if (Math.hypot(dx, dz) > 0.08) {
      headingRef.current = Math.atan2(dx, dz)
    }
    if (dirRef.current) {
      dirRef.current.rotation.y = headingRef.current
    }

    if (Math.hypot(dx, dz) > 0.03 && state.clock.elapsedTime - lastTrailPush.current > 0.1) {
      lastTrailPush.current = state.clock.elapsedTime
      const h = trailRef.current
      h.push({ x: nx, z: nz })
      while (h.length > 5) h.shift()
    }
  })

  const nameWidth = Math.min(
    Math.max(0.4, 0.26 + (p.name.length + (p.roll ? p.roll.length + 2 : 0)) * 0.055),
    1.7
  )

  return (
    <group ref={groupRef} position={[p.x, 0, p.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 28]} />
        <meshBasicMaterial color={color} transparent opacity={state === 'noGps' ? 0.12 : 0.2} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.28, 0.45, 28]} />
        <meshBasicMaterial color={color} transparent opacity={state === 'noGps' ? 0.3 : 0.95} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {(state === 'present' || state === 'flagged') && (
        <group ref={dirRef}>
          <mesh geometry={DIRECTION_GEOMETRY} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.015, 0.25]}>
            <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      <sprite position={[0, 0.95, 0]} scale={[1.18, 1.18, 1]} frustumCulled={false}>
        <spriteMaterial map={avatarTex} transparent opacity={state === 'noGps' ? 0.55 : 1} depthWrite={false} />
      </sprite>

      {showLabel && (
        <sprite position={[0, 1.72, 0]} scale={[nameWidth, 0.42, 1]} frustumCulled={false}>
          <spriteMaterial map={labelTex} transparent opacity={selected ? 1 : 0.92} depthWrite={false} />
        </sprite>
      )}

      {(state === 'present' || state === 'flagged') && (
        <PulseRings color={color} active boostKey={boost} />
      )}

      <TrailDots color={color} trailRef={trailRef} originRef={groupRef} />

      {(selected || hovered || lowAcc) && p.accuracy != null && (
        <Line
          points={circlePoints(p.accuracy)}
          color={lowAcc ? '#facc15' : color}
          lineWidth={1.2}
          transparent
          opacity={lowAcc ? 0.8 : selected || hovered ? 0.5 : 0.65}
          position={[0, 0.06, 0]}
        />
      )}

      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(p.id || p.roll || p.name)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[1.3, 10, 10]} />
        <meshBasicMaterial />
      </mesh>


      {selected && (
        <Html position={[0, 2.3, 0]} center distanceFactor={28} style={{ pointerEvents: 'auto', zIndex: 5 }}>
          <div className="select-none" style={{ width: 224, fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}>
            <div style={{ background: `${color}26`, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
              <span style={{ background: color, color: '#ffffff', width: 38, height: 38, borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, letterSpacing: '0.03em', flexShrink: 0 }}>
                {(p.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Student'}</p>
                <p style={{ margin: 0, fontSize: 11.5, fontFamily: 'monospace', color: '#64748b' }}>{p.roll || '—'}</p>
              </div>
              <span style={{ background: color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>{statusLabel}</span>
            </div>
            <div style={{ padding: '9px 12px 11px', background: 'rgba(255,255,255,0.99)', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, fontSize: 11.5, color: '#334155' }}>
              <Row label="GPS accuracy" value={p.accuracy != null ? `±${Math.round(p.accuracy)}m` : 'n/a'} />
              {lowAcc && <Row label="Accuracy" value="Low" accent />}
              <Row label="Distance" value={p.distance != null ? `${p.distance}m away` : '—'} />
              <Row label="Speed" value={speedRef.current > 0.3 ? `${speedRef.current.toFixed(1)} m/s` : 'Stationary'} />
              <Row label="Last scan" value={fmtAgo(p.ts)} />
            </div>
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid rgba(255,255,255,0.99)' }} />
          </div>
        </Html>
      )}
    </group>
  )
}

function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <b style={{ color: accent ? '#f59e0b' : '#0f172a', textAlign: 'right' }}>{value}</b>
    </div>
  )
}

// ── the live map scene ──
function LiveScene({ positions, autoRotate, showLabels, selectedId, onSelect }) {
  const selectedIs = (p) => (p.id || p.roll || p.name) === selectedId
  // Re-render every 15s so markers slide to "Stale" even when no new scans arrive
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000)
    return () => clearInterval(id)
  }, [])
  return (
    <>
      <color attach="background" args={['#0b1220']} />
      <fog attach="fog" args={['#0b1220', 150, 260]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[35, 80, 25]} intensity={1} />

      <Grid
        position={[0, 0, 0]}
        args={[800, 600]}
        cellSize={2.5}
        cellThickness={0.35}
        cellColor="#18273d"
        sectionSize={12.5}
        sectionThickness={0.7}
        sectionColor="#233a58"
        fadeDistance={700}
        fadeStrength={1.3}
        infiniteGrid
      />

      <Line points={CLASSROOM_OUTLINE} color="#28476b" transparent opacity={0.45} lineWidth={1} position={[0, 0.03, 0]} />

      <FacultyMarker showLabel={showLabels && !autoRotate} />

      {positions.map((p) => (
        <StudentMarker
          key={p.id || p.roll || p.name}
          p={p}
          selected={selectedIs(p)}
          onSelect={onSelect}
          showLabel={showLabels}
        />
      ))}

      {/* invisible floor to clear selection when tapping empty space */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        visible={false}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(null)
        }}
      >
        <planeGeometry args={[1600, 1600]} />
        <meshBasicMaterial />
      </mesh>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.09}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        minDistance={5}
        maxDistance={1200}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
      />
    </>
  )
}

// ── public component (lazy-loaded by the faculty dashboard) ──
export default function Classroom3D({ positions = [], autoRotate = false, showLabels = true }) {
  const [selectedId, setSelectedId] = useState(null)
  const onSelect = (id) => setSelectedId(id)

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 105, 62], fov: 42 }}
      style={{ width: '100%', height: '100%', background: '#0b1220' }}
      onPointerMissed={() => setSelectedId(null)}
    >
      <Suspense fallback={null}>
        <LiveScene positions={positions} autoRotate={autoRotate} showLabels={showLabels} selectedId={selectedId} onSelect={onSelect} />
      </Suspense>
    </Canvas>
  )
}

