const User = require('../models/User')

const updateLastActive = async (req, res, next) => {
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() })
    }
    next()
  } catch (err) {
    next()
  }
}

module.exports = { updateLastActive }
