const mongoose = require('mongoose')
const User = require('../src/models/User')
require('dotenv').config()

const updateAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const admin = await User.findOne({ role: 'admin' }).select('+password')
    if (!admin) {
      console.error('Admin user not found')
      process.exit(1)
    }

    const newPassword = 'Hardcoder69'

    if (newPassword.length < 6) {
      console.error('Password must be at least 6 characters')
      process.exit(1)
    }

    admin.password = newPassword
    await admin.save()

    console.log('Admin password updated successfully!')
    console.log(`Admin email: ${admin.email}`)
    console.log(`New password: ${newPassword}`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Error updating admin password:', error)
    process.exit(1)
  }
}

updateAdminPassword()