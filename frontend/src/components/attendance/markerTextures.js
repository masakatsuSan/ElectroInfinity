// Self-drawn canvas textures for live-map markers.
// All artwork is generated here at runtime (no external images / no font
// dependencies), so rendering is pixel-identical across every device.
import * as THREE from 'three'

const textureCache = new Map()

function shadeColor(hex, percent) {
  const n = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.min(255, Math.max(0, (n >> 16) + amt))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt))
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function roundedRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
}

// ── Circular person pin (Google-Maps-style avatar) ──
export function getAvatarTexture(color) {
  const key = `avatar:${color}`
  if (textureCache.has(key)) return textureCache.get(key)

  const S = 128
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')

  // soft dark backing disc (reads well on any floor colour)
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8, 14, 26, 0.6)'
  ctx.fill()

  // gradient disc in the state colour
  const g = ctx.createRadialGradient(S / 2, S / 2, 8, S / 2, S / 2, S / 2 - 4)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.28, color)
  g.addColorStop(1, shadeColor(color, -28))
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()

  // white person silhouette (head + shoulders)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(S / 2, 47, 17, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(S / 2, 94, 27, 24, 0, Math.PI, Math.PI * 2)
  ctx.fill()

  // crisp white hairline rim
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2)
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  textureCache.set(key, texture)
  return texture
}

// ── Compact name/roll tag (shown above every marker) ──
export function getLabelTexture(name, roll, color, showRoll = true) {
  const key = `label:${name}|${roll}|${color}|${showRoll}`
  if (textureCache.has(key)) return textureCache.get(key)

  const font = '600 32px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
  const text = showRoll && roll ? `${name} · ${roll}` : name

  const probe = document.createElement('canvas').getContext('2d')
  probe.font = font
  const textW = Math.ceil(probe.measureText(text).width)

  const h = 46
  const w = textW + 64
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  roundedRect(ctx, 2, 2, w - 4, h - 4, h / 2)
  ctx.fillStyle = 'rgba(8, 14, 26, 0.82)'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = `${color}cc`
  roundedRect(ctx, 2, 2, w - 4, h - 4, h / 2)
  ctx.stroke()

  // status dot
  ctx.beginPath()
  ctx.arc(21, h / 2, 6, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  ctx.font = font
  ctx.fillStyle = '#f8fafc'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 37, h / 2 + 1)

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  textureCache.set(key, texture)
  return texture
}