// Refresh tokens: stored hashed, single-use, rotated on every use.
// Reuse of an already-replaced token revokes the entire family (theft detection).
const mongoose = require('mongoose')

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    replacedBy: { type: String, default: null },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
)

// MongoDB TTL index — expired tokens are removed automatically.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)
