require('dotenv').config()
const mongoose = require('mongoose')
const Achievement = require('./src/models/Achievement')

const MAP = {
  academic: 'student',
  sports: 'student',
  cultural: 'awards',
  other: 'faculty',
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connected')

  for (const [from, to] of Object.entries(MAP)) {
    const res = await Achievement.updateMany({ category: from }, { $set: { category: to } })
    console.log(`category "${from}" -> "${to}": ${res.modifiedCount} updated`)
  }

  // Catch-all: any doc still holding an unknown/legacy category becomes "student"
  const res = await Achievement.updateMany(
    { category: { $nin: ['student', 'faculty', 'awards'] } },
    { $set: { category: 'student' } }
  )
  console.log(`catch-all -> "student": ${res.modifiedCount} updated`)

  await mongoose.disconnect()
  console.log('Done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
