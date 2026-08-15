const express = require('express')
const axios = require('axios')

const router = express.Router()

// ── POST /api/contact ──────────────────────────────────────────────────────// POST /api/contact - Handle contact form submission
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required' })
  }
  
  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ success: false, error: 'BREVO_API_KEY is missing in server environment' })
  }

  // Create email HTML for admin
  const htmlContent = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
    <br/>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `

  const payload = {
    sender: { name: "Electro Infinity Website", email: process.env.EMAIL_USER || "noreply@electroinfinity.com" },
    to: [{ email: process.env.EMAIL_USER || "admin@electroinfinity.com" }],
    replyTo: { email: email, name: name },
    subject: `Contact Form: ${subject || 'New Message'}`,
    htmlContent: htmlContent
  }

  try {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    console.log('📧 Contact: Sending email via Brevo API (key prefix:', apiKey?.substring(0, 20), ')');
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      }
    });

    console.log('✅ Contact email sent. ID:', response.data?.messageId)
    res.json({ success: true, message: 'Message sent successfully' })
  } catch (error) {
    console.error('❌ Brevo API Error (Contact):');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message);
    console.error('   Code:', error.response?.data?.code);
    console.error('   Error Details:', error.response?.data);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again later.' })
  }
})

module.exports = router
