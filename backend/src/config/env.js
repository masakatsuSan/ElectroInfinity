// Fail fast on missing/invalid configuration — the server must never boot
// with placeholder secrets or no database URI.
function validateEnv() {
  const errors = []

  const required = ['MONGO_URI', 'JWT_SECRET']
  for (const key of required) {
    if (!process.env[key]) errors.push(`${key} is required`)
  }

  const secret = process.env.JWT_SECRET || ''
  if (secret && secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters')
  }
  const placeholders = ['your-very-long-random-jwt-secret-here', 'changeme', 'secret']
  if (placeholders.includes(secret.toLowerCase().trim())) {
    errors.push('JWT_SECRET is still the placeholder value — generate a real random secret')
  }

  if (process.env.MONGO_URI && !/^mongodb(\+srv)?:\/\//.test(process.env.MONGO_URI)) {
    errors.push('MONGO_URI must be a mongodb:// or mongodb+srv:// connection string')
  }

  if (errors.length) {
    console.error('❌ Invalid configuration:')
    for (const e of errors) console.error(`   - ${e}`)
    console.error('   See backend/.env.example for the required variables.')
    process.exit(1)
  }
}

module.exports = { validateEnv }
