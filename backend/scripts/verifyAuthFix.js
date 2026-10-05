// Live verification of the login-loop fixes against a running server.
// Run with: node scripts/verifyAuthFix.js [baseUrl]
require('dotenv').config()
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../src/models/User')

const BASE = process.argv[2] || 'http://localhost:5001'

async function main() {
  // ── 1. CSRF exemption: a cookieless login POST must reach the login
  //    handler (401 bad credentials), not be blocked with 403 CSRF.
  const noCsrf = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rollNumber: 'NONEXISTENT', password: 'wrongpassword123' }),
  })
  const noCsrfBody = await noCsrf.json()
  console.log(`1. cookieless login -> ${noCsrf.status} ${JSON.stringify(noCsrfBody)}`)
  console.log(`   PASS (not 403 CSRF): ${noCsrf.status !== 403}`)

  // ── 2. tokenVersion: an access token minted exactly like login does
  //    must authenticate against a pre-existing user document.
  await mongoose.connect(process.env.MONGO_URI)
  const user = await User.findOne({}).select('name role tokenVersion isVerified isActive')
  if (!user) {
    console.log('2. SKIPPED - no user in database')
    await mongoose.disconnect()
    return
  }
  console.log(`2. user ${user._id} role=${user.role} tokenVersion=${user.tokenVersion}`)

  const mint = (tv) => jwt.sign(
    { id: user._id.toString(), tv },
    process.env.JWT_SECRET,
    { expiresIn: '15m', algorithm: 'HS256', issuer: 'college-connect' }
  )

  const me = await fetch(`${BASE}/api/auth/me`, {
    headers: { cookie: `access_token=${mint(user.tokenVersion || 0)}` },
  })
  const meBody = await me.json()
  console.log(`   GET /auth/me with tv=${user.tokenVersion || 0} -> ${me.status} success=${meBody.success}`)
  console.log(`   PASS (200 = loop fixed): ${me.status === 200}`)

  // ── 3. Security property intact: a bumped tokenVersion is still rejected.
  const stale = await fetch(`${BASE}/api/auth/me`, {
    headers: { cookie: `access_token=${mint((user.tokenVersion || 0) + 1)}` },
  })
  console.log(`   GET /auth/me with stale tv -> ${stale.status}`)
  console.log(`   PASS (401 = invalidation intact): ${stale.status === 401}`)

  // ── 4. A mutation without the CSRF header must still be blocked.
  const noCsrfMut = await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie: `access_token=${mint(user.tokenVersion || 0)}` },
  })
  console.log(`4. POST /auth/logout without CSRF header -> ${noCsrfMut.status}`)
  console.log(`   PASS (403 = CSRF still enforced): ${noCsrfMut.status === 403}`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('SCRIPT_ERROR', err.message)
  process.exit(1)
})
