import { useState } from 'react'
import { Check } from 'lucide-react'
import api from '../api/axios'
import SEO from '../components/SEO'

export default function Contact() {
  const [form, setForm]     = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState(null)
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
    <div className="min-h-screen bg-white text-ink pt-24 md:pt-32">
      <SEO title="Contact | Electro Infinity" description="Get in touch with Electro Infinity — reach us by email, phone, or visit us at AGEMC." />

      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <section className="pb-24 md:pb-24">
          <div className="max-w-3xl">
            <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
              Inquiries & Collaborations
            </span>
            <h1 className="mb-5 font-display text-[40px] font-normal leading-[1.15] text-ink md:text-[56px]">
              Contact the Department
            </h1>
            <p className="max-w-2xl font-sans text-[17px] font-normal leading-[1.4] text-body">
              Reach out to faculty mentors, club executives, or student coordinators for lab access, workshop collaborations, or academic queries.
            </p>
          </div>
        </section>

        <section className="pb-24 md:pb-24">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-5">
              <div className="border border-hairline bg-surface-soft rounded-lg p-8 md:p-10">
                <div className="mb-8">
                  <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-muted">
                    Campus Address
                  </span>
                  <p className="font-sans text-[15px] font-normal leading-[1.45] text-ink">
                    Alipurduar Government Engineering & Management College,<br />
                    Alipurduar, West Bengal, India
                  </p>
                </div>

                <div className="mb-8">
                  <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-muted">
                    Department Email
                  </span>
                  <a
                    href="mailto:electroinfinity@agemc.edu"
                    className="font-sans text-[15px] font-medium text-link hover:no-underline"
                  >
                    electroinfinity@agemc.edu
                  </a>
                </div>

                <div>
                  <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-muted">
                    Official College Website
                  </span>
                  <a
                    href="https://agemc.ac.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans text-[15px] font-medium text-ink hover:text-link transition-colors"
                  >
                    agemc.ac.in ↗
                  </a>
                </div>
              </div>

              <div className="aspect-video overflow-hidden rounded-lg border border-hairline bg-surface-strong">
                <iframe
                  title="AGEMC location"
                  loading="lazy"
                  className="h-full w-full border-0"
                  src="https://www.google.com/maps?q=Alipurduar+Government+Engineering+and+Management+College&output=embed"
                />
              </div>
            </div>

            <div className="border border-hairline bg-white rounded-lg p-8 md:p-10 lg:col-span-7">
              <h2 className="mb-3 font-display text-[24px] font-normal leading-[1.35] text-ink">Send a Message</h2>
              <p className="mb-8 font-sans text-[14px] font-normal leading-[1.4] text-body">
                We respond to inquiries and collaboration proposals within 2 business days.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-muted">
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
                  <label className="mb-2 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-muted">
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
                  <label className="mb-2 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-muted">
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
                  <p className="flex items-center justify-center gap-2 rounded-md border border-signature-mint bg-signature-mint px-4 py-3 text-center font-sans text-[13px] font-medium text-signature-forest">
                    <Check size={14} /> Message sent successfully! We will get back to you soon.
                  </p>
                )}
                {status === 'error' && (
                  <p className="rounded-md border border-signature-coral/30 bg-signature-cream px-4 py-3 text-center font-sans text-[13px] font-medium text-signature-coral">
                    {errMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="button-primary font-sans w-full mt-2"
                >
                  {status === 'sending' ? 'Sending Message…' : 'Submit Message →'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

