const express = require('express')
const router = express.Router()
const Routine = require('../models/Routine')
const { protect, guard } = require('../middleware/auth')
const { protect, guard } = require('../middleware/auth')
// const { requireAuth, requireRole } = require('../middleware/auth')
// const { guard } = require('../middleware/guard')

// GET /api/routines?batch=2024-2028
router.get('/', protect, async (req, res) => {  try {
    const { batch } = req.query
    if (!batch) return res.status(400).json({ error: 'Batch is required' })
    
    const routine = await Routine.findOne({ batch })
    res.json({ data: routine ? routine.schedule : [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/routines/:batch
// Upserts the schedule for a batch. Only CR of that batch or admins can do this.
router.put('/:batch', protect, guard('admin', 'super_admin', 'cr'), async (req, res) => {  try {
    const { batch } = req.params
    const { schedule } = req.body
    
    // The guard middleware ensures CRs can only mutate their own batch.
    
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Schedule must be an array' })
    }

    const routine = await Routine.findOneAndUpdate(
      { batch },
      { batch, schedule },
      { new: true, upsert: true }
    )
    
    res.json({ data: routine })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
