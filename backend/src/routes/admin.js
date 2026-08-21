const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const CommunityRoom = require('../models/CommunityRoom');
const ForumPost = require('../models/ForumPost');
const Project = require('../models/Project');
const AcademicCalendar = require('../models/AcademicCalendar');
const { protect, guard } = require('../middleware/auth');

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (cr, admin, super_admin)
router.get('/stats', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalRooms,
      totalEvents,
      totalResources,
      totalAnnouncements,
      totalProjects,
      activeSessions
    ] = await Promise.all([
      require('../models/User').countDocuments({ isActive: true }),
      ForumPost.countDocuments(),
      CommunityRoom.countDocuments({ isActive: true }),
      require('../models/Event').countDocuments(),
      require('../models/Resource').countDocuments(),
      Announcement.countDocuments(),
      Project.countDocuments({ isApproved: true }),
      require('../models/Session').countDocuments({ status: 'active' })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalRooms,
        totalEvents,
        totalResources,
        totalAnnouncements,
        totalProjects,
        activeSessions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
