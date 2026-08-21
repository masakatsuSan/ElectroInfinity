const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },

    // Gmail â€” collected from batch group, used for OTP reset
    email:      { type: String, default: '', trim: true, lowercase: true, unique: true },

    rollNumber: { type: String, default: '', trim: true, uppercase: true },
    regNumber:  { type: String, default: '' },
    batch:      { type: String, default: '' },
    section:    { type: String, default: '' }, // New for CR scope
    semester:   { type: Number, default: 1 },

    // Optional until student activates their account
    password:   { type: String, default: '', select: false },

    role: {
      type:    String,
      enum:    ['student', 'cr', 'admin', 'super_admin', 'faculty'],
      default: 'student',
    },

    // Faculty-only: batches/courses/subjects they may run attendance for
    assignedBatches:      { type: [String], default: [] },
    assignedCourses:      { type: [String], default: [] },
    teachingAssignments:  [
      {
        batch:   { type: String, default: '' },
        section: { type: String, default: '' },
        subject: { type: String, default: '' },
      }
    ],
    isActive:             { type: Boolean, default: true },

    photo: { type: String, default: '' },
    
    // Nested profile object (Spec v2)
    profile: {
      skills:          [String],
      resumeUrl:       { type: String, default: '' },
      linkedIn:        { type: String, default: '' },
      github:          { type: String, default: '' },
      bio:             { type: String, default: '' },
      internships:     [{ company: String, role: String, duration: String }],
      placementStatus: { type: String, default: '' }
    },
    
    eligibleStudentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'EligibleStudent' },

    // false = admin added, student hasn't set a password yet
    // true  = student activated, can log in
    isVerified: { type: Boolean, default: false },

    // Legacy alias kept for compatibility with older student-management UI/screens
    isActivated: { type: Boolean, default: false },

    // OTP for forgot-password flow
    // Stored as plain string â€” expires in 10 minutes, deleted after use
    otp:       { type: String,  default: '' },
    otpExpiry: { type: Date,    default: null },
  },
  { timestamps: true }
)

// Hash password only when it's actually changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (typed) {
  return bcrypt.compare(typed, this.password)
}

module.exports = mongoose.model('User', userSchema)
