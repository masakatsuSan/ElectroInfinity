const express = require('express')
const router = express.Router()
const { protect, guard } = require('../middleware/auth')
const { uploadSingle } = require('../utils/upload')
const ctrl = require('../controllers/adminPlacements')

/* ─── Admin CRUD for each section ────────────────────────────────────── */

// Stats
router.get('/stats', protect, guard('admin', 'super_admin'), ctrl.listStats)
router.get('/stats/:id', protect, guard('admin', 'super_admin'), ctrl.getStat)
router.post('/stats', protect, guard('admin', 'super_admin'), ctrl.createStat)
router.put('/stats/reorder', protect, guard('admin', 'super_admin'), ctrl.reorderStats)
router.put('/stats/:id', protect, guard('admin', 'super_admin'), ctrl.updateStat)
router.delete('/stats/:id', protect, guard('admin', 'super_admin'), ctrl.deleteStat)

// Recruiters
router.get('/recruiters', protect, guard('admin', 'super_admin'), ctrl.listRecruiters)
router.get('/recruiters/:id', protect, guard('admin', 'super_admin'), ctrl.getRecruiter)
router.post('/recruiters', protect, guard('admin', 'super_admin'), uploadSingle('logo'), ctrl.createRecruiter)
router.put('/recruiters/reorder', protect, guard('admin', 'super_admin'), ctrl.reorderRecruiters)
router.put('/recruiters/:id', protect, guard('admin', 'super_admin'), uploadSingle('logo'), ctrl.updateRecruiter)
router.delete('/recruiters/:id', protect, guard('admin', 'super_admin'), ctrl.deleteRecruiter)

// Placed Students
router.get('/placed-students', protect, guard('admin', 'super_admin'), ctrl.listPlacedStudents)
router.get('/placed-students/:id', protect, guard('admin', 'super_admin'), ctrl.getPlacedStudent)
router.post('/placed-students', protect, guard('admin', 'super_admin'), uploadSingle('photo'), ctrl.createPlacedStudent)
router.put('/placed-students/:id', protect, guard('admin', 'super_admin'), uploadSingle('photo'), ctrl.updatePlacedStudent)
router.delete('/placed-students/:id', protect, guard('admin', 'super_admin'), ctrl.deletePlacedStudent)

// Alumni Stories
router.get('/alumni', protect, guard('admin', 'super_admin'), ctrl.listAlumniStories)
router.get('/alumni/:id', protect, guard('admin', 'super_admin'), ctrl.getAlumniStory)
router.post('/alumni', protect, guard('admin', 'super_admin'), uploadSingle('photo'), ctrl.createAlumniStory)
router.put('/alumni/reorder', protect, guard('admin', 'super_admin'), ctrl.reorderAlumniStories)
router.put('/alumni/:id', protect, guard('admin', 'super_admin'), uploadSingle('photo'), ctrl.updateAlumniStory)
router.delete('/alumni/:id', protect, guard('admin', 'super_admin'), ctrl.deleteAlumniStory)

// Career Openings
router.get('/openings', protect, guard('admin', 'super_admin'), ctrl.listOpenings)
router.get('/openings/:id', protect, guard('admin', 'super_admin'), ctrl.getOpening)
router.post('/openings', protect, guard('admin', 'super_admin'), ctrl.createOpening)
router.put('/openings/:id', protect, guard('admin', 'super_admin'), ctrl.updateOpening)
router.delete('/openings/:id', protect, guard('admin', 'super_admin'), ctrl.deleteOpening)

// Toggle publish (generic)
router.put('/:section/:id/publish', protect, guard('admin', 'super_admin'), ctrl.togglePublish)

module.exports = router
