require('dotenv').config()
const mongoose = require('mongoose')
const Subject = require('../src/models/Subject')

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Find documents corrupted by { '': s } — the subject fields are nested
  // under an empty-string key instead of at the top level.
  const corrupted = await Subject.find({ '': { $exists: true } }).lean()
  console.log(`Found ${corrupted.length} corrupted subject documents`)

  if (corrupted.length === 0) {
    console.log('No corrupted documents to fix')
    await mongoose.disconnect()
    console.log('Done')
    return
  }

  const ops = corrupted.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: doc[''],
        $unset: { '': '' },
      },
    },
  }))

  const result = await Subject.bulkWrite(ops, { ordered: false })
  console.log(`Fixed ${result.modifiedCount} corrupted subject documents`)
  console.log('Moved nested fields to top level and removed the empty-string key')

  await mongoose.disconnect()
  console.log('Done')
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
