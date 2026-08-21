const express = require('express')
const axios = require('axios')
const Contact = require('../models/Contact')
const { protect, guard } = require('../middleware/auth')

const router = express.Router()

// ── POST /api/contact ───────────────────────────────────────────────
// Public contact form — stores the message AND emails the department.
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required' })
  }

  // Persist the submission so admins can manage it from the inbox
  let stored
  try {
    stored = await Contact.create({ name, email, subject, message })
  } catch (dbErr) {
    console.error('❌ Contact: DB store failed:', dbErr.message)
    // If the DB is unavailable we still try to send the email so the
    // user's message is not lost.
  }

  // ── Email the department via Brevo ────────────────────────────────
  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY missing — contact stored but email not sent')
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
    sender:  { name: 'Electro Infinity Website', email: process.env.EMAIL_USER || 'noreply@electroinfinity.com' },
    to:      [{ email: process.env.EMAIL_USER || 'admin@electroinfinity.com' }],
    replyTo: { email: email, name: name },
    subject: `Contact Form: ${subject || 'New Message'}`,
    htmlContent,
  }

  try {
    const apiKey = process.env.BREVO_API_KEY.trim()
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    })
    console.log('✅ Contact email sent. ID:', response.data?.messageId)
    res.json({ success: true, message: 'Message sent successfully', data: stored })
  } catch (error) {
    console.error('❌ Brevo API Error (Contact):')
    console.error('   Status:', error.response?.status)
    console.error('   Message:', error.response?.data?.message)
    console.error('   Code:', error.response?.data?.code)
    console.error('   Error Details:', error.response?.data)
    // Message was still stored, so report a softer failure
    res.status(502).json({ success: false, error: 'Message was recorded but email delivery failed. We will get back to you.' })
  }
})

// ── GET /api/contact ────────────────────────────────────────────────
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
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/contact/:id ────────────────────────────────────────────
router.get('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate('readBy', 'name')
    if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' })
    res.json({ success: true, data: contact })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/contact/:id ──────────────────────────────────────────
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
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/contact/:id ─────────────────────────────────────────
router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' })
    await contact.deleteOne()
    res.json({ success: true, message: 'Contact removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router