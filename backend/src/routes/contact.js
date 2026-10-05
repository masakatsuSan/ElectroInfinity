const express = require('express')
const axios = require('axios')
const Contact = require('../models/Contact')
const { protect, guard } = require('../middleware/auth')
const { contactLimiter } = require('../middleware/rateLimit')
const logger = require('../utils/logger')

const router = express.Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// -- POST /api/contact -----------------------------------------------
// Public contact form — stores the message AND emails the department.
// Rate limited (5/hour/IP) and length-capped so it cannot be used
// as a spam relay or to stuff oversized payloads into the DB.
router.post('/', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required' })
  }
  if (typeof name !== 'string' || name.trim().length > 100) {
    return res.status(400).json({ success: false, error: 'Name must be 100 characters or fewer' })
  }
  if (typeof email !== 'string' || email.length > 200 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, error: 'A valid email address is required' })
  }
  if (subject !== undefined && (typeof subject !== 'string' || subject.length > 200)) {
    return res.status(400).json({ success: false, error: 'Subject must be 200 characters or fewer' })
  }
  if (typeof message !== 'string' || message.trim().length === 0 || message.length > 5000) {
    return res.status(400).json({ success: false, error: 'Message must be between 1 and 5000 characters' })
  }

  // Persist the submission so admins can manage it from the inbox
  let stored
  try {
    stored = await Contact.create({ name: name.trim(), email: email.trim(), subject: (subject || '').trim(), message })
  } catch (dbErr) {
    logger.error({ event: 'contact_store_failed', err: dbErr.message })
    // If the DB is unavailable we still try to send the email so the
    // user's message is not lost.
  }

  // -- Email the department via Brevo --------------------------------
  if (!process.env.BREVO_API_KEY) {
    logger.warn('BREVO_API_KEY missing — contact stored but email not sent')
    return res.json({ success: true, message: 'Message received. (Email delivery not configured on server.)', data: stored })
  }

  const htmlContent = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${String(name).replace(/</g, '&lt;')}</p>
    <p><strong>Email:</strong> ${String(email).replace(/</g, '&lt;')}</p>
    <p><strong>Subject:</strong> ${String(subject || 'No Subject').replace(/</g, '&lt;')}</p>
    <br/>
    <p><strong>Message:</strong></p>
    <p>${String(message).replace(/\n/g, '<br/>').replace(/</g, '&lt;')}</p>
  `

  const payload = {
    sender:  { name: 'College Connect Website', email: process.env.EMAIL_USER || 'noreply@collegeconnect.com' },
    to:      [{ email: process.env.EMAIL_USER || 'admin@electroinfinity.com' }],
    replyTo: { email: email, name: name },
    subject: `Contact Form: ${subject || 'New Message'}`,
    htmlContent,
  }

  try {
    const apiKey = process.env.BREVO_API_KEY.trim()
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      timeout: 15000,
    })
    logger.info({ event: 'contact_email_sent', messageId: response.data?.messageId })
    res.json({ success: true, message: 'Message sent successfully', data: stored })
  } catch (error) {
    logger.error({
      event: 'contact_email_failed',
      status: error.response?.status,
      message: error.response?.data?.message,
      code: error.response?.data?.code,
    })
    // Message was still stored, so report a softer failure
    res.status(502).json({ success: false, error: 'Message was recorded but email delivery failed. We will get back to you.' })
  }
})

// -- GET /api/contact ------------------------------------------------
// Admin inbox — list submissions with optional ?status=new|read|archived
router.get('/', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const { status } = req.query
    const filter = {}
    if (status) filter.status = status

    const contacts = await Contact.find(filter)
      .populate('readBy', 'name')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: contacts.length, data: contacts })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// -- GET /api/contact/:id --------------------------------------------
router.get('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate('readBy', 'name')
    if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' })
    res.json({ success: true, data: contact })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// -- PATCH /api/contact/:id ------------------------------------------
// Admin updates status / reply flag
router.patch('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const { status, isReplied } = req.body
    const contact = await Contact.findById(req.params.id)
    if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' })

    if (status)    contact.status = status
    if (isReplied !== undefined) contact.isReplied = isReplied
    if (status === 'read' && contact.readBy === null) contact.readBy = req.user._id
    if (status === 'archived') contact.readBy = contact.readBy || req.user._id

    await contact.save()
    res.json({ success: true, data: contact })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// -- DELETE /api/contact/:id -----------------------------------------
router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' })
    await contact.deleteOne()
    res.json({ success: true, message: 'Contact removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router