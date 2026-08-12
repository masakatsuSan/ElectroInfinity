const mongoose = require('mongoose')

const placementSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['stat', 'recruiter', 'internship', 'alumni'], required: true },
    
    // For Stat
    statValue: { type: String, trim: true },
    statLabel: { type: String, trim: true },
    
    // For Recruiter
    companyName: { type: String, trim: true },
    roleOffered: { type: String, trim: true },
    studentsPlaced: { type: Number },
    
    // For Internship
    internshipTitle: { type: String, trim: true },
    internshipCompany: { type: String, trim: true },
    stipend: { type: String, trim: true },
    deadline: { type: Date },
    
    // For Alumni
    alumniName: { type: String, trim: true },
    alumniRole: { type: String, trim: true },
    alumniDesc: { type: String, trim: true },
    alumniBatch: { type: String, trim: true },
    alumniInitials: { type: String, trim: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Placement', placementSchema)
