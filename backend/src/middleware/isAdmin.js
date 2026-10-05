const { guard } = require('./auth')

const isAdmin = guard('admin', 'super_admin')

module.exports = { isAdmin }
