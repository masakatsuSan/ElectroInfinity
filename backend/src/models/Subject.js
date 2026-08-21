const mongoose = require('mongoose')
const subjectSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  code: {type: String, required: true, trim: true, uppercase: true},
  batch: {type: String, default: ''},
  section: {type: String, default: ''},
  semester: {type: Number, default: 1},
  credits: {type: Number, default: 0, min: 0},
  status: {type: String, enum: ['pending','approved','rejected'], default: 'pending'},
  updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
  modules: [{title: {type: String, required: true, trim: true}, topics: [{type: String, trim: true}]}],
  syllabus: {type: String, trim: true, default: ''},
  referenceBooks: [{type: String, trim: true}],
  objectives: [{type: String, trim: true}],
  l: {type: Number, default: 0},
  t: {type: Number, default: 0},
  p: {type: Number, default: 0}
}, {timestamps: true})
subjectSchema.index({code: 1, batch: 1, section: 1}, {unique: true})
module.exports = mongoose.model('Subject', subjectSchema)
