const mongoose = require('mongoose')

const routineSchema = new mongoose.Schema(
  {
    batch: { 
      type: String, 
      required: true,
      unique: true
    },
    schedule: [
      {
        time: { type: String, default: '' },
        mon: { type: String, default: '—' },
        tue: { type: String, default: '—' },
        wed: { type: String, default: '—' },
        thu: { type: String, default: '—' },
        fri: { type: String, default: '—' },
      }
    ]
  },
  { timestamps: true }
)

module.exports = mongoose.model('Routine', routineSchema)
