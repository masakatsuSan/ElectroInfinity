const mongoose = require('mongoose')

// Connect to MongoDB Atlas
// mongoose.connect() returns a promise, so we use async/await
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connection established')
  } catch (error) {
    console.error('MongoDB connection failed')
    // Exit the process — no point running the server without a DB
    process.exit(1)
  }
}

module.exports = connectDB
