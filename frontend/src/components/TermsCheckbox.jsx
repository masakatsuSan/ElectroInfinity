import { useState } from 'react'

const COLORS = {
  canvas: '#ffffff',
  ink: '#181d26',
  body: '#333840',
  muted: '#41454d',
  hairline: '#dddddd',
  link: '#1b61c9',
  coral: '#aa2d00',
  errorSurface: '#fff7f4',
  errorBorder: '#f0d6cd',
}

const TEXT_FONT = '"Haas", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

export default function TermsCheckbox({ checked, onChange, error, label = "I agree to the Terms & Conditions and Privacy Policy" }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms-agree"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer"
          style={{ accentColor: COLORS.ink }}
        />
        <label htmlFor="terms-agree" className="flex items-start gap-1 cursor-pointer" style={{ fontFamily: TEXT_FONT, fontSize: 13, lineHeight: 1.4, color: COLORS.body }}>
          <span>{label}</span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="font-semibold hover:no-underline"
            style={{ color: COLORS.link, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: TEXT_FONT }}
          >
            View Terms
          </button>
        </label>
      </div>
      {error && (
        <p style={{
          backgroundColor: COLORS.errorSurface,
          border: `1px solid ${COLORS.errorBorder}`,
          borderRadius: 10,
          padding: '12px 16px',
          color: COLORS.coral,
          fontFamily: TEXT_FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.35,
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}
      {showModal && <TermsModalContent onClose={() => setShowModal(false)} />}
    </>
  )
}

function TermsModalContent({ onClose }) {
  const [accepted, setAccepted] = useState(false)

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(24, 29, 38, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  }

  const modalStyle = {
    width: '100%',
    maxWidth: 560,
    maxHeight: '80vh',
    backgroundColor: COLORS.canvas,
    borderRadius: 12,
    border: `1px solid ${COLORS.hairline}`,
    boxShadow: '0 20px 60px rgba(24, 29, 38, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: `1px solid ${COLORS.hairline}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const bodyStyle = {
    padding: '20px 24px',
    overflowY: 'auto',
    fontFamily: TEXT_FONT,
    fontSize: 13,
    lineHeight: 1.6,
    color: COLORS.body,
  }

  const footerStyle = {
    padding: '16px 24px',
    borderTop: `1px solid ${COLORS.hairline}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const headingStyle = {
    fontFamily: '"Haas Groot Disp", "Haas", Inter, system-ui, sans-serif',
    fontSize: 18,
    fontWeight: 500,
    color: COLORS.ink,
    margin: 0,
  }

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    color: COLORS.muted,
    lineHeight: 1,
    padding: '4px 8px',
  }

  const sectionTitleStyle = {
    fontWeight: 600,
    color: COLORS.ink,
    fontSize: 13,
    marginTop: 14,
    marginBottom: 4,
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={headingStyle}>Terms &amp; Conditions</h2>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close">
            &times;
          </button>
        </div>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 12px', fontWeight: 500, color: COLORS.ink }}>
            Please read these Terms &amp; Conditions carefully before using the Electro Infinity platform.
          </p>

          <p style={sectionTitleStyle}>1. Account Access &amp; Security</p>
          <p style={{ margin: '0 0 8px' }}>
            You are solely responsible for maintaining the confidentiality of your account credentials (roll number, email, and password). You agree not to share your login credentials with any third party and to notify the administration immediately of any unauthorized use of your account. Electro Infinity is not liable for any loss or damage arising from your failure to protect your account security.
          </p>

          <p style={sectionTitleStyle}>2. Platform Terms</p>
          <p style={{ margin: '0 0 8px' }}>
            Electro Infinity is an educational platform providing department resources, lecture materials, discussion forums, and community features. You agree to use the platform only for legitimate educational purposes and not to misuse the platform or engage in any harmful, unauthorized, or illegal activities.
          </p>

          <p style={sectionTitleStyle}>3. Legal Disclaimer</p>
          <p style={{ margin: '0 0 8px' }}>
            Electro Infinity provides its services on an "as is" basis without warranties of any kind, whether express or implied. The platform is not responsible for any loss of data, communication failures, or interruptions in service. All content is provided for informational purposes only.
          </p>

          <p style={sectionTitleStyle}>4. Data &amp; Privacy</p>
          <p style={{ margin: '0 0 8px' }}>
            By using this platform, you consent to the collection and processing of your personal data as described in the Privacy Policy. Your institutional email and roll number are used for verification purposes only. We do not sell your personal information to third parties.
          </p>

          <p style={sectionTitleStyle}>5. Consent &amp; Agreement</p>
          <p style={{ margin: '0 0 8px' }}>
            By checking the agreement box, you acknowledge that you have read, understood, and agree to all terms outlined above. You may deactivate your account at any time by contacting the administration. These terms are subject to revision at any time. Continued use of the platform constitutes acceptance of revised terms.
          </p>
        </div>
        <div style={footerStyle}>
          <label className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: TEXT_FONT, fontSize: 13, color: COLORS.body }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="h-4 w-4"
              style={{ accentColor: COLORS.ink }}
            />
            I have read and agree to the terms
          </label>
          <button
            type="button"
            onClick={onClose}
            disabled={!accepted}
            className="button-primary"
            style={!accepted ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: COLORS.hairline, color: COLORS.muted, boxShadow: 'none' } : {}}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

