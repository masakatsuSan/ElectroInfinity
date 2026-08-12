const express = require('express')
const brevo = require('@getbrevo/brevo')

const router = express.Router()

// ── POST /api/contact ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' })
    }

    const apiInstance = new brevo.TransactionalEmailsApi()

    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    )

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.subject = `Electro Infinity website enquiry from ${name}`
    sendSmtpEmail.htmlContent = `
      <h2>New message from Electro Infinity website</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
    `
    sendSmtpEmail.sender = { name, email }
    sendSmtpEmail.to = [{ email: process.env.EMAIL_TO || process.env.EMAIL_USER }]

    await apiInstance.sendTransacEmail(sendSmtpEmail)

    res.json({ success: true, message: 'Message sent successfully!' })
  } catch (err) {
    console.error('Email error:', err.message)
    res.status(500).json({ success: false, error: 'Could not send message. Try again later.' })
  }
})

module.exports = router
