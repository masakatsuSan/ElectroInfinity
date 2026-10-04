// Polls mtimes of every file under frontend/src every 500ms for N seconds.
// Logs ANY perceived change so we can correlate with Vite's spurious HMR events.
const fs = require('fs')
const path = require('path')

const ROOT = 'C:/Users/sumit/OneDrive/Desktop/ElectroInfinity/frontend/src'
const DURATION_MS = 25000
const INTERVAL_MS = 500

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function snap(files) {
  const m = {}
  for (const f of files) {
    try { m[f] = fs.statSync(f).mtimeMs } catch (_) {}
  }
  return m
}

const files = walk(ROOT)
let prev = snap(files)
const t0 = Date.now()
let changes = 0
console.log(`[watcher] monitoring ${files.length} files under src/ for ${DURATION_MS}ms`)

const iv = setInterval(() => {
  const now = snap(files)
  for (const f of files) {
    if (now[f] !== prev[f]) {
      changes++
      console.log(`[watcher] ${new Date().toISOString().slice(11,19)} CHANGED: ${f}  (prev=${prev[f]} new=${now[f]})`)
    }
  }
  prev = now
}, INTERVAL_MS)

setTimeout(() => {
  clearInterval(iv)
  console.log(`[watcher] done. total perceived changes: ${changes}`)
}, DURATION_MS)
