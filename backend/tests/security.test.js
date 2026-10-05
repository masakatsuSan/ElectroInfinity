const test = require('node:test')
const assert = require('node:assert/strict')

// ── Token helpers ─────────────────────────────────────────────
const tokens = require('../src/utils/tokens')

test('access token round-trip carries id and tokenVersion', () => {
  const original = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long!!'
  try {
    const token = tokens.signAccessToken('user-123', 7)
    const decoded = tokens.verifyAccessToken(token)
    assert.equal(decoded.id, 'user-123')
    assert.equal(decoded.tv, 7)
    assert.equal(decoded.iss, tokens.ISSUER)
  } finally {
    process.env.JWT_SECRET = original
  }
})

test('access token signed with the wrong secret is rejected', () => {
  const original = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'signing-secret-that-is-at-least-32-characters-long'
  try {
    const token = tokens.signAccessToken('user-123', 1)
    process.env.JWT_SECRET = 'a-different-secret-that-is-at-least-32-characters'
    assert.throws(() => tokens.verifyAccessToken(token))
  } finally {
    process.env.JWT_SECRET = original
  }
})

test('token without the expected issuer is rejected', () => {
  const jwt = require('jsonwebtoken')
  const original = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long!!'
  try {
    // Signed correctly but by a different issuer.
    const foreign = jwt.sign({ id: 'user-123' }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'someone-else',
    })
    assert.throws(() => tokens.verifyAccessToken(foreign))
  } finally {
    process.env.JWT_SECRET = original
  }
})

test('refresh tokens are long, random and hashed deterministically', () => {
  const a = tokens.generateRefreshToken()
  const b = tokens.generateRefreshToken()
  assert.equal(a.length, 96) // 48 bytes hex
  assert.notEqual(a, b)
  assert.equal(tokens.hashToken(a), tokens.hashToken(a))
  assert.notEqual(tokens.hashToken(a), tokens.hashToken(b))
})

// ── Env validation ────────────────────────────────────────────
const { validateEnv } = require('../src/config/env')

test('validateEnv exits on missing MONGO_URI', () => {
  const saved = { ...process.env }
  const originalExit = process.exit
  let exitCode = null
  process.exit = (code) => { exitCode = code }
  try {
    delete process.env.MONGO_URI
    delete process.env.JWT_SECRET
    validateEnv()
    assert.equal(exitCode, 1)
  } finally {
    process.exit = originalExit
    Object.assign(process.env, saved)
  }
})

test('validateEnv exits on a short JWT_SECRET', () => {
  const saved = { ...process.env }
  const originalExit = process.exit
  let exitCode = null
  process.exit = (code) => { exitCode = code }
  try {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test'
    process.env.JWT_SECRET = 'short'
    validateEnv()
    assert.equal(exitCode, 1)
  } finally {
    process.exit = originalExit
    Object.assign(process.env, saved)
  }
})

test('validateEnv exits on the placeholder JWT_SECRET', () => {
  const saved = { ...process.env }
  const originalExit = process.exit
  let exitCode = null
  process.exit = (code) => { exitCode = code }
  try {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test'
    process.env.JWT_SECRET = 'your-very-long-random-jwt-secret-here'
    validateEnv()
    assert.equal(exitCode, 1)
  } finally {
    process.exit = originalExit
    Object.assign(process.env, saved)
  }
})

test('validateEnv exits on a non-mongodb MONGO_URI', () => {
  const saved = { ...process.env }
  const originalExit = process.exit
  let exitCode = null
  process.exit = (code) => { exitCode = code }
  try {
    process.env.MONGO_URI = 'postgres://example.com/db'
    process.env.JWT_SECRET = 'a-long-enough-secret-for-testing-purposes-here'
    validateEnv()
    assert.equal(exitCode, 1)
  } finally {
    process.exit = originalExit
    Object.assign(process.env, saved)
  }
})

// ── CSRF middleware ───────────────────────────────────────────
const { csrfProtection } = require('../src/middleware/csrf')

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
  return res
}

test('CSRF: safe methods pass without a token', () => {
  let called = false
  csrfProtection({ method: 'GET', headers: {}, cookies: {} }, mockRes(), () => { called = true })
  assert.equal(called, true)
})

test('CSRF: Bearer-authenticated requests are exempt', () => {
  let called = false
  const req = {
    method: 'POST',
    headers: { authorization: 'Bearer some-token' },
    cookies: {},
  }
  csrfProtection(req, mockRes(), () => { called = true })
  assert.equal(called, true)
})

test('CSRF: POST without a header is rejected with 403', () => {
  const res = mockRes()
  csrfProtection(
    { method: 'POST', headers: {}, cookies: { csrf_token: 'abc' } },
    res,
    () => { throw new Error('next should not be called') }
  )
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.success, false)
})

test('CSRF: POST with a mismatched header is rejected with 403', () => {
  const res = mockRes()
  csrfProtection(
    { method: 'POST', headers: { 'x-csrf-token': 'wrong' }, cookies: { csrf_token: 'abc' } },
    res,
    () => { throw new Error('next should not be called') }
  )
  assert.equal(res.statusCode, 403)
})

test('CSRF: POST with a matching double-submit token passes', () => {
  let called = false
  csrfProtection(
    { method: 'POST', headers: { 'x-csrf-token': 'abc' }, cookies: { csrf_token: 'abc' } },
    mockRes(),
    () => { called = true }
  )
  assert.equal(called, true)
})

// ── Auth middleware ───────────────────────────────────────────
const { extractToken, guard } = require('../src/middleware/auth')

test('extractToken reads the Bearer header first', () => {
  const token = extractToken({
    headers: { authorization: 'Bearer header-token' },
    cookies: { access_token: 'cookie-token' },
  })
  assert.equal(token, 'header-token')
})

test('extractToken falls back to the access_token cookie', () => {
  const token = extractToken({ headers: {}, cookies: { access_token: 'cookie-token' } })
  assert.equal(token, 'cookie-token')
})

test('extractToken returns null when nothing is present', () => {
  assert.equal(extractToken({ headers: {}, cookies: {} }), null)
})

test('guard rejects an unauthenticated request with 401', () => {
  const res = mockRes()
  guard('admin')({ user: undefined }, res, () => { throw new Error('next should not be called') })
  assert.equal(res.statusCode, 401)
})

test('guard rejects a disallowed role with 403', () => {
  const res = mockRes()
  guard('admin', 'super_admin')({ user: { role: 'student' } }, res, () => { throw new Error('next should not be called') })
  assert.equal(res.statusCode, 403)
})

test('guard allows a listed role', () => {
  let called = false
  guard('admin', 'super_admin')({ user: { role: 'admin' } }, mockRes(), () => { called = true })
  assert.equal(called, true)
})

// ── Upload magic-byte validation ──────────────────────────────
const { validateFileBuffer } = require('../src/utils/upload')

test('validateFileBuffer accepts a real PNG', async () => {
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]),
  ])
  const detected = await validateFileBuffer(png)
  assert.equal(detected.mime, 'image/png')
})

test('validateFileBuffer accepts a real PDF', async () => {
  const pdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n')
  const detected = await validateFileBuffer(pdf)
  assert.equal(detected.mime, 'application/pdf')
})

test('validateFileBuffer rejects HTML with a forged image Content-Type', async () => {
  const html = Buffer.from('<html><body><script>alert(1)</script></body></html>')
  await assert.rejects(() => validateFileBuffer(html), /File type not allowed/)
})

test('validateFileBuffer rejects a GIF (not on the allowlist)', async () => {
  const gif = Buffer.from('GIF89a' + 'x'.repeat(20))
  await assert.rejects(() => validateFileBuffer(gif), /File type not allowed/)
})

test('validateFileBuffer rejects an unknown binary type', async () => {
  const exe = Buffer.from('MZ' + 'x'.repeat(64))
  await assert.rejects(() => validateFileBuffer(exe), /File type not allowed/)
})

// ── Rate limiters are wired ───────────────────────────────────
const rateLimit = require('../src/middleware/rateLimit')

test('rate limiters are express middleware functions', () => {
  for (const name of [
    'globalLimiter', 'authLimiter', 'authSlowDown', 'otpLimiter',
    'writeLimiter', 'uploadLimiter', 'scanLimiter', 'contactLimiter',
    'downloadLimiter',
  ]) {
    assert.equal(typeof rateLimit[name], 'function', `${name} should be a function`)
  }
})
