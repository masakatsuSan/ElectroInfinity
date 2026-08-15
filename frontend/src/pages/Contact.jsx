import { useState } from 'react'
import api from '../api/axios'
import SEO from '../components/SEO'

export default function Contact() {
  const [form, setForm]     = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState(null) // 'sending' | 'success' | 'error'
  const [errMsg, setErrMsg] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setErrMsg('')

    try {
      await api.post('/contact', form)
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrMsg(err.response?.data?.error || 'Something went wrong. Try again.')
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO title="Contact | Electro Infinity" description="Get in touch with Electro Infinity — reach us by email, phone, or visit us at AGEMC." />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Inquiries & Collaborations
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Contact the Department
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Reach out to faculty mentors, club executives, or student coordinators for lab access, workshop collaborations, or academic queries.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-12 gap-12 items-start">

          {/* Left: Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="border border-hairline bg-soft-stone rounded-2xl p-8 space-y-6">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate block mb-1">
                  Campus Address
                </span>
                <p className="font-sans text-[15px] text-ink font-medium leading-relaxed">
                  Alipurduar Government Engineering & Management College,<br />
                  Alipurduar, West Bengal, India
                </p>
              </div>

              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate block mb-1">
                  Department Email
                </span>
                <a
                  href="mailto:electroinfinity@agemc.edu"
                  className="font-sans text-[15px] text-action-blue font-semibold hover:underline"
                >
                  electroinfinity@agemc.edu
                </a>
              </div>

              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate block mb-1">
                  Official College Website
                </span>
                <a
                  href="https://agemc.ac.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans text-[15px] text-ink font-medium hover:text-action-blue"
                >
                  agemc.ac.in ↗
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="aspect-video overflow-hidden rounded-2xl border border-hairline shadow-card">
              <iframe
                title="AGEMC location"
                loading="lazy"
                className="w-full h-full border-0"
                src="https://www.google.com/maps?q=Alipurduar+Government+Engineering+and+Management+College&output=embed"
              />
            </div>
          </div>

          {/* Right: Form Card */}
          <div className="lg:col-span-7 border border-hairline bg-canvas rounded-2xl p-8 md:p-10 shadow-card">
            <h2 className="font-display text-[24px] font-bold text-ink mb-2">Send a Message</h2>
            <p className="font-sans text-[14px] text-body-muted mb-8">
              We respond to inquiries and collaboration proposals within 2 business days.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Your Full Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Rahul Sharma"
                  className="input"
                />
              </div>

              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="yourname@gmail.com"
                  className="input"
                />
              </div>

              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Message Details
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={set('message')}
                  placeholder="How can we assist you?"
                  className="input resize-none"
                />
              </div>

              {status === 'success' && (
                <p className="text-[13px] text-deep-green font-semibold bg-pale-green border border-green-200 rounded-xl px-4 py-3 text-center">
                  ✓ Message sent successfully! We will get back to you soon.
                </p>
              )}
              {status === 'error' && (
                <p className="text-[13px] text-error font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  {errMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="button-primary w-full py-3.5 mt-2"
              >
                {status === 'sending' ? 'Sending Message…' : 'Submit Message →'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
