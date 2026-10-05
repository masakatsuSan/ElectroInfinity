const crypto = require('crypto')
const Session = require('../models/Session')
const AttendanceRecord = require('../models/AttendanceRecord')
const User = require('../models/User')
const logger = require('../utils/logger')

const activeTimers = new Map()

function generateToken() {
  return crypto.randomBytes(16).toString('hex')
}

async function emitQrUpdate(sessionId, io, checkpointNumber = 0) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 15000)
  await Session.findByIdAndUpdate(sessionId, {
    currentQrToken: token,
    qrExpiresAt: expiresAt,
    activeCheckpoint: checkpointNumber,
  })
  io?.to(`session:${sessionId}`).emit('qr-update', {
    sessionId: sessionId.toString(),
    token,
    expiresAt,
    checkpointNumber,
  })
}

function clearSessionTimers(sessionId) {
  const key = sessionId.toString()
  const timers = activeTimers.get(key)
  if (!timers) return
  if (timers.qrInterval) clearInterval(timers.qrInterval)
  timers.checkpointTimeouts?.forEach(clearTimeout)
  if (timers.endTimeout) clearTimeout(timers.endTimeout)
  activeTimers.delete(key)
}

async function endSession(sessionId, io) {
  clearSessionTimers(sessionId)
  const session = await Session.findByIdAndUpdate(
    sessionId,
    { status: 'ended', active: false, endTime: new Date(), activeCheckpoint: 0 },
    { new: true }
  )
  if (!session) return null

  // Flag students who missed any checkpoint window
  await flagMissedCheckpoints(session)

  io?.to(`session:${sessionId}`).emit('session-ended', { sessionId: sessionId.toString() })
  return session
}

async function flagMissedCheckpoints(session) {
  const initialScans = await AttendanceRecord.find({
    session: session._id,
    checkpointNumber: 0,
  }).select('student')

  const presentStudentIds = initialScans.map(r => r.student.toString())

  for (const cp of (session.checkpoints || [])) {
    const scanned = await AttendanceRecord.find({
      session: session._id,
      checkpointNumber: cp.number,
    }).select('student')

    const scannedIds = new Set(scanned.map(r => r.student.toString()))

    for (const studentId of presentStudentIds) {
      if (!scannedIds.has(studentId)) {
        await AttendanceRecord.findOneAndUpdate(
          { session: session._id, student: studentId, checkpointNumber: cp.number },
          {
            session: session._id,
            student: studentId,
            checkpointNumber: cp.number,
            timestamp: cp.expiresAt || new Date(),
            locationVerified: false,
            flagged: true,
          },
          { upsert: true, new: true }
        )
      }
    }
  }
}

async function triggerCheckpoint(sessionId, io, checkpointNumber) {
  const session = await Session.findById(sessionId)
  if (!session || session.status !== 'active') return

  const expiresAt = new Date(Date.now() + 20000)

  // Ensure checkpoint is registered in checkpoints array if not present
  const exists = session.checkpoints?.some(c => c.number === checkpointNumber)
  if (exists) {
    await Session.updateOne(
      { _id: sessionId, 'checkpoints.number': checkpointNumber },
      {
        $set: {
          'checkpoints.$.triggeredAt': new Date(),
          'checkpoints.$.expiresAt': expiresAt,
          activeCheckpoint: checkpointNumber,
        },
      }
    )
  } else {
    await Session.findByIdAndUpdate(sessionId, {
      $push: { checkpoints: { number: checkpointNumber, triggeredAt: new Date(), expiresAt } },
      activeCheckpoint: checkpointNumber,
    })
  }

  io?.to(`session:${sessionId}`).emit('checkpoint-start', {
    sessionId: sessionId.toString(),
    checkpointNumber,
    expiresAt,
  })

  await emitQrUpdate(sessionId, io, checkpointNumber)

  const timers = activeTimers.get(sessionId.toString())
  if (timers?.qrInterval) clearInterval(timers.qrInterval)

  const checkpointQrInterval = setInterval(
    () => emitQrUpdate(sessionId, io, checkpointNumber),
    15000
  )

  setTimeout(async () => {
    clearInterval(checkpointQrInterval)
    const currentSession = await Session.findById(sessionId)
    if (!currentSession || currentSession.status !== 'active') return

    const resumeInterval = setInterval(() => emitQrUpdate(sessionId, io, 0), 15000)
    await Session.findByIdAndUpdate(sessionId, { activeCheckpoint: 0 })
    await emitQrUpdate(sessionId, io, 0)

    const t = activeTimers.get(sessionId.toString())
    if (t) t.qrInterval = resumeInterval
  }, 20000)
}

async function startSessionTimers(session, io) {
  const sessionId = session._id.toString()
  clearSessionTimers(sessionId)

  const durationMs = (session.durationMinutes || 60) * 60 * 1000
  const checkpointCount = 1 + Math.floor(Math.random() * 2) // 1-2 surprise checkpoints
  const checkpoints = []

  for (let i = 1; i <= checkpointCount; i++) {
    const minOffset = durationMs * 0.2
    const maxOffset = durationMs * 0.8
    const offset = minOffset + Math.random() * (maxOffset - minOffset)
    checkpoints.push({ number: i, triggeredAt: null, expiresAt: null, _offset: offset })
  }

  checkpoints.sort((a, b) => a._offset - b._offset)
  const checkpointDocs = checkpoints.map(({ number }) => ({ number, triggeredAt: null, expiresAt: null }))
  await Session.findByIdAndUpdate(session._id, { checkpoints: checkpointDocs })

  const qrInterval = setInterval(() => emitQrUpdate(session._id, io, 0), 15000)
  await emitQrUpdate(session._id, io, 0)

  const checkpointTimeouts = checkpoints.map((cp) =>
    setTimeout(() => triggerCheckpoint(session._id, io, cp.number), cp._offset)
  )

  const endTimeout = setTimeout(() => endSession(session._id, io), durationMs)

  activeTimers.set(sessionId, { qrInterval, checkpointTimeouts, endTimeout })
}

// Server restarts kill the in-memory timers, which used to leave
// sessions "active" forever. On startup (and periodically) any
// session that has been active longer than its duration plus a
// grace window is force-ended so QR tokens stop rotating and
// students stop being marked absent.
const STALE_GRACE_MS = 30 * 60 * 1000

async function sweepStaleSessions(io) {
  // Sessions whose startTime is older than duration + grace are
  // definitely over; anything without a startTime is corrupt.
  const candidates = await Session.find({
    status: 'active',
    active: true,
  })
  const toEnd = []
  for (const session of candidates) {
    const durationMs = (session.durationMinutes || 60) * 60 * 1000
    const startedAt = session.startTime ? new Date(session.startTime).getTime() : 0
    if (!session.startTime || Date.now() - startedAt > durationMs + STALE_GRACE_MS) {
      toEnd.push(session._id)
    }
  }
  for (const id of toEnd) {
    await endSession(id, io)
  }
  if (toEnd.length) {
    logger.info({ event: 'stale_sessions_swept', count: toEnd.length })
  }
  return toEnd.length
}

async function buildSessionFeed(sessionId) {  const session = await Session.findById(sessionId)
    .populate('faculty', 'name email')
    .populate('room', 'name')
  if (!session) return null

  const records = await AttendanceRecord.find({ session: sessionId })
    .populate('student', 'name rollNumber batch section email')
    .sort({ timestamp: 1 })

  const studentFilter = {
    batch: session.batch,
    role: { $in: ['student', 'cr'] },
  }
  if (session.section && session.section.trim()) {
    studentFilter.section = session.section.trim()
  }

  const students = await User.find(studentFilter).select('name rollNumber batch section email')

  const byStudent = {}
  for (const s of students) {
    byStudent[s._id.toString()] = {
      student: s,
      initial: null,
      checkpoints: {},
      missedCheckpoints: [],
      distanceInMeters: null,
      status: 'absent',
    }
  }

  for (const rec of records) {
    const sid = rec.student._id.toString()
    if (!byStudent[sid]) {
      byStudent[sid] = {
        student: rec.student,
        initial: null,
        checkpoints: {},
        missedCheckpoints: [],
        distanceInMeters: null,
        status: 'absent',
      }
    }
    if (rec.checkpointNumber === 0) {
      byStudent[sid].initial = rec
      byStudent[sid].distanceInMeters = rec.distanceInMeters
      byStudent[sid].status = rec.flagged ? 'flagged' : 'present'
    } else {
      byStudent[sid].checkpoints[rec.checkpointNumber] = rec
      if (rec.flagged) byStudent[sid].missedCheckpoints.push(rec.checkpointNumber)
    }
  }

  for (const entry of Object.values(byStudent)) {
    if (entry.initial && entry.missedCheckpoints.length > 0) {
      entry.status = 'flagged'
    }
  }

  return {
    session,
    feed: Object.values(byStudent),
    records,
  }
}

module.exports = {
  activeTimers,
  generateToken,
  emitQrUpdate,
  clearSessionTimers,
  endSession,
  triggerCheckpoint,
  startSessionTimers,
  buildSessionFeed,
  sweepStaleSessions,
}
