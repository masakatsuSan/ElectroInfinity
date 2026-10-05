// Structured logging (pino). Never log passwords, tokens, OTPs or full PII.
const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: ['password', 'token', 'authorization', 'otp', 'otpHash', 'refreshToken', 'accessToken'],
    censor: '[REDACTED]',
  },
})

module.exports = logger
