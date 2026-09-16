import SEO from '../components/SEO'

const sections = [
  {
    title: '1. Account Access & Security',
    content: 'You are solely responsible for maintaining the confidentiality of your account credentials, including your roll number, institutional email, and password. You agree not to share your login credentials with any third party and to notify the administration immediately of any unauthorized use of your account. Electro Infinity is not liable for any loss or damage arising from your failure to protect your account security.',
  },
  {
    title: '2. Platform Terms',
    content: 'Electro Infinity is an educational platform providing department resources, lecture materials, discussion forums, and community features. You agree to use the platform only for legitimate educational purposes and not to misuse the platform or engage in any harmful, unauthorized, or illegal activities.',
  },
  {
    title: '3. Legal Disclaimer',
    content: 'Electro Infinity provides its services on an "as is" basis without warranties of any kind, whether express or implied. The platform is not responsible for any loss of data, communication failures, or interruptions in service. All content is provided for informational purposes only.',
  },
  {
    title: '4. Data & Privacy',
    content: 'By using this platform, you consent to the collection and processing of your personal data as described in the Privacy Policy. Your institutional email and roll number are used for verification purposes only. We do not sell your personal information to third parties.',
  },
  {
    title: '5. Consent & Agreement',
    content: 'By accepting these terms, you acknowledge that you have read, understood, and agree to all terms outlined above. You may deactivate your account at any time by contacting the administration. These terms are subject to revision at any time. Continued use of the platform constitutes acceptance of revised terms.',
  },
]

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white text-ink pt-32 pb-24">
      <SEO
        title="Terms & Conditions | Electro Infinity"
        description="Terms and conditions for using the Electro Infinity educational platform."
        path="/terms-and-conditions"
      />

      <div className="mx-auto w-full max-w-3xl px-6 md:px-12">
        <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-wider text-signature-coral">
          Legal
        </span>
        <h1 className="font-display text-[36px] font-normal leading-tight tracking-tight text-ink md:text-[48px]">
          Terms &amp; Conditions
        </h1>
        <p className="mt-3 font-sans text-[14px] leading-relaxed text-muted">
          Last updated September 16, 2026
        </p>

        <div className="mt-10 divide-y divide-hairline border-y border-hairline">
          <div className="py-8 first:pt-2 last:pb-2">
            <p className="mb-5 font-sans text-[16px] font-medium leading-relaxed text-body">
              Please read these Terms &amp; Conditions carefully before using the Electro Infinity platform.
            </p>
          </div>

          {sections.map(section => (
            <div key={section.title} className="py-7">
              <h2 className="font-sans text-[16px] font-semibold leading-snug text-ink">
                {section.title}
              </h2>
              <p className="mt-3 font-sans text-[15px] leading-[1.8] text-body">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 font-sans text-[13px] leading-relaxed text-muted">
          For questions about these terms, contact the Electro Infinity administration through the department.
        </p>
      </div>
    </div>
  )
}
