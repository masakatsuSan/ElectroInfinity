import SEO from '../components/SEO'
import { BRAND_NAME } from '../config/brand'

const sections = [
  {
    title: '1. Unofficial Status & Non-Affiliation',
    content: `${BRAND_NAME} is an independent, unofficial, open-source student project. It is not affiliated with, endorsed by, sponsored by, supervised by, or operated by Alipurduar Government Engineering & Management College (AGEMC), its Electrical Engineering department, any faculty member, or any official college body or administration. It is not an official college website, portal, or system, and it does not represent or speak on behalf of the college or the department. The college name and "AGEMC" are used only to identify the intended students. No college logo, emblem, or seal is used. Nothing published on this platform should be treated as an official notification, circular, notice, or result of the college or the department.`,
  },
  {
    title: '2. Unofficial Content — Verify Before You Rely On It',
    content: 'All content on this platform, including announcements, deadlines, class routines, calendar entries, faculty and laboratory listings, and downloadable resources, is collected and maintained by students for convenience only. It may be incomplete, inaccurate, or out of date. Do not rely on it for examinations, results, attendance, fees, scholarships, admissions, placements, or any other matter with real consequences. Always confirm such information with the college or the department through official channels at https://agemc.ac.in/ before acting on it.',
  },
  {
    title: '3. Account Access & Security',
    content: `You are solely responsible for maintaining the confidentiality of your account credentials, including your roll number, email address, and password. You agree not to share your login credentials with any third party and to notify the project maintainers immediately of any unauthorized use of your account. ${BRAND_NAME} is not liable for any loss or damage arising from your failure to protect your account security.`,
  },
  {
    title: '4. Platform Terms',
    content: `${BRAND_NAME} is an educational platform providing study material, discussion forums, and community features. You agree to use the platform only for legitimate educational purposes and not to misuse the platform or engage in any harmful, unauthorized, or illegal activities. You agree not to attempt to misrepresent yourself as a college official or faculty member, and not to use the platform to circulate unverified claims as official college information.`,
  },
  {
    title: '5. Legal Disclaimer',
    content: `${BRAND_NAME} provides its services on an "as is" basis without warranties of any kind, whether express or implied. The platform is not responsible for any loss of data, communication failures, or interruptions in service. All content is provided for informational purposes only. The student maintainers and contributors of this open-source project accept no liability for any reliance on, or loss arising from, content published here.`,
  },
  {
    title: '6. Open Source Licence',
    content: 'This project is open source and free to use, study, and modify. You are welcome to run your own instance for your own department or institution; if you do, please keep it clearly marked as unofficial in the same way this project does. Contributions are accepted under the same licence as the rest of the project.',
  },
  {
    title: '7. Data & Privacy',
    content: 'By using this platform, you consent to the collection and processing of your personal data as described in the Privacy Policy. Your email address and roll number are used for verification purposes only. We do not sell your personal information to third parties.',
  },
  {
    title: '8. Consent & Agreement',
    content: 'By accepting these terms, you acknowledge that you have read, understood, and agree to all terms outlined above. You may deactivate your account at any time by contacting the project maintainers. These terms are subject to revision at any time. Continued use of the platform constitutes acceptance of revised terms.',
  },
]

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white text-ink pt-32 pb-24">
      <SEO
        title={`Terms & Disclaimer | ${BRAND_NAME}`}
        description={`Terms, licence, and the unofficial non-affiliation disclaimer for the ${BRAND_NAME} student project.`}
        path="/terms-and-conditions"
      />

      <div className="mx-auto w-full max-w-3xl px-6 md:px-12">
        <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-wider text-signature-coral">
          Legal
        </span>
        <h1 className="font-display text-[36px] font-normal leading-tight tracking-tight text-ink md:text-[48px]">
          Terms &amp; Disclaimer
        </h1>
        <p className="mt-3 font-sans text-[14px] leading-relaxed text-muted">
          Last updated September 16, 2026
        </p>

        <div className="mt-8 border-2 border-ink p-6 md:p-8">
          <h2 className="font-sans text-[15px] font-semibold uppercase tracking-wide text-ink">
            This is an unofficial project
          </h2>
          <p className="mt-3 font-sans text-[15px] leading-[1.8] text-body">
            {BRAND_NAME} is an independent, unofficial, open-source project built by the seniors of the Electrical
            Engineering department for their juniors. It is <strong className="font-semibold text-ink">not affiliated with, endorsed by, or operated by Alipurduar Government Engineering &amp; Management College (AGEMC)</strong>, its department, faculty, or any official college body. For anything official, always go to the college directly at{' '}
            <a href="https://agemc.ac.in/" target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
              agemc.ac.in
            </a>
            .
          </p>
        </div>

        <div className="mt-10 divide-y divide-hairline border-y border-hairline">
          <div className="py-8 first:pt-2 last:pb-2">
            <p className="mb-5 font-sans text-[16px] font-medium leading-relaxed text-body">
              Please read these Terms &amp; Conditions carefully before using the {BRAND_NAME} platform.
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
          For questions about these terms, contact the {BRAND_NAME} student maintainers through the contact page.
        </p>
      </div>
    </div>
  )
}
