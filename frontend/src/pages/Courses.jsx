import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SEMESTERS = [
  { sem: 3, subjects: [
      { code: 'PC-EE 301', name: 'Electric Circuit Theory', credits: 4 },
      { code: 'PC-EE 302', name: 'Analog Electronics', credits: 3 },
      { code: 'PC-EE 303', name: 'Electromagnetic field theory', credits: 3 },
      { code: 'ES-ME 301', name: 'Engineering Mechanics', credits: 3 },
      { code: 'BS-M 301', name: 'Mathematics-III', credits: 3 },
      { code: 'BS-EE301', name: 'Biology for Engineers', credits: 3 },
      { code: 'MC-EE 301', name: 'Indian Constitution', credits: 0 },
      { code: 'PC-EE 391', name: 'Electric Circuit Theory Lab', credits: 1 },
      { code: 'PC-EE 392', name: 'Analog Electronics Lab', credits: 1 },
      { code: 'PC-CS 391', name: 'Numerical Methods Lab', credits: 1 },
  ]},
  { sem: 4, subjects: [
      { code: 'PC-EE 401', name: 'Electric machine-I', credits: 3 },
      { code: 'PC-EE 402', name: 'Digital Electronic', credits: 3 },
      { code: 'PC-EE 403', name: 'Electrical & Electronics Measurement', credits: 3 },
      { code: 'ES-EE 401', name: 'Thermal Power Engineering', credits: 3 },
      { code: 'HM-EE401', name: 'Values and Ethics in profession', credits: 3 },
      { code: 'MC- EE401', name: 'Environmental Science', credits: 0 },
      { code: 'PC-EE 491', name: 'Electric machine-I lab', credits: 1 },
      { code: 'PC-EE 492', name: 'Digital electronics lab', credits: 1 },
      { code: 'PC-EE 493', name: 'Electrical & electronic measurement lab', credits: 1 },
      { code: 'ES-ME 491', name: 'Thermal power engineering lab', credits: 1 },
  ]},
  { sem: 5, subjects: [
      { code: 'PC-EE 501', name: 'Electric machine-II', credits: 3 },
      { code: 'PC-EE 502', name: 'Power system-I', credits: 3 },
      { code: 'PC-EE 503', name: 'Control system', credits: 3 },
      { code: 'PC-EE 504', name: 'Power electronics', credits: 3 },
      { code: 'PE-EE 501', name: 'Professional Elective I', credits: 3 },
      { code: 'OE-EE 501', name: 'Open Elective I', credits: 3 },
      { code: 'PC-EE 591', name: 'Electric Machine-II lab', credits: 1 },
      { code: 'PC-EE 592', name: 'Power system-I lab', credits: 1 },
      { code: 'PC-EE 593', name: 'Control system lab', credits: 1 },
      { code: 'PC-EE 594', name: 'Power Electronics lab', credits: 1 },
  ]},
  { sem: 6, subjects: [
      { code: 'PC-EE 601', name: 'Power System-II', credits: 3 },
      { code: 'PC-EE-602', name: 'Micro processor & micro controller', credits: 3 },
      { code: 'PE-EE 601', name: 'Professional Elective II', credits: 3 },
      { code: 'PE-EE 602', name: 'Professional Elective III', credits: 3 },
      { code: 'OE-EE 601', name: 'Open Elective II', credits: 3 },
      { code: 'HM-EE 601', name: 'Economics for Engineers', credits: 3 },
      { code: 'PC-EE 691', name: 'Power system-II lab', credits: 1 },
      { code: 'PC-EE692', name: 'Micro processor & microcontroller lab', credits: 1 },
      { code: 'PC-EE 681', name: 'Electrical & Electronic design lab', credits: 3 },
  ]},
  { sem: 7, subjects: [
      { code: 'PC-EE 701', name: 'Electric Drive', credits: 3 },
      { code: 'PE-EE 701', name: 'Professional Elective IV', credits: 3 },
      { code: 'OE-EE701', name: 'Open Elective III', credits: 3 },
      { code: 'OE-EE702', name: 'Open Elective IV', credits: 3 },
      { code: 'HM-EE701', name: 'Principle of Management', credits: 3 },
      { code: 'PC-EE 791', name: 'Electric Drive lab', credits: 1 },
      { code: 'PW-EE 781', name: 'Project stage-I', credits: 2 },
      { code: 'PW-EE782', name: 'Seminar', credits: 1 },
  ]},
  { sem: 8, subjects: [
      { code: 'PC-EE 801', name: 'Utilization of Electric Power', credits: 3 },
      { code: 'PE- EE 801', name: 'Professional Elective V', credits: 3 },
      { code: 'OE-EE 801', name: 'Open Elective V', credits: 3 },
      { code: 'PW-EE 881', name: 'Project stage-II', credits: 8 },
  ]}
]

export default function Courses() {
  const [open, setOpen] = useState(3) // Semester 3 open by default
  const navigate = useNavigate()

  return (
    <div className="page-wrap pt-32 pb-20 min-h-screen bg-canvas text-ink">
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        Curriculum
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-6 text-ink">
        Courses
      </h1>
      <p className="font-sans text-[21px] font-normal leading-relaxed text-ink-muted-80 max-w-[640px] mb-8">
        Semester-wise subjects under the MAKAUT-affiliated B.Tech Electrical Engineering curriculum.
      </p>



      <a
        href="#"
        className="inline-flex items-center gap-2 font-sans text-[14px] font-medium text-link hover:text-primary transition-all mb-12"
      >
        Download Full MAKAUT Syllabus (PDF) ↓
      </a>

      {/* Accordion */}
      <div className="border-t border-divider-soft">
        {SEMESTERS.map(s => (
          <div key={s.sem} className="border-b border-divider-soft">
            <button
              onClick={() => setOpen(open === s.sem ? null : s.sem)}
              className="w-full flex justify-between items-center py-6 text-left group"
            >
              <span className="font-display font-semibold text-[24px] text-ink group-hover:text-primary transition-colors">
                Semester {s.sem}
              </span>
              <span className="font-sans text-[24px] text-primary transition-transform duration-300">
                {open === s.sem ? '−' : '+'}
              </span>
            </button>

            {open === s.sem && (
              <div className="overflow-x-auto pb-6 animate-in fade-in duration-300">
                <table className="w-full min-w-[320px] font-sans text-[14px]">
                  <thead>
                    <tr className="border-b border-divider-soft">
                      <th className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 text-left py-3 pr-4">Code</th>
                      <th className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 text-left py-3 pr-4">Subject</th>
                      <th className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48 text-left py-3">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.subjects.map(sub => (
                      <tr 
                        key={sub.code} 
                        onClick={() => navigate(`/courses/${encodeURIComponent(sub.code)}`)}
                        className="border-b border-divider-soft last:border-b-0 hover:bg-surface-pearl hover:cursor-pointer transition-colors group"
                      >
                        <td className="font-sans text-[14px] text-primary py-4 px-4 font-semibold group-hover:text-ink transition-colors">{sub.code}</td>
                        <td className="font-sans text-[17px] py-4 pr-4 text-ink-muted-80 font-medium group-hover:text-ink transition-colors">
                          {sub.name}
                        </td>
                        <td className="font-sans text-[14px] py-4 text-ink-muted-80 flex items-center justify-between">
                          {sub.credits}
                          <span className="text-[18px] opacity-0 group-hover:opacity-100 transition-opacity text-primary pr-4">→</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="font-sans text-[12px] font-medium uppercase tracking-widest text-ink-muted-48 mt-8 mb-16">
        Sample codes — verify against current MAKAUT syllabus
      </p>

      {/* End of Content */}
    </div>
  )
}
