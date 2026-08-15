const express = require('express')
const User = require('../models/User')
const Room = require('../models/Room')
const Session = require('../models/Session')
const Subject = require('../models/Subject')
const AttendanceRecord = require('../models/AttendanceRecord')
const { protect, guard } = require('../middleware/auth')
const { distanceMeters } = require('../utils/geofence')
const {
  endSession,
  triggerCheckpoint,
  startSessionTimers,
  buildSessionFeed,
} = require('../services/attendanceSession')

const router = express.Router()

function getIo(req) {
  return req.app.get('io')
}

// ── Admin: Faculty Management ─────────────────────────────────────────────

// @route   GET /api/attendance/admin/faculty
// @desc    Get all faculty accounts
router.get('/admin/faculty', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .sort({ createdAt: -1 })
    res.json({ success: true, count: faculty.length, data: faculty })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   POST /api/attendance/admin/faculty
// @desc    Create faculty account with teaching assignments
router.post('/admin/faculty', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, email, password, teachingAssignments, assignedBatches, assignedCourses } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already in use' })
    }

    const formattedAssignments = Array.isArray(teachingAssignments)
      ? teachingAssignments.map(a => ({
          batch: (a.batch || '').trim(),
          subject: (a.subject || '').trim(),
        })).filter(a => a.batch && a.subject)
      : []

    const faculty = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'faculty',
      teachingAssignments: formattedAssignments,
      assignedBatches: assignedBatches || formattedAssignments.map(a => a.batch),
      assignedCourses: assignedCourses || formattedAssignments.map(a => a.subject),
      isVerified: true,
      isActive: true,
    })

    faculty.password = undefined
    res.status(201).json({ success: true, data: faculty })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   PUT /api/attendance/admin/faculty/:id
// @desc    Update faculty account and teaching assignments
router.put('/admin/faculty/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, email, password, teachingAssignments, isActive } = req.body
    const faculty = await User.findById(req.params.id)
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, error: 'Faculty account not found' })
    }

    if (name) faculty.name = name.trim()
    if (email) {
      const emailTaken = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: faculty._id } })
      if (emailTaken) return res.status(400).json({ success: false, error: 'Email already in use' })
      faculty.email = email.toLowerCase().trim()
    }
    if (password && password.trim().length >= 6) {
      faculty.password = password
    }
    if (teachingAssignments !== undefined) {
      faculty.teachingAssignments = Array.isArray(teachingAssignments)
        ? teachingAssignments.map(a => ({
            batch: (a.batch || '').trim(),
            subject: (a.subject || '').trim(),
          })).filter(a => a.batch && a.subject)
        : []
      faculty.assignedBatches = faculty.teachingAssignments.map(a => a.batch)
      faculty.assignedCourses = faculty.teachingAssignments.map(a => a.subject)
    }
    if (isActive !== undefined) {
      faculty.isActive = Boolean(isActive)
    }

    await faculty.save()
    const updated = await User.findById(faculty._id).select('-password')
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   PATCH /api/attendance/admin/faculty/:id/toggle-active
// @desc    Toggle faculty active status (deactivate/activate)
router.patch('/admin/faculty/:id/toggle-active', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id)
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, error: 'Faculty account not found' })
    }

    faculty.isActive = faculty.isActive !== undefined ? !faculty.isActive : false
    await faculty.save()

    res.json({
      success: true,
      data: { _id: faculty._id, name: faculty.name, isActive: faculty.isActive },
      message: `Faculty account ${faculty.isActive ? 'activated' : 'deactivated'} successfully`,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   DELETE /api/attendance/admin/faculty/:id
// @desc    Delete faculty account
router.delete('/admin/faculty/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id)
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, error: 'Faculty account not found' })
    }
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Faculty account deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Legacy endpoint compatibility
router.get('/faculty', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' }).select('-password').sort({ name: 1 })
    res.json({ success: true, data: faculty })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
router.post('/faculty', protect, guard('admin', 'super_admin'), async (req, res) => {
  const { name, email, password, teachingAssignments, assignedBatches, assignedCourses } = req.body
  const assignments = teachingAssignments || (assignedBatches || []).map(b => ({ batch: b, section: '', subject: assignedCourses?.[0] || 'ECT' }))
  req.body.teachingAssignments = assignments
  return router.handle(req, res)
})

// ── Rooms (Admin/Legacy) ──────────────────────────────────────────────────

router.get('/rooms', protect, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ name: 1 })
    res.json({ success: true, data: rooms })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/rooms', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, latitude, longitude, radiusMeters } = req.body
    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ success: false, error: 'Name and GPS coordinates are required' })
    }
    const room = await Room.create({
      name: name.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: radiusMeters ? Number(radiusMeters) : 50,
    })
    res.status(201).json({ success: true, data: room })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/rooms/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Room removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Faculty: Session Flow ─────────────────────────────────────────────────

// @route   POST /api/attendance/sessions/start
// @desc    Faculty starts attendance session with device GPS anchor
router.post('/sessions/start', protect, guard('faculty'), async (req, res) => {
  try {
    const { batch, section, subject, course, centerLat, centerLng, latitude, longitude, durationMinutes, roomId } = req.body
    const targetSubject = (subject || course || '').trim()
    const targetBatch = (batch || '').trim()
    const targetSection = (section || '').trim()
    const lat = centerLat != null ? Number(centerLat) : latitude != null ? Number(latitude) : null
    const lng = centerLng != null ? Number(centerLng) : longitude != null ? Number(longitude) : null

    if (!targetBatch || !targetSubject) {
      return res.status(400).json({ success: false, error: 'Batch and subject are required' })
    }
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Faculty GPS location is required to anchor the classroom geofence. Please allow location permissions in your browser.',
      })
    }

    // Verify teaching assignment if faculty has configured assignments
    if (req.user.teachingAssignments && req.user.teachingAssignments.length > 0) {
      const allowed = req.user.teachingAssignments.some(a => {
        const batchMatch = a.batch.toLowerCase() === targetBatch.toLowerCase()
        const subjectMatch = a.subject.toLowerCase() === targetSubject.toLowerCase()
        const sectionMatch = !a.section || !targetSection || a.section.toLowerCase() === targetSection.toLowerCase()
        return batchMatch && subjectMatch && sectionMatch
      })

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: `You are not assigned to teach ${targetSubject} for batch ${targetBatch}${targetSection ? ` (Sec ${targetSection})` : ''}`,
        })
      }
    }

    // End any existing active session of this faculty
    const existing = await Session.findOne({ faculty: req.user._id, status: 'active' })
    if (existing) {
      const io = getIo(req)
      await endSession(existing._id, io)
    }

    const session = await Session.create({
      batch: targetBatch,
      section: targetSection,
      subject: targetSubject,
      course: targetSubject,
      faculty: req.user._id,
      centerLat: lat,
      centerLng: lng,
      room: roomId || null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
      status: 'active',
      active: true,
      startTime: new Date(),
    })

    const populated = await Session.findById(session._id)
      .populate('faculty', 'name email')
      .populate('room', 'name')

    const io = getIo(req)
    if (io) {
      await startSessionTimers(populated, io)
    }

    res.status(201).json({
      success: true,
      data: populated,
      message: `Session started for ${targetSubject} (${targetBatch}${targetSection ? ` - Sec ${targetSection}` : ''})`,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/sessions/active
// @desc    Get currently active session for logged-in faculty
router.get('/sessions/active', protect, guard('faculty'), async (req, res) => {
  try {
    const session = await Session.findOne({ faculty: req.user._id, status: 'active' })
      .populate('faculty', 'name email')
      .populate('room', 'name')
    res.json({ success: true, data: session })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   POST /api/attendance/sessions/:id/end
// @desc    End active attendance session
router.post('/sessions/:id/end', protect, guard('faculty', 'admin', 'super_admin'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' })

    const isFacultyOwner = req.user.role === 'faculty' && session.faculty.toString() === req.user._id.toString()
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role)
    if (!isFacultyOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to end this session' })
    }

    if (session.status === 'ended') {
      return res.status(400).json({ success: false, error: 'Session already ended' })
    }

    const io = getIo(req)
    const ended = await endSession(session._id, io)
    res.json({ success: true, data: ended, message: 'Session ended successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   POST /api/attendance/sessions/:id/trigger-checkpoint
// @desc    Trigger mid-session checkpoint QR code
router.post('/sessions/:id/trigger-checkpoint', protect, guard('faculty'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
    if (!session || session.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Active session not found' })
    }
    if (session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your session' })
    }

    const io = getIo(req)
    const nextCpNum = (session.checkpoints?.length || 0) + 1
    await triggerCheckpoint(session._id, io, nextCpNum)

    res.json({ success: true, message: `Checkpoint ${nextCpNum} triggered!` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/sessions/:id/feed
// @desc    Live feed and attendance roster for session
router.get('/sessions/:id/feed', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' })

    const isFaculty = req.user.role === 'faculty' && session.faculty.toString() === req.user._id.toString()
    const isAdmin = ['admin', 'super_admin', 'cr'].includes(req.user.role)
    if (!isFaculty && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const feed = await buildSessionFeed(session._id)
    res.json({ success: true, data: feed })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/faculty/my-classes
// @desc    Get all classes / past sessions conducted by logged-in faculty
router.get('/faculty/my-classes', protect, guard('faculty'), async (req, res) => {
  try {
    const sessions = await Session.find({ faculty: req.user._id })
      .sort({ startTime: -1 })
      .limit(100)

    const sessionIds = sessions.map(s => s._id)
    const records = await AttendanceRecord.find({ session: { $in: sessionIds } })

    const enriched = await Promise.all(sessions.map(async (sess) => {
      const studentFilter = {
        batch: sess.batch,
        role: { $in: ['student', 'cr'] },
      }
      if (sess.section && sess.section.trim()) {
        studentFilter.section = sess.section.trim()
      }
      const totalStudents = await User.countDocuments(studentFilter)
      const sessionRecords = records.filter(r => r.session.toString() === sess._id.toString() && r.checkpointNumber === 0)
      const presentCount = sessionRecords.length
      const flaggedCount = records.filter(r => r.session.toString() === sess._id.toString() && r.flagged).length

      return {
        _id: sess._id,
        subject: sess.subject || sess.course,
        batch: sess.batch,
        section: sess.section || 'All',
        startTime: sess.startTime,
        endTime: sess.endTime,
        status: sess.status,
        active: sess.active,
        centerLat: sess.centerLat,
        centerLng: sess.centerLng,
        durationMinutes: sess.durationMinutes,
        presentCount,
        totalStudents,
        flaggedCount,
        attendancePercentage: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0,
      }
    }))

    res.json({ success: true, count: enriched.length, data: enriched })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/sessions/:id/roster
// @desc    Get complete attendance roster of a specific session
router.get('/sessions/:id/roster', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('faculty', 'name email')
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' })

    const feed = await buildSessionFeed(session._id)
    res.json({ success: true, data: feed })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   DELETE /api/attendance/records/:recordId
// @desc    Faculty deletes an attendance record (removes from calculations, not counted as absence)
router.delete('/records/:recordId', protect, guard('faculty'), async (req, res) => {
  try {
    const record = await AttendanceRecord.findById(req.params.recordId)
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' })
    }

    const session = await Session.findById(record.session)
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    // Verify the faculty member owns this session
    if (session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Not your session' })
    }

    // Delete the record
    const student = await User.findById(record.student).select('name')
    await AttendanceRecord.findByIdAndDelete(req.params.recordId)

    res.json({
      success: true,
      message: `Deleted ${student?.name || 'Student'}'s record from this session`,
      deletedRecordId: record._id,
      studentId: record.student,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Student: Attendance Scanning & Records ─────────────────────────────────

// @route   GET /api/attendance/sessions/active/batch
// @desc    Get active session for student's batch and section
router.get('/sessions/active/batch', protect, guard('student', 'cr'), async (req, res) => {
  try {
    const userBatch = (req.user.batch || '').trim().toLowerCase()
    const userSection = (req.user.section || '').trim().toLowerCase()

    const sessions = await Session.find({ batch: req.user.batch, status: 'active' })
      .populate('faculty', 'name email')
      .populate('room', 'name')
      .sort({ startTime: -1 })

    const matchingSession = sessions.find((session) => {
      const sessionBatch = (session.batch || '').trim().toLowerCase()
      if (sessionBatch !== userBatch) return false

      const sessionSection = (session.section || '').trim().toLowerCase()

      if (!userSection) {
        return !sessionSection
      }

      return !sessionSection || sessionSection === userSection
    }) || null

    res.json({ success: true, data: matchingSession })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   POST /api/attendance/scan
// @desc    Student scans rotating QR code
router.post('/scan', protect, guard('student', 'cr'), async (req, res) => {
  try {
    const { sessionId, token, latitude, longitude, checkpointNumber } = req.body
    const cpNum = checkpointNumber != null ? Number(checkpointNumber) : 0

    if (!sessionId || !token) {
      return res.status(400).json({ success: false, error: 'Session ID and QR token are required' })
    }
    if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, error: 'Live GPS location is required to verify classroom attendance' })
    }

    // Step a: Verify active session
    const session = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }
    if (session.status !== 'active' && !session.active) {
      return res.status(400).json({ success: false, error: 'Class session has ended' })
    }

    // Step b: Verify student batch AND section match session
    if (session.batch.trim().toLowerCase() !== req.user.batch.trim().toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: `This session is for batch ${session.batch}. Not your class.`,
      })
    }

    if (session.section && session.section.trim()) {
      if (req.user.section && req.user.section.trim().toLowerCase() !== session.section.trim().toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: `This session is for Section ${session.section}. Not your class.`,
        })
      }
    }

    // Step c: Verify QR token
    if (session.currentQrToken && session.currentQrToken !== token) {
      return res.status(400).json({
        success: false,
        error: 'QR code expired. Please scan the current code on the faculty screen.',
      })
    }
    if (session.qrExpiresAt && new Date() > new Date(session.qrExpiresAt.getTime() + 10000)) {
      return res.status(400).json({
        success: false,
        error: 'QR code expired. Please scan the latest code on the faculty screen.',
      })
    }

    if (cpNum > 0 && session.activeCheckpoint !== cpNum) {
      return res.status(400).json({ success: false, error: 'No active checkpoint right now' })
    }

    // Step d: GPS Geofence Check (100 meters radius from faculty GPS anchor)
    const studentLat = Number(latitude)
    const studentLng = Number(longitude)
    const facultyLat = Number(session.centerLat)
    const facultyLng = Number(session.centerLng)

    // Validate coordinates are valid numbers and in expected ranges
    if (!isFinite(studentLat) || !isFinite(studentLng) || !isFinite(facultyLat) || !isFinite(facultyLng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GPS coordinates detected. Please ensure location services are working correctly.',
        debug: {
          studentLat,
          studentLng,
          facultyLat,
          facultyLng,
        },
      })
    }

    // Sanity check for valid lat/lng ranges
    if (Math.abs(studentLat) > 90 || Math.abs(studentLng) > 180 || Math.abs(facultyLat) > 90 || Math.abs(facultyLng) > 180) {
      return res.status(400).json({
        success: false,
        error: 'GPS coordinates out of valid range. Contact administrator.',
        debug: {
          studentLat,
          studentLng,
          facultyLat,
          facultyLng,
        },
      })
    }

    const distance = distanceMeters(
      studentLat,
      studentLng,
      facultyLat,
      facultyLng
    )

    const MAX_GEOFENCE_METERS = 100
    if (distance > MAX_GEOFENCE_METERS) {
      return res.status(400).json({
        success: false,
        distanceInMeters: distance,
        error: `You're too far from the classroom (${distance}m away). Must be within 100m of faculty device.`,
        debug: {
          studentLat: studentLat.toFixed(6),
          studentLng: studentLng.toFixed(6),
          facultyLat: facultyLat.toFixed(6),
          facultyLng: facultyLng.toFixed(6),
          calculatedDistance: distance,
        },
      })
    }

    // Step e: Prevent duplicate scan
    const existing = await AttendanceRecord.findOne({
      session: sessionId,
      student: req.user._id,
      checkpointNumber: cpNum,
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Attendance already marked for this checkpoint' })
    }

    if (cpNum > 0) {
      const hasInitial = await AttendanceRecord.findOne({
        session: sessionId,
        student: req.user._id,
        checkpointNumber: 0,
      })
      if (!hasInitial) {
        return res.status(400).json({ success: false, error: 'Must mark initial class attendance first' })
      }
    }

    // Record attendance
    const record = await AttendanceRecord.create({
      session: sessionId,
      student: req.user._id,
      checkpointNumber: cpNum,
      latitude: Number(latitude),
      longitude: Number(longitude),
      distanceInMeters: distance,
      locationVerified: true,
      flagged: false,
      timestamp: new Date(),
    })

    const populated = await AttendanceRecord.findById(record._id)
      .populate('student', 'name rollNumber batch section email')

    const io = getIo(req)
    io?.to(`session:${sessionId}`).emit('attendance-update', {
      sessionId: sessionId.toString(),
      record: populated,
      checkpointNumber: cpNum,
    })

    res.json({
      success: true,
      data: populated,
      distanceInMeters: distance,
      message: cpNum === 0
        ? `Attendance marked successfully! (${distance}m from faculty)`
        : `Checkpoint ${cpNum} verified! (${distance}m from faculty)`,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Attendance already marked for this checkpoint' })
    }
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/student/history
// @desc    Get student lecture history, overall %, and per-subject %
router.get('/student/history', protect, guard('student', 'cr'), async (req, res) => {
  try {
    const studentFilter = { batch: req.user.batch }
    if (req.user.section && req.user.section.trim()) {
      studentFilter.$or = [{ section: '' }, { section: req.user.section }, { section: { $exists: false } }]
    }

    const sessions = await Session.find(studentFilter)
      .populate('faculty', 'name email')
      .sort({ startTime: -1 })
      .limit(100)

    const sessionIds = sessions.map(s => s._id)
    const records = await AttendanceRecord.find({
      student: req.user._id,
      session: { $in: sessionIds },
    })

    const recordsBySession = {}
    for (const r of records) {
      const sid = r.session.toString()
      if (!recordsBySession[sid]) recordsBySession[sid] = []
      recordsBySession[sid].push(r)
    }

    // Build chronological past lecture items
    const history = sessions.map(s => {
      const sid = s._id.toString()
      const sessionRecs = recordsBySession[sid] || []
      const initial = sessionRecs.find(r => r.checkpointNumber === 0)
      const hasFlag = sessionRecs.some(r => r.flagged)

      let status = 'absent'
      if (initial) {
        status = hasFlag ? 'flagged' : 'present'
      }

      return {
        _id: s._id,
        date: s.startTime,
        subject: s.subject || s.course,
        section: s.section || 'All',
        facultyName: s.faculty?.name || 'Faculty',
        status,
        distanceInMeters: initial?.distanceInMeters ?? null,
        timestamp: initial?.timestamp || null,
      }
    })

    // Calculate overall statistics
    const totalLectures = sessions.filter(s => s.status === 'ended' || recordsBySession[s._id.toString()]?.length > 0).length
    const attendedLectures = history.filter(h => h.status === 'present').length
    const overallPercentage = totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 100

    // Calculate per-subject breakdown
    const subjectsMap = {}
    for (const s of sessions) {
      const sub = s.subject || s.course || 'Unknown'
      if (!subjectsMap[sub]) {
        subjectsMap[sub] = { subject: sub, total: 0, attended: 0, flagged: 0 }
      }
      const isCountable = s.status === 'ended' || recordsBySession[s._id.toString()]?.length > 0
      if (isCountable) {
        subjectsMap[sub].total += 1
        const recs = recordsBySession[s._id.toString()] || []
        const hasInitial = recs.some(r => r.checkpointNumber === 0)
        const isFlagged = recs.some(r => r.flagged)
        if (hasInitial && !isFlagged) {
          subjectsMap[sub].attended += 1
        } else if (isFlagged) {
          subjectsMap[sub].flagged += 1
        }
      }
    }

    const perSubject = Object.values(subjectsMap).map(sub => ({
      ...sub,
      percentage: sub.total > 0 ? Math.round((sub.attended / sub.total) * 100) : 100,
    }))

    res.json({
      success: true,
      data: {
        overall: {
          totalLectures,
          attendedLectures,
          percentage: overallPercentage,
          lowAttendance: overallPercentage < 75,
        },
        perSubject,
        history,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/stats/me
// @desc    Student attendance summary
router.get('/stats/me', protect, guard('student', 'cr'), async (req, res) => {
  try {
    const sessions = await Session.find({ batch: req.user.batch, status: 'ended' })
    const sessionIds = sessions.map(s => s._id)

    const records = await AttendanceRecord.find({
      student: req.user._id,
      session: { $in: sessionIds },
    })

    const initialBySession = {}
    const missedBySession = {}
    for (const rec of records) {
      const sid = rec.session.toString()
      if (rec.checkpointNumber === 0) initialBySession[sid] = rec
      if (rec.flagged) {
        missedBySession[sid] = (missedBySession[sid] || 0) + 1
      }
    }

    const total = sessions.length
    const attended = Object.keys(initialBySession).length
    const flaggedSessions = Object.entries(missedBySession).filter(([sid]) => initialBySession[sid]).length
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 100

    res.json({
      success: true,
      data: {
        totalSessions: total,
        attended,
        flaggedSessions,
        percentage,
        lowAttendance: percentage < 75,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/stats/batch/:batch
// @desc    CR / Admin batch attendance report
router.get('/stats/batch/:batch', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { batch } = req.params
    if (req.user.role === 'cr' && req.user.batch !== batch) {
      return res.status(403).json({ success: false, error: 'You can only view your own batch' })
    }

    const sessions = await Session.find({ batch, status: 'ended' })
    const sessionIds = sessions.map(s => s._id)
    const totalSessions = sessions.length

    const students = await User.find({ batch, role: { $in: ['student', 'cr'] } })
      .select('name rollNumber section')

    const records = await AttendanceRecord.find({ session: { $in: sessionIds } })

    const stats = students.map((student) => {
      const sid = student._id.toString()
      const studentRecords = records.filter(r => r.student.toString() === sid)
      const attended = studentRecords.filter(r => r.checkpointNumber === 0 && !r.flagged).length
      const flagged = studentRecords.filter(r => r.flagged).length
      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100
      return {
        student,
        attended,
        totalSessions,
        flagged,
        percentage,
        lowAttendance: percentage < 75,
      }
    })

    stats.sort((a, b) => a.percentage - b.percentage)
    res.json({ success: true, data: stats })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   GET /api/attendance/sessions
// @desc    List sessions
router.get('/sessions', protect, async (req, res) => {
  try {
    const filter = {}
    if (req.user.role === 'faculty') {
      filter.faculty = req.user._id
    } else if (req.user.role === 'cr' || req.user.role === 'student') {
      filter.batch = req.user.batch
    }

    const sessions = await Session.find(filter)
      .populate('room', 'name')
      .populate('faculty', 'name email')
      .sort({ startTime: -1 })
      .limit(50)

    res.json({ success: true, data: sessions })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
