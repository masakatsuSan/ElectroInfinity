import { useState } from 'react'
import api from '../api/axios'

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', message: '' })
  const [status, setStatus]   = useState(null) // 'sending' | 'success' | 'error'
  const [errMsg, setErrMsg]   = useState('')

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
    <div className="container pt-32 pb-20 min-h-screen bg-canvas text-ink">
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        Get in Touch
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-12 text-ink">
        Contact
      </h1>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

        {/* Left — details */}
        <div>
          <div className="flex flex-col gap-8 text-[17px] text-ink-muted-80 mb-10">
            <div>
              <span className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 block mb-2">Address</span>
              <span className="leading-relaxed">Alipurduar Government Engineering and Management College,<br />
              Alipurduar, West Bengal, India</span>
            </div>
            <div>
              <span className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 block mb-2">Email</span>
              <a href="mailto:electroinfinity@agemc.edu" className="text-link font-medium hover:text-primary transition-colors">
                electroinfinity@agemc.edu
              </a>
            </div>
            <div>
              <span className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 block mb-2">Phone</span>
              <span className="font-medium">+91 00000 00000</span>
            </div>
          </div>

          {/* Map */}
          <div className="aspect-video overflow-hidden border border-divider-soft rounded-lg shadow-sm">
            <iframe
              title="AGEMC location"
              loading="lazy"
              className="w-full h-full border-0 grayscale opacity-80"
              src="https://www.google.com/maps?q=Alipurduar+Government+Engineering+and+Management+College&output=embed"
            />
          </div>
        </div>

        {/* Right — form */}
        <div className="bg-surface-pearl border border-divider-soft p-8 sm:p-10 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Name */}
            <div>
              <label className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 block mb-2">
                Name
              </label>
              <input
                required
                value={form.name}
                onChange={set('name')}
                placeholder="Your full name"
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-ink-muted-48 text-ink"
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="your@email.com"
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-ink-muted-48 text-ink"
              />
            </div>

            {/* Message */}
            <div>
              <label className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 block mb-2">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={set('message')}
                placeholder="How can we help?"
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder:text-ink-muted-48 text-ink"
              />
            </div>

            {/* Status messages */}
            {status === 'success' && (
              <p className="font-sans text-[14px] font-medium text-green-500">✓ Message sent! We'll get back to you soon.</p>
            )}
            {status === 'error' && (
              <p className="font-sans text-[14px] font-medium text-red-500">{errMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="button-primary mt-2 w-full sm:w-auto self-start"
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            <p className="font-sans text-[12px] font-medium uppercase tracking-widest text-ink-muted-48 mt-4 text-center sm:text-left">
              Powered by Nodemailer
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
