const express = require('express')
const nodemailer = require('nodemailer')

const router = express.Router()

// ── POST /api/contact ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' })
    }

    // Create a Gmail transporter
    // Make sure you've set EMAIL_USER and EMAIL_PASS in .env
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,  // This must be a Gmail App Password, not your login password
      },
    })

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: email,
      subject: `Electro Infinity website enquiry from ${name}`,
      html: `
        <h2>New message from Electro Infinity website</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    res.json({ success: true, message: 'Message sent successfully!' })
  } catch (err) {
    console.error('Email error:', err.message)
    res.status(500).json({ success: false, error: 'Could not send message. Try again later.' })
  }
})

module.exports = router
